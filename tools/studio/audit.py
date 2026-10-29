#!/usr/bin/env python3
"""Evidence collector. Does not claim to replace the 15-role human/agent review."""
import argparse, base64, binascii, ctypes, datetime, hashlib, json, math, os, pathlib, re, signal, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
FOCUS = ['opening-order', 'textreveal', 'panels', 'caves-ch1', 'den-gate',
         'chapter-one', 'infection-eyes', 'infection-roster', 'wolves',
         'lion-studio', 'sage-quiet', 'story-rescue', 'mobile-platform', 'regress']

# Match tests/run.cjs instead of imposing one guessed outer deadline. The
# overhead covers its two served-build identity checks and server startup; it
# does not change or retry a harness's own deadline.
RUNNER_OVERHEAD_SECONDS = 180
SUBREAPER_ENABLED = None

def capture_log(path):
    """Hash and retain the SAME closed-file bytes; a rerun is not provenance."""
    payload = path.read_bytes()
    return {'log': path.name, 'sha256': hashlib.sha256(payload).hexdigest(),
            'bytes': len(payload), 'content_base64': base64.b64encode(payload).decode('ascii')}

def validate_logs(root, records):
    """Fail closed on post-capture changes, missing files or damaged snapshots."""
    files = []
    for record in records:
        if 'log' not in record:
            continue
        item = {'log': record['log'], 'disk_matches': False, 'snapshot_matches': False}
        try:
            payload = base64.b64decode(record['content_base64'], validate=True)
            item['snapshot_matches'] = (len(payload) == record['bytes'] and
                hashlib.sha256(payload).hexdigest() == record['sha256'])
            disk = (root / record['log']).read_bytes()
            item['disk_matches'] = disk == payload and item['snapshot_matches']
        except (OSError, KeyError, ValueError, TypeError, binascii.Error) as error:
            item['error'] = str(error)
        files.append(item)
    return {'ok': bool(files) and all(x['disk_matches'] and x['snapshot_matches'] for x in files),
            'files': files}

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

def browser_test(name, root=ROOT):
    """Return whether a harness directly requires Playwright's browser API."""
    path = pathlib.Path(root) / 'tests' / (name + '.cjs')
    try:
        source = path.read_text()
    except OSError:
        return False
    return bool(re.search(r"require\(\s*(['\"])playwright\1\s*\)", source))

def browser_block_reason(name, env=None, root=ROOT):
    """Fail closed before launch when the browser executable is unavailable."""
    env = os.environ if env is None else env
    if not browser_test(name, root):
        return None
    executable = pathlib.Path(env.get('CHROMIUM_PATH', '/opt/pw-browsers/chromium'))
    if not executable.is_file():
        return 'Chromium executable is missing: ' + str(executable)
    if not os.access(executable, os.X_OK):
        return 'Chromium executable is not executable: ' + str(executable)
    return None

def enable_subreaper():
    """Adopt detached test descendants so a successful leader cannot orphan them."""
    global SUBREAPER_ENABLED
    if SUBREAPER_ENABLED is not None:
        return SUBREAPER_ENABLED
    SUBREAPER_ENABLED = False
    if sys.platform.startswith('linux'):
        try:
            SUBREAPER_ENABLED = ctypes.CDLL(None).prctl(36, 1, 0, 0, 0) == 0
        except (AttributeError, OSError):
            pass
    return SUBREAPER_ENABLED

def direct_children():
    try:
        # This runner can sit inside a nested PID namespace while /proc is
        # mounted from the host namespace, so os.getpid() is not a /proc key.
        host_pid = int(pathlib.Path('/proc/self').resolve().name)
        children = set()
        for process in pathlib.Path('/proc').iterdir():
            if not process.name.isdigit():
                continue
            try:
                fields = {}
                for line in (process/'status').read_text().splitlines():
                    key, sep, value = line.partition(':')
                    if sep: fields[key] = value.strip()
                if int(fields.get('PPid', '-1')) != host_pid:
                    continue
                namespace_pids = fields.get('NSpid', fields.get('Pid', '')).split()
                if namespace_pids: children.add(int(namespace_pids[-1]))
            except (OSError, ValueError):
                continue
        return children
    except (OSError, ValueError):
        return set()

def stop_adopted_children(baseline):
    """Stop only children adopted during this owned run; preserve the audit server."""
    killed = set()
    for attempt in range(20):
        children = direct_children() - baseline
        if not children:
            break
        for pid in children:
            try: os.kill(pid, signal.SIGKILL); killed.add(pid)
            except ProcessLookupError: pass
        for pid in children:
            try: os.waitpid(pid, os.WNOHANG)
            except (ChildProcessError, ProcessLookupError): pass
        time.sleep(.01)
    return len(killed)

