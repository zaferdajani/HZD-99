const fs=require('node:fs');
const file='tests/run.cjs';let text=fs.readFileSync(file,'utf8');
text=text.replace('process.exit(failed ? 1 : 0);','process.exitCode = failed ? 1 : 0;');
text=text.replace("{ encoding: 'utf8', timeout: 300000 }","{ encoding: 'utf8', timeout: 300000, maxBuffer: 10 * 1024 * 1024 }");
fs.writeFileSync(file,text);
const wake='tests/wake.cjs';text=fs.readFileSync(wake,'utf8');
text=text.replace("if (key!==last) {trace.push(s);console.log(JSON.stringify(s));last=key;}","if (key!==last) {trace.push(s);if(trace.length<=80 || trace.length%100===0)console.log(JSON.stringify(s));last=key;}");
fs.writeFileSync(wake,text);
console.log('Regression exit waits for log flushing; full walkthrough trace remains in JSON');
