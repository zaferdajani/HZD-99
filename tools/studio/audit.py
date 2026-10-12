#!/usr/bin/env python3
"""Evidence collector. Does not claim to replace the 15-role human/agent review."""
import argparse, datetime, hashlib, json, math, os, pathlib, re, signal, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
FOCUS = ['opening-order', 'textreveal', 'panels', 'caves-ch1', 'den-gate',
         'chapter-one', 'infection-eyes', 'infection-roster', 'wolves',
         'lion-studio', 'sage-quiet', 'story-rescue', 'mobile-platform', 'regress']

# Match the runner's declared budgets, including its default, rather than
# cutting the real-input campaign off at the old six-minute collector limit.
# The extra 180 seconds covers the runner's two 60-second identity checks and
# server startup; it does not change or retry the harness's own deadline.
RUNNER_OVERHEAD_SECONDS = 180

def suite_budgets(source):
    suite_match = re.search(r"const SUITE = \[(.*?)\n\];", source, re.S)
    default_match = re.search(r"timeout:\s*\(opt && opt\.timeout\) \|\| (\d+)", source)
    if not suite_match or not default_match:
        raise ValueError('Cannot read test runner suite/default timeout; refusing guessed coverage')
    default_ms = int(default_match.group(1))
    budgets = {}
    for line in suite_match.group(1).splitlines():
        entry = re.match(r"\s*\['([^']+)'", line)
        if not entry:
            continue
        # Options follow the description string. Do not accidentally treat
        # the word timeout in a human description as an option.
        option = re.search(r",\s*\{([^{}]*)\}\s*\]", line)
        options = option.group(1) if option else ''
        timeout = re.search(r"\btimeout\s*:\s*(\d+)\s*(?:,|$)", options)
        if re.search(r"\btimeout\s*:", options) and not timeout:
            raise ValueError('Unsupported timeout metadata for '+entry.group(1))
        ms = int(timeout.group(1)) if timeout else default_ms
        if ms <= 0 or entry.group(1) in budgets:
            raise ValueError('Invalid/duplicate test metadata: '+entry.group(1))
        budgets[entry.group(1)] = math.ceil(ms / 1000) + RUNNER_OVERHEAD_SECONDS
    if not budgets:
        raise ValueError('No test harnesses found; refusing empty coverage')
    return budgets

