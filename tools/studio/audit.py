#!/usr/bin/env python3
"""Evidence collector. Does not claim to replace the 15-role human/agent review."""
import argparse, datetime, hashlib, json, os, pathlib, re, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
FOCUS = ['opening-order', 'textreveal', 'panels', 'caves-ch1', 'den-gate',
         'chapter-one', 'infection-eyes', 'infection-roster', 'wolves',
         'lion-studio', 'sage-quiet', 'story-rescue', 'mobile-platform', 'regress']

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--profile', choices=['focus', 'full'], default='full')
    p.add_argument('--output', required=True)
    p.add_argument('--tests', nargs='+', help='Explicit subset, reported as partial')
    args = p.parse_args()
    out = pathlib.Path(args.output).resolve(); out.mkdir(parents=True, exist_ok=True)
    suite = re.findall(r"^\s*\['([^']+)'", (ROOT/'tests/run.cjs').read_text(), re.M)
    names = args.tests or (suite if args.profile == 'full' else FOCUS)
    unknown = set(names)-set(suite)
    if unknown: p.error('Unknown tests: '+', '.join(sorted(unknown)))
    def git(*cmd):
        return subprocess.check_output(['git', *cmd], cwd=ROOT, text=True).strip()
    report = {'started_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'base_commit': git('rev-parse', 'HEAD'), 'dirty_at_start': git('status', '--porcelain'),
              'profile': 'subset' if args.tests else args.profile, 'results': [],
              'limitations': ['Automated harnesses include staged saves; not an uninterrupted campaign.',
                              'Visual quality and all 15 role reviews require separate signed findings.']}
    run_env = {}
    def run(name, cmd, timeout):
        log = out/(name+'.log')
        started = datetime.datetime.now(datetime.timezone.utc)
        with log.open('w') as f:
            try:
                code = subprocess.run(cmd, cwd=ROOT, stdout=f, stderr=subprocess.STDOUT, timeout=timeout,
                                      env=run_env.get('env')).returncode
                state = 'pass' if code == 0 else 'fail'
            except subprocess.TimeoutExpired: code, state = None, 'timeout'
            except OSError as e: f.write(str(e)); code, state = None, 'blocked'
        report['results'].append({'name': name, 'status': state, 'exit_code': code,
                                  'seconds': (datetime.datetime.now(datetime.timezone.utc)-started).total_seconds(),
                                  'log': log.name, 'sha256': hashlib.sha256(log.read_bytes()).hexdigest()})
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
    run_env['env'] = dict(os.environ, SERVED_IDENTITY_EXPECT=str(snapshot))
    if ready:
        for name in names:
            if not (ROOT/'tests'/f'{name}.cjs').exists():
                report['results'].append({'name':name,'status':'missing'}); continue
            run(name, ['node','tests/run.cjs', name], 960 if name == 'opening-order' else 360)
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
