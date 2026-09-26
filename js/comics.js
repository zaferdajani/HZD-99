// Content-only milestone rewards. The manifest cannot execute code or grant items.
const ComicRewards = (() => {
  const fact = (save, id) => {
    const f = save.flags || {};
    switch (id) {
      case 'awakened': return !!f.woke;
      case 'ratchet-restored': return !!f['on_A0B|ratchet'];
      case 'volt-pack': return !!f.heal;
      case 'servo-restored': return !!f['on_A1|servo'];
      case 'raw-marble': return !!(f.pl_cshard || (save.bag || {}).cshard || f.crystal);
      case 'first-sword': return !!f.crystal;
      case 'first-sage': return !!f.sageTame_GA1D;
      case 'chime-silenced': return !!f.bossChime;
      case 'nullfang-freed': return !!f.bossGlitch;
      case 'talonhost-freed': return !!f.bossBrood;
      case 'furnace-freed': return !!f.bossAtlas;
      case 'glaciere-freed': return !!f.bossZero;
      case 'prism-freed': return !!f.bossPrism;
      case 'mother-freed': return !!save.won;
      case 'first-rescue': return Object.values(save.rescues || {}).includes('rescued');
      default: return false;
    }
  };
  const milestones = ['awakened','ratchet-restored','volt-pack','servo-restored','raw-marble',
    'first-sword','first-sage','chime-silenced','nullfang-freed','talonhost-freed',
    'furnace-freed','glaciere-freed','prism-freed','mother-freed','first-rescue'];
  function validate(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.chapters) || data.chapters.length > 100)
      throw Error('Unsupported comic manifest');
    const ids = new Set();
    for (const ch of data.chapters) {
      if (!ch || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(ch.id) || ids.has(ch.id)) throw Error('Invalid/duplicate chapter ID');
      ids.add(ch.id);
      if (typeof ch.title !== 'string' || !ch.title.trim() || ch.title.length > 160 || !['draft','published'].includes(ch.status)) throw Error('Invalid chapter title/status');
      if (!Number.isInteger(ch.revision) || ch.revision < 1) throw Error('Invalid revision');
      if (!Array.isArray(ch.unlock) || !ch.unlock.length || ch.unlock.some(m => !milestones.includes(m))) throw Error('Unknown milestone');
      if (!Array.isArray(ch.slides) || !ch.slides.length || ch.slides.length > 100) throw Error('Invalid slide list');
      for (const s of ch.slides) {
        if (!s || typeof s.src !== 'string' || !/^assets\/manhua\/[a-zA-Z0-9_/-]+\.(webp|png|jpg|jpeg)$/.test(s.src)
          || s.src.includes('..') || s.src.includes('//')) throw Error('Slide must be a local comic image');
        if (typeof s.alt !== 'string' || !s.alt.trim() || s.alt.length > 4000) throw Error('Missing slide description');
        if (s.caption != null && (typeof s.caption !== 'string' || s.caption.length > 5000)) throw Error('Invalid transcript');
        if (!['still','drift-left','drift-right','push-in'].includes(s.motion || 'still')) throw Error('Invalid motion');
        if (s.seconds != null && (!Number.isFinite(s.seconds) || s.seconds < 4 || s.seconds > 60)) throw Error('Slide duration must be 4–60 seconds');
      }
    }
    return data;
  }
  const available = (save, manifest) => !save || save.theme === 'hero' ? [] : manifest.chapters.filter(ch =>
    ch.status === 'published' && ch.unlock.every(id => fact(save, id)));
  let manifest = {version:1, chapters:[]}, loaded = false, loading = null, lastFetch = 0;
  let root, body, heading, status, returnState, sessionSave, focusBefore, chapter, slide = 0;
  let elapsed = 0, autoplay = false, decoded = false, mode = '', cooldown = 0, readyFor = 0;
  let savedRef, seenInput = false, screenSerial = 0, libraryIndex = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function progress() {
    if (!G.save.comics || typeof G.save.comics !== 'object') G.save.comics = {};
    return G.save.comics;
  }
  function clearInput() {
    if (typeof releaseInput === 'function') releaseInput();
    for (const k in keys) delete keys[k];
    for (const k in keysP) delete keysP[k];
    if (typeof clearP === 'function') clearP();
    if (player) { player.atkBuf = 0; player.jbuf = 0; player.chargeT = 0; }
  }
  async function refresh(force = false) {
    // An explicit reopen must check again after an older in-flight response;
    // otherwise a publication arriving during that request is missed.
    if (loading) return force ? loading.then(()=>refresh(true)) : loading;
    if (!force && loaded && Date.now() - lastFetch < 60000) return;
    if (!loaded && window.COMIC_MANIFEST) {
      try { manifest = validate(window.COMIC_MANIFEST); loaded = true; } catch (_) {}
    }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    loading = (async () => {
      try {
        const r = await fetch('assets/manhua/chapters.json', {cache:'no-cache', signal:controller.signal});
        if (!r.ok) throw Error('Comic manifest unavailable');
        const text = await r.text(); if (text.length > 1000000) throw Error('Comic manifest too large');
        manifest = validate(JSON.parse(text)); loaded = true; lastFetch = Date.now();
      } catch (e) { console.warn('Comic update unavailable; keeping the bundled edition.', e.message); }
      finally { clearTimeout(timer); loading = null; }
    })();
    return loading;
  }
  function button(label, action, parent = body) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.addEventListener('click', action); parent.append(b); return b;
  }
  function ensureUI() {
    if (root) return;
    const style = document.createElement('style');
    style.textContent = `
      #comic-rewards{position:fixed;inset:0;z-index:20000;background:#090e18;color:#f2eee4;font:16px/1.45 system-ui,sans-serif;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom));box-sizing:border-box}
      #comic-rewards[hidden]{display:none}#comic-rewards *{box-sizing:border-box}
      #comic-rewards header{display:flex;align-items:center;gap:14px;flex-wrap:wrap}#comic-rewards h2{font-size:clamp(18px,3vw,28px);margin:0;flex:1}
      #comic-rewards button{font:inherit;color:#fff;background:#203044;border:1px solid #688598;border-radius:7px;padding:10px 14px;cursor:pointer;min-height:44px}
      #comic-rewards button:focus-visible{outline:3px solid #68e7dd;outline-offset:2px}#comic-rewards button:disabled{opacity:.5;cursor:default}
      #comic-rewards .comic-body{flex:1;min-height:0;overflow:auto;margin-top:12px;display:flex;flex-direction:column;gap:10px}
      #comic-rewards .comic-stage{flex:1;min-height:100px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#030609;border-radius:8px;position:relative}
      #comic-rewards img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;transform-origin:center}
      #comic-rewards .comic-stage.zoom{display:block;overflow:auto}#comic-rewards .zoom img{max-width:none;max-height:none;width:max(100%,800px);height:auto;animation:none!important;margin:auto}
      #comic-rewards .comic-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      #comic-rewards .comic-status{min-height:24px;color:#91dacf;margin:8px 0 0}
      #comic-rewards details{max-height:25vh;overflow:auto;white-space:pre-wrap;color:#d8d5cd}
      #comic-rewards .comic-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;align-content:start}
      #comic-rewards .comic-card{padding:18px;background:#142131;border:1px solid #344c60;border-radius:10px}
      #comic-rewards .comic-card p{margin:8px 0}#comic-rewards .comic-note{color:#b8b8b1;margin:0}
      @keyframes comic-left{from{transform:translateX(.5%) scale(.98)}to{transform:translateX(-.5%) scale(1)}}
      @keyframes comic-right{from{transform:translateX(-.5%) scale(.98)}to{transform:translateX(.5%) scale(1)}}
      @keyframes comic-push{from{transform:scale(.96);opacity:.65}to{transform:scale(1);opacity:1}}
      @media(prefers-reduced-motion:reduce){#comic-rewards img{animation:none!important}}
      @media(max-height:500px){#comic-rewards{padding:6px 12px}#comic-rewards header button,#comic-rewards .comic-controls button{padding:6px 10px}#comic-rewards .comic-status{margin:0}}
    `;
    document.head.append(style);
    root = document.createElement('section'); root.id = 'comic-rewards'; root.hidden = true;
    root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-labelledby','comic-heading');
    const head = document.createElement('header'); heading = document.createElement('h2'); heading.id = 'comic-heading';
    head.append(heading); button('Return to game', close, head);
    status = document.createElement('p'); status.className = 'comic-status'; status.setAttribute('role','status');
    body = document.createElement('div'); body.className = 'comic-body'; root.append(head,status,body); document.body.append(root);
    root.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        const nodes = [...root.querySelectorAll('button:not(:disabled),summary')];
        const first=nodes[0], last=nodes[nodes.length-1];
        if (e.shiftKey && document.activeElement===first) {e.preventDefault();last.focus();}
        else if (!e.shiftKey && document.activeElement===last) {e.preventDefault();first.focus();}
      } else if (e.key==='Escape') {e.preventDefault();close();}
      else if (mode==='slides' && ['ArrowRight','ArrowLeft'].includes(e.key)) {e.preventDefault();step(e.key==='ArrowRight'?1:-1);}
      e.stopPropagation();
    });
    root.addEventListener('keyup',e=>e.stopPropagation());
    root.addEventListener('pointerdown',e=>e.stopPropagation());
    root.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
  }
  function enter() {
    if (!G.save || isHero()) return false;
    ensureUI();
    if (root.hidden) {returnState=G.state;sessionSave=G.save;focusBefore=document.activeElement;}
    G.state='COMICS';clearInput();root.hidden=false;autoplay=false;
    if (typeof npcVoxQuietAll==='function') npcVoxQuietAll();
    return true;
  }
  function close() {
    if (!root || root.hidden) return;
    root.hidden=true;autoplay=false;screenSerial++;clearInput();cooldown=5;readyFor=0;
    if (G.state==='COMICS') G.state=sessionSave===G.save ? returnState : 'PLAY';
    if (focusBefore && focusBefore.isConnected) focusBefore.focus();
    mode='';chapter=null;
  }
  function library() {
    if (!enter()) return;
    renderLibrary();
    const before=JSON.stringify(manifest);
    refresh(true).then(()=>{if(mode==='library'&&!root.hidden&&before!==JSON.stringify(manifest))renderLibrary();});
  }
  function renderLibrary() {
    mode='library';screenSerial++;chapter=null;heading.textContent='Manhwa memories';body.replaceChildren();
    status.textContent='Milestone rewards stay here for replay. New published chapters appear when you reconnect.';
    const list=document.createElement('div');list.className='comic-list';body.append(list);
    const unlocked=new Set(available(G.save,manifest).map(c=>c.id));
    for (const ch of manifest.chapters.filter(c=>c.status==='published')) {
      const card=document.createElement('article');card.className='comic-card';
      const h=document.createElement('h3');h.textContent=ch.title;card.append(h);
      const info=document.createElement('p');const earned=unlocked.has(ch.id), p=progress()[ch.id];
      info.textContent=earned ? (p && p.finished && p.revision===ch.revision ? 'Read · replay any time' : 'Unlocked · new memory') : 'Unlock: '+ch.unlock.join(' + ').replaceAll('-',' ');
      card.append(info);const b=button(earned?'Read chapter':'Locked',()=>open(ch),card);b.disabled=!earned;list.append(card);
    }
    if (!list.children.length) {const p=document.createElement('p');p.textContent='No published chapters are available yet.';list.append(p);}
    libraryIndex=0;root.querySelector('button').focus();
  }
  function open(ch) {
    if (!available(G.save,manifest).some(c=>c.id===ch.id) || !enter()) return;
    chapter=ch;mode='slides';autoplay=!reduced();const old=progress()[ch.id] || {};
    slide=old.revision===ch.revision && !old.finished ? Math.min(old.slide||0,ch.slides.length-1) : 0;
    progress()[ch.id]={...old,offered:true,revision:ch.revision,slide,finished:old.revision===ch.revision&&!!old.finished};persist();renderSlide();
  }
  function remember(finished=false) {
    if (!chapter || G.save!==sessionSave) return;
    const old=progress()[chapter.id]||{};
    progress()[chapter.id]={...old,offered:true,revision:chapter.revision,slide,finished:finished||!!old.finished};persist();
  }
  function step(dir) {
    if (!chapter) return;
    if (dir>0 && !decoded) return;
    if (slide+dir>=chapter.slides.length) {remember(true);autoplay=false;library();return;}
    slide=Math.max(0,slide+dir);remember();renderSlide();
  }
  function renderSlide() {
    body.replaceChildren();heading.textContent=chapter.title;decoded=false;elapsed=0;
    const serial=++screenSerial, s=chapter.slides[slide];
    status.textContent=`Page ${slide+1} of ${chapter.slides.length} · Loading…`;
    const stage=document.createElement('div');stage.className='comic-stage';
    const im=new Image();im.alt=s.alt;im.draggable=false;stage.append(im);body.append(stage);
    const controls=document.createElement('div');controls.className='comic-controls';body.append(controls);
    button('Previous',()=>step(-1),controls).disabled=slide===0;
    const play=button(autoplay?'Pause slideshow':'Play slideshow',()=>{autoplay=!autoplay;play.textContent=autoplay?'Pause slideshow':'Play slideshow';im.style.animationPlayState=autoplay?'running':'paused';},controls);
    const next=button(slide===chapter.slides.length-1?'Finish chapter':'Next',()=>step(1),controls);next.disabled=true;
    button('Read full-size',()=>{const zoom=stage.classList.toggle('zoom');autoplay=false;play.textContent='Play slideshow';im.style.animationPlayState='paused';stage.setAttribute('tabindex',zoom?'0':'-1');},controls);
    button('All memories',library,controls);
    const details=document.createElement('details'), summary=document.createElement('summary');summary.textContent='Page transcript';
    details.append(summary,document.createTextNode(s.caption||s.alt));body.append(details);
    if (chapter.note) {const note=document.createElement('p');note.className='comic-note';note.textContent=chapter.note;body.append(note);}
    im.onload=()=>{
      if(serial!==screenSerial)return;decoded=true;next.disabled=false;
      status.textContent=`Page ${slide+1} of ${chapter.slides.length} · ${reduced()?'Reduced motion':'Use Next or play the slideshow'}`;
      const motion={'drift-left':'comic-left','drift-right':'comic-right','push-in':'comic-push'}[s.motion];
      if(motion&&!reduced()) {im.style.animation=`${motion} ${s.seconds||12}s ease-out both`;im.style.animationPlayState=autoplay?'running':'paused';}
    };
    im.onerror=()=>{if(serial!==screenSerial)return;autoplay=false;play.textContent='Play slideshow';status.textContent='This page could not load. Reconnect and retry; your reward is kept.';button('Retry page',renderSlide,controls);};
    im.src=s.src+'?comic='+chapter.id+'-'+chapter.revision;
    play.focus();
  }
  function safe() {
    return G.state==='PLAY' && player && player.on && !player.dead && Math.abs(player.vx)<5 && Math.abs(player.vy)<5
      && !G.wake && (!G.tut || G.save.flags.tut) && !G.lesson && !G.trans && !G.gateWalk && !G.meet && !G.recharge
      && !G.bossEntry && !G.offer && !G.finisher && !G.winT && !G.hitStop
      && (!G.boss || G.boss.dead || G.boss.tame || G.boss.st==='dorm')
      && !(G.projs||[]).some(p=>!p.dead)
      && !(G.enemies||[]).some(e=>!e.dead&&!e.tame&&!e.disabled&&!e.rescued&&!e.calm&&Math.abs(e.x-player.x)<600);
  }
  function tick(dt) {
    if (!G.save || isHero()) return false;
    if(savedRef!==G.save) {savedRef=G.save;cooldown=3;readyFor=0;seenInput=false;refresh();}
    if(mode && root && !root.hidden) {
      if (sessionSave!==G.save || G.state!=='COMICS') {close();return false;}
      if(inP('BACK')||inP('PAUSE')) close();
      else if(mode==='slides') {
        if(inP('LEFT'))step(-1);else if(inP('RIGHT')||inP('OK'))step(1);
        if(decoded&&autoplay&&!document.hidden) {elapsed+=dt;if(elapsed>=(chapter.slides[slide].seconds||12))step(1);}
      } else {
        const buttons=[...body.querySelectorAll('button:not(:disabled)')];
        if(buttons.length) {
          if(inP('DOWN')||inP('RIGHT'))libraryIndex=(libraryIndex+1)%buttons.length;
          if(inP('UP')||inP('LEFT'))libraryIndex=(libraryIndex+buttons.length-1)%buttons.length;
          if(inP('DOWN')||inP('UP')||inP('LEFT')||inP('RIGHT'))buttons[libraryIndex].focus();
          if(inP('OK'))buttons[libraryIndex].click();
        }
      }
      return true;
    }
    if(Object.values(keys).some(Boolean)||inD('LEFT')||inD('RIGHT'))seenInput=true;
    cooldown=Math.max(0,cooldown-dt);
    if(!loaded||!seenInput||cooldown>0||!safe()) {readyFor=0;return false;}
    readyFor+=dt;
    if(readyFor<1.2)return false;
    const next=available(G.save,manifest).find(ch=>!progress()[ch.id]?.offered);
    if(next){open(next);return true;}
    return false;
  }
  return {validate, available, milestones, fact, refresh, library, open, close, tick,
    get manifest(){return manifest;}, get active(){return !!(root&&!root.hidden);}};
})();