def stop_log_writers(log):
    """Kill detached descendants that still hold this exact log inode open."""
    proc_root = pathlib.Path('/proc')
    if os.name != 'posix' or not proc_root.is_dir():
        return 0
    try:
        target = os.fstat(log.fileno())
    except (OSError, ValueError):
        return 0
    killed = set()
    for attempt in range(20):
        writers = set()
        for process in proc_root.iterdir():
            if not process.name.isdigit() or int(process.name) == os.getpid():
                continue
            try:
                for fd in (process/'fd').iterdir():
                    try:
                        opened = fd.stat()
                    except OSError:
                        continue
                    if opened.st_dev == target.st_dev and opened.st_ino == target.st_ino:
                        writers.add(int(process.name)); break
            except (OSError, PermissionError):
                continue
        if not writers:
            break
        for pid in writers:
            try: os.kill(pid, signal.SIGKILL); killed.add(pid)
            except ProcessLookupError: pass
        time.sleep(.01)
    return len(killed)

def run_owned(cmd, *, cwd, log, timeout, env=None):
    """Run one owned process group and leave no descendant writing its log."""
    subreaper = enable_subreaper()
    baseline = direct_children() if subreaper else set()
    proc = subprocess.Popen(cmd, cwd=cwd, stdout=log, stderr=subprocess.STDOUT,
                            env=env, start_new_session=(os.name == 'posix'))
    try:
        code = proc.wait(timeout=timeout)
        # A runner can exit after spawning a detached browser/server helper that
        # inherited stdout.  Waiting for only the leader then hashing the log
        # races that writer.  This process group belongs solely to this check,
        # so close it before capture even when the leader returned normally.
        if os.name == 'posix':
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        if subreaper: stop_adopted_children(baseline)
        stop_log_writers(log)
        return code, 'pass' if code == 0 else 'fail'
    except subprocess.TimeoutExpired:
        if os.name == 'posix':
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        else:
            proc.kill()
        proc.wait()
        if subreaper: stop_adopted_children(baseline)
        stop_log_writers(log)
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
                 **capture_log(log)}
        campaign_result = out/'campaign-ch1'/'result.json'
        if name == 'campaign-ch1' and campaign_result.exists():
            entry['campaign'] = json.loads(campaign_result.read_text())
            entry['artifact'] = str(campaign_result.relative_to(out))
        report['results'].append(entry)
        (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
        print(name+': '+state, flush=True)
        return state == 'pass'
    def block(name, reason, timeout):
        log = out/(name+'.log')
        log.write_text('BLOCKED: '+reason+'\n')
        entry = {'name': name, 'status': 'blocked', 'exit_code': None,
                 'seconds': 0, 'timeout_seconds': timeout, 'reason': reason,
                 **capture_log(log)}
        report['results'].append(entry)
        (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
        print(name+': blocked', flush=True)
        return False
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
    run_env['env'].pop('CAMPAIGN_SEGMENT', None)
    run_env['env'].pop('CAMPAIGN_STOP', None)
    if ready:
        for name in names:
            if not (ROOT/'tests'/f'{name}.cjs').exists():
                report['results'].append({'name':name,'status':'missing'}); continue
            reason = browser_block_reason(name, run_env.get('env'))
            if reason:
                block(name, reason, suite[name])
            else:
                run(name, ['node','tests/run.cjs', name], suite[name])
        # and at the end: the served build must still be the one pinned at the start
        ready = identity('end', snapshot)
    report['complete_requested_scope'] = ready and len([x for x in report['results'] if x['name'] in names]) == len(names)
    # Preserve the captured execution even if a raw log is later lost, and never
    # certify a different/missing on-disk artifact from its stale recorded hash.
    integrity = validate_logs(out, report['results'])
    (out/'log-integrity.json').write_text(json.dumps(integrity, indent=2)+'\n')
    report['log_integrity'] = integrity
    report['passed'] = (report['complete_requested_scope'] and integrity['ok'] and
                        all(x['status']=='pass' for x in report['results']))
    report['finished_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (out/'results.json').write_text(json.dumps(report, indent=2)+'\n')
    lines = ['# Automated evidence', '', 'Base: `'+report['base_commit']+'`',
             'Scope: '+report['profile'], '', '| Check | Result | Evidence |', '|---|---|---|']
    lines += [f"| {x['name']} | {x['status']} | {x.get('log','missing')} |" for x in report['results']]
    lines += ['', '## Limits', *['- '+x for x in report['limitations']]]
    (out/'AUTOMATED.md').write_text('\n'.join(lines)+'\n')
    return 0 if report['passed'] else 1

if __name__ == '__main__': sys.exit(main())
