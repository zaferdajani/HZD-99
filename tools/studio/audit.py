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
    def run(name, cmd, timeout):
        log = out/(name+'.log')
        started = datetime.datetime.now(datetime.timezone.utc)
        with log.open('w') as f:
            try:
                code = subprocess.run(cmd, cwd=ROOT, stdout=f, stderr=subprocess.STDOUT, timeout=timeout).returncode
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
    if ready:
        # An unrelated successful server on :8220 must never certify this checkout.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        def served():
            return opener.open('http://127.0.0.1:8220/index.html', timeout=3).read()
        try:
            try: body = served()
            except OSError:
                subprocess.Popen(['node','tests/serve.cjs'], cwd=ROOT,
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                 start_new_session=True)
                for attempt in range(20):
                    try: body = served(); break
                    except OSError: time.sleep(.25)
                else: raise RuntimeError('Local test server unavailable')
            expected = (ROOT/'index.html').read_bytes()
            if body != expected: raise RuntimeError('Port 8220 serves a different build; stop its owner or isolate the checkout')
            report['server_sha256'] = hashlib.sha256(body).hexdigest()
        except Exception as e:
            report['results'].append({'name':'server-identity','status':'blocked','reason':str(e)})
            ready = False
    if ready:
        for name in names:
            if not (ROOT/'tests'/f'{name}.cjs').exists():
                report['results'].append({'name':name,'status':'missing'}); continue
            run(name, ['node','tests/run.cjs', name], 960 if name == 'opening-order' else 360)
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
