// Run production playback with controllable Web Audio nodes. A repeat gate
// alone cannot prevent an earlier long take overlapping the next action.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=[];
const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const ac={currentTime:2,destination:{},createBufferSource(){const s={playbackRate:{value:1},connect(){},start(){this.started=true},stop(){this.stopped=true}};nodes.push(s);return s},createGain(){return {gain:param(),connect(){}}}};
const c=vm.createContext({console,Math,Set,addEventListener(){},setInterval(){},setTimeout(){},G:{state:'PLAY'},performance:{now:()=>1000},MBUF:{}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/audio.js'),'utf8'),c);
c.ac=ac;
vm.runInContext('AC=ac;voxMech=()=>null;',c);
for(const k of ['hzd_atk1','hzd_atk2','hzd_charge','hzd_evo','hzd_hurt','hz_swing1']) c.MBUF[k]={sampleRate:100,length:10,getChannelData:()=>new Float32Array(10).fill(.4)};
assert(c.playBuf('hzd_atk1',.5)); const first=nodes.at(-1);
assert(c.playBuf('hz_swing1',.5)); assert(!first.stopped,'mechanical foley preserves voice');
assert(!c.playBuf('hzd_missing',.5));assert(!first.stopped,'missing new take preserves current voice');
assert(c.playBuf('hzd_atk2',.5));assert(first.stopped,'next vocal fades prior bark');
const second=nodes.at(-1);
assert(c.hzdHold('charge'));assert(second.stopped,'charge owns the voice channel');const held=nodes.at(-1);
assert(!c.playBuf('hzd_evo',.5));assert(!held.stopped,'readiness cue cannot interrupt held note');
assert(c.hzdSay('hurt',260));assert(held.stopped,'damage interrupts held note even inside the repeat gate');
const hurt=nodes.at(-1);c.G.state='DIALOG';c.narrativeAudioTick();assert(hurt.stopped,'dialogue silences existing vocal');
assert(!c.playBuf('hzd_atk1',.5));
console.log('PASS: vocal handoffs, uninterrupted foley, missing takes, charge ownership, damage and dialogue priority');
