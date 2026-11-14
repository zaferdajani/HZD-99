"""Collector regressions: runner budgets and timeout descendant cleanup."""
import importlib.util
import base64
import hashlib
import os
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest

SPEC = importlib.util.spec_from_file_location('studio_audit', Path(__file__).with_name('audit.py'))
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class AuditBudgets(unittest.TestCase):
    def test_final_log_is_atomic_and_immune_to_late_raw_path_reuse(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            raw = root / 'sample.log.running'
            final = root / 'sample.log'
            original = b'header\nPASS actual assertion\n'
            raw.write_bytes(original)
            record = audit.finalize_log(raw, final)
            self.assertFalse(raw.exists())
            self.assertEqual(final.read_bytes(), original)
            self.assertTrue(audit.validate_logs(root, [record])['ok'])

            # A late process reopening the old temporary pathname cannot alter
            # the canonical file or the already captured evidence bytes.
            raw.write_bytes(b'late detached writer\n')
            self.assertEqual(final.read_bytes(), original)
            self.assertTrue(audit.validate_logs(root, [record])['ok'])

    def test_delayed_closed_log_flush_settles_before_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = Path(tmp) / 'delayed.log'
            log.write_text('first\n')
            writer = threading.Timer(.12, lambda: log.write_text('first\nlate\n'))
            writer.start()
            started = time.monotonic()
            self.assertTrue(audit.wait_log_quiet(log, quiet_seconds=.2,
                                                deadline_seconds=1.5))
            writer.join()
            self.assertGreaterEqual(time.monotonic() - started, .25)
            record = audit.capture_log(log)
            self.assertEqual(base64.b64decode(record['content_base64']), b'first\nlate\n')
            self.assertTrue(audit.validate_logs(Path(tmp), [record])['ok'])

    def test_browser_preflight_blocks_only_browser_harnesses(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'tests').mkdir()
            (root / 'tests' / 'visual.cjs').write_text(
                "const { chromium } = require('playwright');\n")
            (root / 'tests' / 'contract.cjs').write_text("console.log('source only');\n")
            missing = root / 'no-browser'
            env = {'CHROMIUM_PATH': str(missing)}
            self.assertTrue(audit.browser_test('visual', root))
            self.assertFalse(audit.browser_test('contract', root))
            self.assertIn('missing', audit.browser_block_reason('visual', env, root))
            self.assertIsNone(audit.browser_block_reason('contract', env, root))

    def test_runner_never_labels_playwright_harness_browser_free(self):
        source = (audit.ROOT / 'tests/run.cjs').read_text()
        suite = source.split('const SUITE = [', 1)[1].split('\n];', 1)[0]
        marked = []
        for line in suite.splitlines():
            name = __import__('re').match(r"\s*\['([^']+)'", line)
            if name and __import__('re').search(r'\bnoBrowser\s*:\s*true\b', line):
                marked.append(name.group(1))
        mislabeled = [name for name in marked if audit.browser_test(name)]
        self.assertEqual(mislabeled, [],
            'Playwright harnesses bypassed runner browser identity/preflight: ' + ', '.join(mislabeled))

    @unittest.skipUnless(os.name == 'posix', 'executable-bit regression requires POSIX')
    def test_browser_preflight_accepts_an_executable(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'tests').mkdir()
            (root / 'tests' / 'visual.cjs').write_text(
                'const { chromium } = require("playwright");\n')
            browser = root / 'chromium'
            browser.write_text('#!/bin/sh\nexit 0\n')
            browser.chmod(0o755)
            class SocketProbe:
                def close(self): pass
            self.assertIsNone(audit.browser_block_reason(
                'visual', {'CHROMIUM_PATH': str(browser)}, root,
                socket_factory=lambda *_: SocketProbe()))

    @unittest.skipUnless(os.name == 'posix', 'Unix-socket regression requires POSIX')
    def test_browser_preflight_blocks_when_unix_sockets_are_forbidden(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'tests').mkdir()
            (root / 'tests' / 'visual.cjs').write_text(
                'const { chromium } = require("playwright");\n')
            browser = root / 'chromium'
            browser.write_text('#!/bin/sh\nexit 0\n')
            browser.chmod(0o755)
            def forbidden(*_):
                raise PermissionError(1, 'Operation not permitted')
            reason = audit.browser_block_reason(
                'visual', {'CHROMIUM_PATH': str(browser)}, root,
                socket_factory=forbidden)
            self.assertIn('Unix socket', reason)

    def test_log_snapshot_survives_later_truncation_and_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            log = root / 'sample.log'
            original = b'header\nPASS actual assertion\n'
            log.write_bytes(original)
            record = audit.capture_log(log)
            self.assertEqual(base64.b64decode(record['content_base64']), original)
            self.assertEqual(record['sha256'], hashlib.sha256(original).hexdigest())
            self.assertTrue(audit.validate_logs(root, [record])['ok'])
            log.write_bytes(b'header\n')
            result = audit.validate_logs(root, [record])
            self.assertFalse(result['ok'])
            self.assertFalse(result['files'][0]['disk_matches'])
            self.assertTrue(result['files'][0]['snapshot_matches'])
            self.assertEqual(base64.b64decode(record['content_base64']), original)
            log.unlink()
            self.assertFalse(audit.validate_logs(root, [record])['ok'])

    def test_malformed_or_tampered_snapshot_is_not_certified(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            log = root / 'sample.log'
            log.write_bytes(b'ok\n')
            record = audit.capture_log(log)
            record['content_base64'] = base64.b64encode(b'false pass\n').decode()
            self.assertFalse(audit.validate_logs(root, [record])['ok'])
            record['content_base64'] = '***'
            self.assertFalse(audit.validate_logs(root, [record])['ok'])

    def test_actual_runner_deadlines_are_preserved(self):
        budgets = audit.suite_budgets((audit.ROOT / 'tests/run.cjs').read_text())
        self.assertEqual(budgets['campaign-ch1'], 3600 + 180)
        self.assertEqual(budgets['infection-poses'], 420 + 180)
        self.assertEqual(budgets['infection-roster'], 240 + 180)
        self.assertEqual(budgets['opening-order'], 900 + 180)
        self.assertEqual(budgets['textreveal'], 300 + 180)

    def test_unreadable_or_invalid_metadata_fails_closed(self):
        with self.assertRaises(ValueError):
            audit.suite_budgets('')
        source = "const SUITE = [\n ['example', 'description', { timeout: LONG_BUDGET }],\n];\ntimeout: (opt && opt.timeout) || 300000"
        with self.assertRaises(ValueError):
            audit.suite_budgets(source)

    def test_process_status_preserved(self):
        with tempfile.TemporaryFile(mode='w+') as log:
            self.assertEqual(audit.run_owned([sys.executable, '-c', 'raise SystemExit(7)'],
                             cwd=audit.ROOT, log=log, timeout=5), (7, 'fail'))
            self.assertEqual(audit.run_owned([sys.executable, '-c', 'print("ok")'],
                             cwd=audit.ROOT, log=log, timeout=5), (0, 'pass'))

    @unittest.skipUnless(Path('/proc/self').is_dir(), 'namespace PID regression requires procfs')
    def test_namespace_pid_matches_current_process(self):
        self.assertEqual(audit.namespace_pid(Path('/proc/self')), os.getpid())

    @unittest.skipUnless(os.name == 'posix', 'process-group regression requires POSIX')
    def test_completed_parent_stops_descendant_output_before_capture(self):
        with tempfile.TemporaryDirectory() as tmp:
            child = Path(tmp) / 'child.py'
            heartbeat = Path(tmp) / 'heartbeat'
            child.write_text('import time,pathlib\n'
                f'p=pathlib.Path({str(heartbeat)!r})\n'
                'while True:\n'
                ' with p.open("a") as f: f.write("tick\\n")\n'
                ' print("late child output", flush=True)\n'
                ' time.sleep(.03)\n')
            parent = ('import subprocess,sys,time; '
                      f'subprocess.Popen([sys.executable, {str(child)!r}]); '
                      'time.sleep(.2)')
            with (Path(tmp) / 'owned.log').open('w+') as log:
                self.assertEqual(audit.run_owned([sys.executable, '-c', parent],
                    cwd=tmp, log=log, timeout=5), (0, 'pass'))
                self.assertTrue(heartbeat.exists(), 'child must have actually started')
                before_log = log.tell()
                before_heartbeat = heartbeat.read_bytes()
                time.sleep(.2)
                self.assertEqual(log.tell(), before_log, 'completed child kept mutating the log')
                self.assertEqual(heartbeat.read_bytes(), before_heartbeat,
                                 'completed child survived owned-group cleanup')

    @unittest.skipUnless(os.name == 'posix' and Path('/proc').is_dir(),
                         'detached-writer regression requires procfs')
    def test_completed_parent_stops_detached_log_writer(self):
        with tempfile.TemporaryDirectory() as tmp:
            child = Path(tmp) / 'child.py'
            heartbeat = Path(tmp) / 'heartbeat'
            child.write_text('import time,pathlib\n'
                f'p=pathlib.Path({str(heartbeat)!r})\n'
                'while True:\n'
                ' with p.open("a") as f: f.write("tick\\n")\n'
                ' print("detached output", flush=True)\n'
                ' time.sleep(.03)\n')
            parent = ('import subprocess,sys,time; '
                      f'subprocess.Popen([sys.executable, {str(child)!r}], start_new_session=True); '
                      'time.sleep(.2)')
            with (Path(tmp) / 'detached.log').open('w+') as log:
                self.assertEqual(audit.run_owned([sys.executable, '-c', parent],
                    cwd=tmp, log=log, timeout=5), (0, 'pass'))
                self.assertTrue(heartbeat.exists(), 'detached child must have started')
                before_log = log.tell()
                before_heartbeat = heartbeat.read_bytes()
                time.sleep(.2)
                self.assertEqual(log.tell(), before_log, 'detached child kept mutating the log')
                self.assertEqual(heartbeat.read_bytes(), before_heartbeat,
                                 'detached child survived exact-log cleanup')

    @unittest.skipUnless(os.name == 'posix', 'process-group regression requires POSIX')
    def test_timeout_stops_descendant_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            child = Path(tmp) / 'child.py'
            heartbeat = Path(tmp) / 'heartbeat'
            child.write_text('import signal,time,pathlib\n'
                'signal.signal(signal.SIGTERM, signal.SIG_IGN)\n'
                f'p=pathlib.Path({str(heartbeat)!r})\n'
                'while True:\n'
                ' with p.open("a") as f: f.write("tick\\n")\n'
                ' time.sleep(.03)\n')
            parent = ('import subprocess,sys,time; '
                      f'subprocess.Popen([sys.executable, {str(child)!r}]); '
                      'time.sleep(30)')
            with tempfile.TemporaryFile(mode='w+') as log:
                self.assertEqual(audit.run_owned([sys.executable, '-c', parent],
                    cwd=tmp, log=log, timeout=.8), (None, 'timeout'))
                log.seek(0)
                self.assertIn('owned process group terminated', log.read())
            self.assertTrue(heartbeat.exists(), 'child must have actually started')
            before = heartbeat.read_bytes()
            time.sleep(.2)
            self.assertEqual(heartbeat.read_bytes(), before, 'timed-out child continued writing')


if __name__ == '__main__':
    unittest.main()
