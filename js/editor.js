// THE FORGE — the owner's editor, on top of the running game.
//
// This file ships ONLY into forge.html / forge-odyssey.html (build.cjs emits
// them with window.EDITOR set); the game pages never carry a byte of it.
//
// What it is: the StarCraft-editor answer, built the way this project already
// works. The live game IS the viewport; edits land on a campaign pack
// (js/packs.js) applied over the world in place, so every change is playable
// the second it is made — main-game rooms included, because a pack room with
// a built-in room's id overrides it. Publishing is still git: the Forge
// exports pack.json, and only a push changes what anyone else plays.
//
// Direct manipulation and a local JSON operation console edit this browser's
// draft. Export the room brief to an assistant, then paste reviewed JSON ops.
// The public editor does not collect credentials or call external AI APIs.
// Publishing remains a git operation; the passphrase is only a casual gate.
(function () {
  if (typeof window === 'undefined' || !window.EDITOR) return;

  // Remove credentials retained by older versions without reading them.
  try { localStorage.removeItem('cb_forge_key'); } catch (e) {}

  const HASH = 'b094c73df45f79dd62879ff8c7a4816be4c785a842e784caa37c8fa3dfc875c4';
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  const F = {
    pack: { id: 'forge', title: 'FORGE DRAFT', rooms: {}, map: {}, i18n: {}, npcBody: {}, start: null },
    mode: 'select', brush: '#', entKind: 'crawler', sel: null, freeze: false, open: true, log: [],
  };
  window.FORGE = F;

  // ---- pack surgery ---------------------------------------------------------
  // Editing a built-in room first SNAPSHOTS it into the pack (grid rows from
  // the built grid, ents and exits copied); from then on the pack version is
  // the truth and overrides the original by id. That is the whole "the main
  // scenario is as editable as a DLC" mechanism.
  function ensureRoom(id) {
    if (F.pack.rooms[id]) return F.pack.rooms[id];
    const def = ROOMS[id];
    if (!def) return null;
    const g = buildRoom(id);
    F.pack.rooms[id] = {
      zone: def.zone, w: def.w, h: def.h, cave: def.cave ? 1 : undefined,
      exits: JSON.parse(JSON.stringify(def.exits || {})),
      ents: (def.ents || []).map((e) => e.slice()),
      grid: g.map((row) => row.join('')),
    };
    if (MAPPOS[id]) F.pack.map[id] = MAPPOS[id].slice();
    return F.pack.rooms[id];
  }
  function setTile(r, x, y, ch) {
    if (y < 0 || y >= r.h || x < 0 || x >= r.w) return;
    r.grid[y] = r.grid[y].substring(0, x) + ch + r.grid[y].substring(x + 1);
  }
  const NPC_BODIES = ['servo', 'ratchet', 'mono', 'patch', 'sage', 'lumen', 'guard'];

  // Every way of changing the world goes through ops — the console's contract
  // with Claude and the panel's own verbs are the same verbs. Returns a list
  // of "did" strings for the log; throws on an op it cannot honor.
  function apply(ops) {
    const did = [];
    let room = G.roomId;
    for (const op of Array.isArray(ops) ? ops : [ops]) {
      const r = op.room || room;
      if (op.op === 'new_room') {
        const w = op.w || 40, h = op.h || 17;
        const rows = [];
        for (let y = 0; y < h; y++) {
          let s = '';
          for (let x = 0; x < w; x++) {
            s += (y === 0 || y >= h - 2 || x === 0 || x === w - 1) ? '#' : '.';
          }
          rows.push(s);
        }
        F.pack.rooms[op.id] = { zone: op.zone || 'A', w, h, sky: op.sky ? 1 : undefined, exits: {}, ents: [], grid: rows };
        F.pack.map[op.id] = op.map || [0, 0, 1, 1];
        did.push('new room ' + op.id + ' ' + w + 'x' + h);
      } else if (op.op === 'remove_room') {
        delete F.pack.rooms[op.id]; delete F.pack.map[op.id];
        did.push('removed ' + op.id + ' from the pack');
      } else if (op.op === 'goto') {
        room = op.id; did.push('goto ' + op.id);
      } else if (op.op === 'set_tiles') {
        const d = ensureRoom(r);
        for (const [x, y, ch] of op.tiles) setTile(d, x, y, ch);
        did.push(op.tiles.length + ' tiles in ' + r);
      } else if (op.op === 'rect') {
        const d = ensureRoom(r);
        for (let y = op.y0; y <= op.y1; y++) for (let x = op.x0; x <= op.x1; x++) setTile(d, x, y, op.ch);
        did.push('rect ' + op.ch + ' in ' + r);
      } else if (op.op === 'heap') {
        // the NO RIGHT ANGLES rise: one tile per column up, across, and down
        const d = ensureRoom(r);
        const top = Math.max(1, op.top || 3), x0 = op.x, fy = (op.floorY != null ? op.floorY : d.h - 2);
        const prof = [];
        for (let i = 1; i <= top; i++) prof.push(i);
        prof.push(top);
        for (let i = top; i >= 1; i--) prof.push(i);
        prof.forEach((hh, i) => { for (let dy = 1; dy <= hh; dy++) setTile(d, x0 + i, fy - dy, '#'); });
        did.push('heap h' + top + ' at ' + x0 + ' in ' + r);
      } else if (op.op === 'add_ent') {
        const d = ensureRoom(r);
        d.ents.push(op.ent.slice());
        did.push(op.ent[0] + ' at ' + op.ent[1] + ',' + op.ent[2] + ' in ' + r);
      } else if (op.op === 'del_ent') {
        const d = ensureRoom(r);
        const gone = d.ents.splice(op.i, 1);
        did.push('removed ' + (gone[0] ? gone[0][0] : '?') + ' #' + op.i + ' in ' + r);
      } else if (op.op === 'move_ent') {
        const d = ensureRoom(r);
        if (d.ents[op.i]) { d.ents[op.i][1] = op.x; d.ents[op.i][2] = op.y; did.push(d.ents[op.i][0] + ' -> ' + op.x + ',' + op.y); }
      } else if (op.op === 'set_exits') {
        ensureRoom(r).exits = op.exits;
        did.push('exits of ' + r + ' = ' + JSON.stringify(op.exits));
      } else if (op.op === 'npc') {
        // a custom identity: borrowed body, its own name and conversation
        const body = NPC_BODIES.includes(op.body) ? op.body : 'servo';
        F.pack.npcBody[op.id] = body;
        F.pack.i18n['n_' + op.id] = op.name || op.id.toUpperCase();
        F.pack.i18n['d_' + op.id] = op.lines || ['...'];
        if (op.x != null) ensureRoom(r).ents.push(['npc', op.x, op.y, op.id]);
        did.push('npc ' + op.id + ' (' + body + ' body, ' + (op.lines || []).length + ' lines)');
      } else if (op.op === 'dialog') {
        // rewrite any character's conversation — pack NPCs and main-game ones
        if (op.name) F.pack.i18n['n_' + op.id] = op.name;
        F.pack.i18n['d_' + op.id] = op.lines;
        did.push('dialog of ' + op.id + ': ' + op.lines.length + ' lines');
      } else if (op.op === 'i18n') {
        for (const k in op.set) F.pack.i18n[k] = op.set[k];
        did.push(Object.keys(op.set).length + ' strings');
      } else if (op.op === 'set_start') {
        F.pack.start = { room: op.room, x: op.x != null ? op.x : 96, y: op.y != null ? op.y : 412 };
        did.push('start = ' + op.room);
      } else if (op.op === 'set_title') {
        F.pack.title = op.title; did.push('title = ' + op.title);
      } else {
        throw new Error('unknown op: ' + JSON.stringify(op.op));
      }
    }
    packApply(F.pack);
    try { localStorage.setItem('cb_forge_draft', JSON.stringify(F.pack)); } catch (e) {}
    if (ROOMS[room]) {
      const px = player ? player.x : null, py = player ? player.y : null;
      loadRoom(room);
      if (player && px != null && room === G.roomId) { player.x = px; player.y = py; }
      G.state = 'PLAY'; G.dialog = null;
    }
    refreshPanel();
    return did;
  }
  F.apply = apply;
  F.exportJSON = () => JSON.stringify(F.pack, null, 1);

  // ---- the console's contract with Claude -----------------------------------
  const ENT_KINDS = 'crawler guard flier turret hopper blob bat surge kiln rime snare'.split(' ');
  function contract() {
    const cur = F.pack.rooms[G.roomId] || (ROOMS[G.roomId] && {
      zone: ROOMS[G.roomId].zone, w: ROOMS[G.roomId].w, h: ROOMS[G.roomId].h,
      exits: ROOMS[G.roomId].exits, ents: ROOMS[G.roomId].ents,
      grid: buildRoom(G.roomId).map((r) => r.join('')),
    });
    return [
      'You are THE FORGE, the level editor of a 2D tile metroidvania. You receive the owner\'s request and answer with ONLY a JSON array of operations — no prose, no markdown fences.',
      'Rooms are grids of tile characters: # solid, . air, = one-way shelf, ^ hazard rail. Row 0 is the ceiling, the bottom two rows are the floor, columns 0 and w-1 are walls. Coordinates are [x right, y down] in tiles; entities stand with FEET on their tile row (floor tiles are at y=h-2, so a standing entity is at y=h-2).',
      'Operations: {"op":"set_tiles","room"?,"tiles":[[x,y,"#"],...]} | {"op":"rect","x0","y0","x1","y1","ch"} | {"op":"heap","x","top"} organic rise, one tile per column — ALWAYS use heap for elevation, never bare rect steps (the world forbids right angles) | {"op":"add_ent","ent":["kind",x,y,extra?]} | {"op":"del_ent","i"} | {"op":"move_ent","i","x","y"} | {"op":"set_exits","exits":{"L":"id","R":"id"}} both rooms must agree: an L/R opening is rows 1..h-3 cleared on the touching column of BOTH rooms | {"op":"new_room","id","zone","w","h","sky"?:1} sky:1 = open air, no lid or ceiling plate (outdoor rooms) | {"op":"goto","id"}. THE ROOF LAW: a roof exists only where another room continues above (a T exit); otherwise mark the room sky (outdoors) or give the pack room "air":N extra rows so the roof sits a frame or two above the space | {"op":"npc","id","name","lines":[..],"body":"servo|ratchet|mono|patch|lumen|guard","x","y"} a character with its own conversation | {"op":"dialog","id","lines":[..]} rewrite any character\'s conversation | {"op":"set_start","room","x","y"} | {"op":"set_title","title"} | {"op":"remove_room","id"}',
      'Enemy kinds: ' + ENT_KINDS.join(' ') + '. Other ents: bench (save point — every campaign needs one), scrap [.,x,y,amount], chest, term, plat, npc [npc,x,y,id]. Zones A-E,X pick the visual kingdom.',
      'Current room "' + G.roomId + '": ' + JSON.stringify(cur),
      'Rooms in the working pack: ' + JSON.stringify(Object.keys(F.pack.rooms)) + '. Selected entity index: ' + (F.sel == null ? 'none' : F.sel) + '.',
      'Keep edits minimal and playable. When placing enemies leave the player room to fight. Answer with the JSON array only.',
    ].join('\n');
  }

  // ---- chrome ---------------------------------------------------------------
  const css = (el, s) => { el.style.cssText = s; return el; };
  const mk = (tag, parent, style) => { const e = document.createElement(tag); if (style) css(e, style); (parent || document.body).appendChild(e); return e; };
  const PANEL_CSS = 'position:fixed;top:0;right:0;bottom:0;width:300px;z-index:40;background:#0b1416ee;color:#cfe;'
    + 'font:12px/1.5 monospace;padding:10px;overflow-y:auto;border-left:1px solid #1d6b5e;';
  const BTN = 'background:#12333a;color:#8ff0d4;border:1px solid #2a6;padding:3px 8px;margin:2px;cursor:pointer;font:11px monospace;';
  const INP = 'background:#081010;color:#cfe;border:1px solid #265;font:11px monospace;padding:3px;';

  let panel = null, logEl = null, entList = null, roomSel = null;
  function logLine(s, err) {
    if (!logEl) return;
    const d = mk('div', logEl, 'color:' + (err ? '#f88' : '#8ff0d4') + ';white-space:pre-wrap;');
    d.textContent = s;
    logEl.scrollTop = logEl.scrollHeight;
  }
  function refreshPanel() {
    if (!roomSel) return;
    const ids = Object.keys(ROOMS).sort();
    roomSel.innerHTML = '';
    for (const id of ids) {
      const o = mk('option', roomSel);
      o.value = id; o.textContent = (F.pack.rooms[id] ? '* ' : '') + id;
      if (id === G.roomId) o.selected = true;
    }
    entList.innerHTML = '';
    const d = F.pack.rooms[G.roomId] || ROOMS[G.roomId];
    (d.ents || []).forEach((e, i) => {
      const row = mk('div', entList, 'display:flex;gap:4px;align-items:center;' + (F.sel === i ? 'background:#134;' : ''));
      const lbl = mk('span', row, 'flex:1;cursor:pointer;');
      lbl.textContent = i + ' ' + e[0] + ' @' + e[1] + ',' + e[2] + (e[3] != null ? ' ' + e[3] : '');
      lbl.onclick = () => { F.sel = i; refreshPanel(); };
      const del = mk('button', row, BTN); del.textContent = 'x';
      del.onclick = () => { F.sel = null; run(() => apply([{ op: 'del_ent', i }])); };
    });
  }
  function run(fn) {
    try { const did = fn(); if (did) did.forEach((s) => logLine('· ' + s)); }
    catch (e) { logLine('! ' + e.message, true); }
  }

  function buildPanel() {
    panel = mk('div', document.body, PANEL_CSS);
    const h = mk('div', panel, 'color:#ffb347;font-weight:bold;margin-bottom:6px;');
    h.textContent = 'THE FORGE — ' + (window.GAME_LOCK === 'hero' ? 'NOSTOS' : 'CLAWBYTE');

    // Local operation console; no network request or credential input.
    const ta = css(mk('textarea', panel), INP + 'width:100%;height:64px;');
    ta.placeholder = 'paste reviewed JSON operations… (Ctrl+Enter)';
    const send = mk('button', panel, BTN); send.textContent = 'APPLY OPS';
    const busy = mk('span', panel, 'color:#ffb347;margin-left:6px;');
    const go = async () => {
      const text = ta.value.trim();
      if (!text) return;
      busy.textContent = '…applying'; send.disabled = true;
      logLine('> ' + text);
      try { const ops = JSON.parse(text); if (!Array.isArray(ops)) throw new Error('Expected a JSON array of operations'); apply(ops).forEach((s) => logLine('· ' + s)); ta.value = ''; }
      catch (e) { logLine('! ' + e.message, true); }
      busy.textContent = ''; send.disabled = false;
    };
    send.onclick = go;
    ta.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(); } };
    logEl = mk('div', panel, 'height:120px;overflow-y:auto;background:#060c0c;border:1px solid #143;margin:6px 0;padding:4px;');

    // room + tools
    const rrow = mk('div', panel);
    roomSel = css(mk('select', rrow), INP);
    const goBtn = mk('button', rrow, BTN); goBtn.textContent = 'GO';
    goBtn.onclick = () => run(() => apply([{ op: 'goto', id: roomSel.value }]));
    const newBtn = mk('button', rrow, BTN); newBtn.textContent = 'NEW';
    newBtn.onclick = () => {
      const id = prompt('room id (letters/digits):'); if (!id) return;
      run(() => apply([{ op: 'new_room', id, zone: (ROOMS[G.roomId] || {}).zone || 'A' }, { op: 'goto', id }]));
    };

    const mrow = mk('div', panel, 'margin:6px 0;');
    for (const [m, label] of [['select', 'SELECT'], ['paint', 'PAINT'], ['ent', 'PLACE']]) {
      const b = mk('button', mrow, BTN); b.textContent = label;
      b.onclick = () => { F.mode = m; [...mrow.children].forEach((c) => c.style.background = '#12333a'); b.style.background = '#265'; };
      if (m === F.mode) b.style.background = '#265';
    }
    const brow = mk('div', panel);
    for (const ch of ['#', '.', '=', '^']) {
      const b = mk('button', brow, BTN); b.textContent = ch === '.' ? 'air' : ch;
      b.onclick = () => { F.brush = ch; F.mode = 'paint'; };
    }
    const heapB = mk('button', brow, BTN); heapB.textContent = 'heap';
    heapB.onclick = () => { F.mode = 'heap'; };
    const entRow = mk('div', panel, 'margin:4px 0;');
    const kindSel = css(mk('select', entRow), INP);
    for (const k of ENT_KINDS.concat(['bench', 'scrap', 'chest', 'term', 'npc'])) {
      const o = mk('option', kindSel); o.value = o.textContent = k;
    }
    kindSel.onchange = () => { F.entKind = kindSel.value; F.mode = 'ent'; };

    mk('div', panel, 'color:#ffb347;margin-top:4px;').textContent = 'entities';
    entList = mk('div', panel, 'max-height:130px;overflow-y:auto;');

    const frow = mk('div', panel, 'margin-top:8px;');
    const freeze = mk('button', frow, BTN); freeze.textContent = 'FREEZE';
    freeze.onclick = () => { F.freeze = !F.freeze; freeze.style.background = F.freeze ? '#622' : '#12333a'; };
    const exp = mk('button', frow, BTN); exp.textContent = 'EXPORT';
    exp.onclick = () => {
      const a = mk('a', panel, 'display:none;');
      a.href = URL.createObjectURL(new Blob([F.exportJSON()], { type: 'application/json' }));
      a.download = 'pack.json'; a.click();
      logLine('· exported pack.json — commit as packs/<id>/pack.json, or hand it to a session');
    };
    const briefB = mk('button', frow, BTN); briefB.textContent = 'EXPORT BRIEF';
    briefB.onclick = () => {
      const a = mk('a', panel, 'display:none;');
      const url = URL.createObjectURL(new Blob([contract()], { type: 'text/plain' }));
      a.href = url; a.download = 'forge-room-brief.txt'; a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      logLine('· exported room brief — ask your assistant for JSON ops, review them, then paste above');
    };
    const hideB = mk('button', frow, BTN); hideB.textContent = 'HIDE';
    hideB.onclick = () => { panel.style.display = 'none'; F.open = false; };

    refreshPanel();
  }

  // ---- pointing at the world ------------------------------------------------
  function tileFromEvent(e) {
    const cv = document.getElementById('cv');
    const r = cv.getBoundingClientRect();
    const wx = (e.clientX - r.left) / r.width * 960 + cam.x;
    const wy = (e.clientY - r.top) / r.height * 540 + cam.y;
    return { tx: Math.floor(wx / TILE), ty: Math.floor(wy / TILE) };
  }
  function bindCanvas() {
    const cv = document.getElementById('cv');
    let painting = false;
    const paintAt = (e) => {
      const { tx, ty } = tileFromEvent(e);
      run(() => apply([{ op: 'set_tiles', tiles: [[tx, ty, F.brush]] }]));
    };
    cv.addEventListener('mousedown', (e) => {
      if (!F.open) return;
      const { tx, ty } = tileFromEvent(e);
      if (F.mode === 'paint') { painting = true; paintAt(e); }
      else if (F.mode === 'heap') run(() => apply([{ op: 'heap', x: tx - 2, top: 3 }]));
      else if (F.mode === 'ent') run(() => apply([{ op: 'add_ent', ent: [F.entKind, tx, ty, F.entKind === 'scrap' ? 25 : undefined].filter((v) => v !== undefined) }]));
      else if (F.mode === 'select') {
        const d = F.pack.rooms[G.roomId] || ROOMS[G.roomId];
        F.sel = null;
        (d.ents || []).forEach((en, i) => { if (Math.abs(en[1] - tx) <= 1 && Math.abs(en[2] - ty) <= 1) F.sel = i; });
        refreshPanel();
      }
    });
    cv.addEventListener('mousemove', (e) => { if (painting && F.mode === 'paint') paintAt(e); });
    window.addEventListener('mouseup', () => { painting = false; });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        F.open = !F.open;
        if (panel) panel.style.display = F.open ? 'block' : 'none';
      }
      if (e.key === 'Delete' && F.sel != null && F.open) {
        const i = F.sel; F.sel = null;
        run(() => apply([{ op: 'del_ent', i }]));
      }
    });
  }

  // ---- the gate -------------------------------------------------------------
  function enterForge() {
    // the Forge plays on its own save, never the owner's real one
    const _saveKeyFor = saveKeyFor;
    saveKeyFor = (theme) => _saveKeyFor(theme) + '_forge';
    // FREEZE stops the simulation while the world keeps drawing
    const _update = update;
    update = function (dt) { if (F.freeze) return; _update(dt); };
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem('cb_forge_draft')); } catch (e) {}
    if (draft && Object.keys(draft.rooms || {}).length && confirm('resume the last Forge draft?')) F.pack = draft;
    G.cut = null;
    startGame(newSave(0));
    if (F.pack.rooms && Object.keys(F.pack.rooms).length) packApply(F.pack);
    buildPanel();
    bindCanvas();
    logLine('THE FORGE is open. Describe a change, or F2 to hide.');
  }

  function gate() {
    const ov = mk('div', document.body,
      'position:fixed;inset:0;z-index:50;background:#04090a;display:flex;flex-direction:column;'
      + 'align-items:center;justify-content:center;color:#8ff0d4;font:14px monospace;gap:12px;');
    const title = mk('div', ov, 'font-size:22px;color:#ffb347;');
    title.textContent = 'THE FORGE';
    if (localStorage.getItem('cb_forge_ok') === HASH) {
      const b = mk('button', ov, BTN + 'font-size:16px;padding:8px 20px;');
      b.textContent = 'ENTER';
      b.onclick = () => { ov.remove(); enterForge(); };
      return;
    }
    const inp = css(mk('input', ov), INP + 'font-size:16px;padding:6px;width:240px;text-align:center;');
    inp.type = 'password'; inp.placeholder = 'passphrase';
    const msg = mk('div', ov, 'color:#f88;height:16px;');
    const tryIt = async () => {
      if (await sha(inp.value) === HASH) {
        try { localStorage.setItem('cb_forge_ok', HASH); } catch (e) {}
        ov.remove(); enterForge();
      } else { msg.textContent = 'not the word'; inp.value = ''; }
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter') tryIt(); };
    const b = mk('button', ov, BTN); b.textContent = 'OPEN';
    b.onclick = tryIt;
    setTimeout(() => inp.focus(), 50);
  }

  gate();
})();
