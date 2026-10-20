// The evidence collector must retain captured bytes and detect later corruption.
const {spawnSync}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const result=spawnSync(process.env.PYTHON||'python',['-m','unittest','tools/studio/test_audit.py'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
assert.equal(result.status,0,'collector contract suite must pass');
