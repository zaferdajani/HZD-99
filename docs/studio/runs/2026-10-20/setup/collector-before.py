"""Run new corruption controls against inherited collector, without rewinding files."""
import pathlib, subprocess, types, unittest, importlib.util
root = pathlib.Path(__file__).resolve().parents[5]
spec = importlib.util.spec_from_file_location('controls', root/'tools/studio/test_audit.py')
controls = importlib.util.module_from_spec(spec)
spec.loader.exec_module(controls)
old = types.ModuleType('inherited_audit')
old.__file__ = str(root/'tools/studio/audit.py')
exec(subprocess.check_output(['git','show','f19aee0bc93400944402aeee45db00068abd8ebd:tools/studio/audit.py'], cwd=root), old.__dict__)
controls.audit = old
unittest.main(module=controls)
