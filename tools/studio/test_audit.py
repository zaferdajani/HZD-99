"""Collector regressions: runner budgets and timeout descendant cleanup."""
import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest

SPEC = importlib.util.spec_from_file_location('studio_audit', Path(__file__).with_name('audit.py'))
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)

class DeniedSocket:
    def __init__(self, *_): raise OSError(1, 'Operation not permitted')


class AuditBudgets(unittest.TestCase):
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


class AuditPreflightTests(unittest.TestCase):
    def make_repo(self):
        tmp = tempfile.TemporaryDirectory(); root = Path(tmp.name); (root/'tests').mkdir()
        (root/'tests/run.cjs').write_text("const SUITE = [['source','x',{noBrowser:true}],['direct','x'],['transitive','x']];\n")
        (root/'tests/source.cjs').write_text("require('playwright');\n")
        (root/'tests/direct.cjs').write_text("require('playwright');\n")
        (root/'tests/transitive.cjs').write_text("require('../helper.cjs');\n")
        (root/'helper.cjs').write_text("require('playwright');\n")
        return tmp, root

    def test_no_browser_contract_wins(self):
        tmp, root = self.make_repo(); self.addCleanup(tmp.cleanup)
        self.assertFalse(audit.browser_test('source', root))

    def test_direct_and_transitive_browser_detection(self):
        tmp, root = self.make_repo(); self.addCleanup(tmp.cleanup)
        self.assertTrue(audit.browser_test('direct', root))
        self.assertTrue(audit.browser_test('transitive', root))

    def test_missing_executable_blocks(self):
        tmp, root = self.make_repo(); self.addCleanup(tmp.cleanup)
        self.assertIn('missing', audit.browser_block_reason('direct', {'CHROMIUM_PATH':'/definitely/missing'}, root).lower())

    def test_unix_socket_denial_blocks(self):
        tmp, root = self.make_repo(); self.addCleanup(tmp.cleanup)
        exe = Path(tmp.name)/'chromium'; exe.write_text('#!/bin/sh\n'); exe.chmod(0o755)
        reason = audit.browser_block_reason('direct', {'CHROMIUM_PATH':str(exe)}, root, DeniedSocket)
        self.assertIn('unix socket', reason.lower())


if __name__ == '__main__':
    unittest.main()