def run_owned(cmd, *, cwd, log, timeout, env=None):
    """Kill our entire runner/harness process group if the outer budget expires.

    subprocess.run kills only the runner; its harness/browser could continue
    consuming CPU and writing evidence while the next check starts. The new
    session belongs solely to this command, never to an existing test server.
    """
    proc = subprocess.Popen(cmd, cwd=cwd, stdout=log, stderr=subprocess.STDOUT,
                            env=env, start_new_session=(os.name == 'posix'))
    try:
        code = proc.wait(timeout=timeout)
        return code, 'pass' if code == 0 else 'fail'
    except subprocess.TimeoutExpired:
        if os.name == 'posix':
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        else:
            proc.kill()
        proc.wait()
        log.write('\nCollector timeout after '+str(timeout)+' seconds; owned process group terminated.\n')
        log.flush()
        return None, 'timeout'

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--profile', choices=['focus', 'full'], default='full')
    p.add_argument('--output', required=True)
    p.add_argument('--tests', nargs='+', help='Explicit subset, reported as partial')
    args = p.parse_args()
    out = pathlib.Path(args.output).resolve(); out.mkdir(parents=True, exist_ok=True)
    suite = suite_budgets((ROOT/'tests/run.cjs').read_text())
    names = args.tests or (list(suite) if args.profile == 'full' else FOCUS)
    unknown = set(names)-set(suite)
    if unknown: p.error('Unknown tests: '+', '.join(sorted(unknown)))
    def git(*cmd):
        return subprocess.check_output(['git', *cmd], cwd=ROOT, text=True).strip()
    report = {'started_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'base_commit': git('rev-parse', 'HEAD'), 'dirty_at_start': git('status', '--porcelain'),
              'profile': 'subset' if args.tests else args.profile, 'results': [],
              'limitations': ['Most harnesses stage saves or positions. campaign-ch1 is the only uninterrupted real-input playthrough, and only when this run includes it.',
                              'The opening phone check uses a mobile viewport with keyboard traversal; it is not a full touch-control playthrough.',
                              'Visual quality and all 15 role reviews require separate signed findings.']}
    run_env = {}
    def run(name, cmd, timeout):
        log = out/(name+'.log')
        started = datetime.datetime.now(datetime.timezone.utc)
        with log.open('w') as f:
            try:
                code, state = run_owned(cmd, cwd=ROOT, log=f, timeout=timeout, env=run_env.get('env'))
            except OSError as e: f.write(str(e)); code, state = None, 'blocked'
        entry = {'name': name, 'status': state, 'exit_code': code,
                 'seconds': (datetime.datetime.now(datetime.timezone.utc)-started).total_seconds(),
                 'timeout_seconds': timeout,
                 'log': log.name, 'sha256': hashlib.sha256(log.read_bytes()).hexdigest()}
        campaign_result = out/'campaign-ch1'/'result.json'
        if name == 'campaign-ch1' and campaign_result.exists():
            entry['campaign'] = json.loads(campaign_result.read_text())
            entry['artifact'] = str(campaign_result.relative_to(out))
        report['results'].append(entry)
        (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
        print(name+': '+state, flush=True)
        return state == 'pass'
    ready = run('build', ['node', 'build.cjs'], 180)
    if ready and 'platform' in names: ready = run('pack', ['node', 'tools/pack-www.cjs'], 180)
    snapshot = out/'served-identity.json'
    def identity(when, expect=None):
        # ONE rule for the runner and the collector: tests/served-identity.cjs
        # hashes the two pages and a few loose assets as served on :8220 and
        # compares them with this checkout (or with the pinned snapshot).
        cmd = ['node', 'tests/served-identity.cjs', '--json']
        cmd += ['--expect', str(expect)] if expect else ['--write', str(snapshot)]
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=120)
        try: res = json.loads(r.stdout)
        except ValueError: res = {'ok': False, 'error': (r.stderr or r.stdout).strip()}
        entry = {'name': 'server-identity', 'when': when, 'status': 'pass' if r.returncode == 0 and res.get('ok') else 'blocked',
                 'files': {p: (e.get('served') or {}).get('sha256') for p, e in res.get('files', {}).items()}}
        if entry['status'] != 'pass':
            entry['reason'] = ('Port 8220 serves a different build than this checkout; stop its owner or isolate the checkout'
                               if when == 'start' else 'The served build changed during the audit; every browser result is suspect')
            entry['detail'] = r.stderr.strip() or res.get('error') or res
            print(r.stderr, file=sys.stderr, flush=True)
        report['results'].append(entry)
        (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
        return entry['status'] == 'pass'
    if ready:
        # An unrelated successful server on :8220 must never certify this checkout.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        def alive():
            try: opener.open('http://127.0.0.1:8220/index.html', timeout=3).read(1); return True
            except OSError: return False
        if not alive():
            subprocess.Popen(['node','tests/serve.cjs'], cwd=ROOT,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)
            for attempt in range(20):
                if alive(): break
                time.sleep(.25)
        # pin the build once for the whole audit: every run.cjs below compares
        # against this snapshot, so a rebuild between two checks is caught too
        ready = identity('start')
        if ready: report['server_sha256'] = json.loads(snapshot.read_text())['files']['index.html']['sha256']
    run_env['env'] = dict(os.environ, SERVED_IDENTITY_EXPECT=str(snapshot),
                          CAMPAIGN_OUT=str(out/'campaign-ch1'))
    # A studio full-run is always a clean campaign. Developer segment/stop
    # variables inherited from the caller may produce useful diagnostics, but
    # they must never enter the publication gate by accident.
    run_env['env'].pop('CAMPAIGN_SEGMENT', None)
    run_env['env'].pop('CAMPAIGN_STOP', None)
    if ready:
        for name in names:
            if not (ROOT/'tests'/f'{name}.cjs').exists():
                report['results'].append({'name':name,'status':'missing'}); continue
            run(name, ['node','tests/run.cjs', name], suite[name])
        # and at the end: the served build must still be the one pinned at the start
        ready = identity('end', snapshot)
    report['complete_requested_scope'] = ready and len([x for x in report['results'] if x['name'] in names]) == len(names)
    report['passed'] = report['complete_requested_scope'] and all(x['status']=='pass' for x in report['results'])
    report['finished_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
    lines = ['# Automated evidence', '', 'Base: `'+report['base_commit']+'`',
             'Scope: '+report['profile'], '', '| Check | Result | Evidence |', '|---|---|---|']
    lines += [f"| {x['name']} | {x['status']} | {x.get('log','missing')} |" for x in report['results']]
    lines += ['', '## Limits', *['- '+x for x in report['limitations']]]
    (out/'AUTOMATED.md').write_text('\n'.join(lines)+'\n')
    return 0 if report['passed'] else 1

if __name__ == '__main__': sys.exit(main())
