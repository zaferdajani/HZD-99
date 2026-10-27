"""Collector regressions: runner budgets and timeout descendant cleanup."""
import importlib.util
import base64
import hashlib
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest

SPEC = importlib.util.spec_from_file_location('studio_audit', Path(__file__).with_name('audit.py'))
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class AuditBudgets(unittest.TestCase):
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
