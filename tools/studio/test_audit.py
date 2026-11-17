#!/usr/bin/env python3
import importlib.util, os, pathlib, tempfile, unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('studio_audit', HERE/'audit.py')
audit = importlib.util.module_from_spec(spec); spec.loader.exec_module(audit)

class DeniedSocket:
    def __init__(self, *_): raise OSError(1, 'Operation not permitted')

class AuditPreflightTests(unittest.TestCase):
    def make_repo(self):
        tmp = tempfile.TemporaryDirectory(); root = pathlib.Path(tmp.name); (root/'tests').mkdir()
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
        exe = pathlib.Path(tmp.name)/'chromium'; exe.write_text('#!/bin/sh\n'); exe.chmod(0o755)
        reason = audit.browser_block_reason('direct', {'CHROMIUM_PATH':str(exe)}, root, DeniedSocket)
        self.assertIn('unix socket', reason.lower())

if __name__ == '__main__': unittest.main()
