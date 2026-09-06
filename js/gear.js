// Physical equipment UI. Keep legacy save IDs so earned gear survives upgrades.
const GEAR_TEXT = {
  en: {
    crest_title: 'Gear', pm_crests: 'Gear', pa_CREST: 'Gear', crest_slots: 'Power capacity',
    crest_full: 'Not enough power capacity', crest_hint: 'Select a part · Enter to install / remove · Back to return',
    crest_lore: 'Your body is built to be repaired and upgraded. Salvage useful parts, bring materials to the forge, and install the equipment you earn.',
    crest_none: 'Standard boots are installed. Defeat NULLFANG to recover dash jets; later upgrades add an air jump and new abilities.',
    crest_port: 'Traversal hardware stays installed. Optional equipment shares your power capacity.',
    crest_first: 'A salvaged equipment module. Install it to change what your body can do.',
    crest_first2: 'Open Pause → Gear. Select a part to install or remove it. Ratchet can upgrade your power capacity.',
    s_slot: 'Power Regulator', s_slotd: 'Permanently add one unit of equipment power capacity.',
    sk_mindd: '+1 equipment power capacity.', c_ground: 'Insulated Soles', c_sprint: 'Jet Booster',
    c_over: 'Actuator Overclock', c_nine: 'Emergency Restart Unit',
    m_dash: 'Dash Jets', m_djump: 'Air-Jump Boots',
    gear_boots: 'Standard Boots', gear_bootsd: 'Installed from the start. Jump from the ground.',
    gear_locked: 'Not acquired', gear_installed: 'Installed', gear_stored: 'In inventory',
    gear_core: 'Permanent traversal hardware', gear_parts: 'Equipment', gear_empty: 'Empty',
    gear_dashlock: 'Recover these jets after defeating NULLFANG.',
    gear_djumplock: 'A later boot upgrade adds a second jump in the air.',
    gear_phase: 'Phase Coil', gear_phaselock: 'Requires dash jets. Install this coil to phase during a dash.',
    gear_bootslot: 'Boots', gear_jetslot: 'Jets', gear_handslot: 'Hands', gear_coreslot: 'Core',
    gear_claws: 'Bare claws', gear_sword: 'Purifier sword', gear_joined: 'Joined purifier',
    gear_fixed: 'This story upgrade stays installed.', gear_requiresjets: 'Acquire dash jets first.',
    gear_loading: 'Loading character…', gear_more: '↑ / ↓ Browse parts',
    t3: ['COLD STORAGE NOTE: the Prowler stole the ninth prototype restart unit and fled toward the crystal seams.']
  },
  ar: {
    crest_title: 'التجهيزات', pm_crests: 'التجهيزات', pa_CREST: 'التجهيزات', crest_slots: 'سعة الطاقة',
    crest_full: 'سعة الطاقة غير كافية', crest_hint: 'اختر قطعة · Enter للتركيب أو النزع · رجوع',
    crest_lore: 'جسمك قابل للإصلاح والتطوير. اجمع القطع المفيدة وأعد المواد إلى الحداد وركّب المعدات التي تكسبها.',
    crest_none: 'حذاء القفز الأساسي مركّب. اهزم نولفانغ للحصول على نفاثات الاندفاع، ثم طوّر الحذاء للقفز في الهواء.',
    crest_port: 'معدات التنقل الأساسية تبقى مركّبة. القطع الاختيارية تتشارك سعة الطاقة.',
    crest_first: 'قطعة معدات مستصلحة. ركّبها لتطوير قدرات جسمك.',
    crest_first2: 'افتح الإيقاف ثم التجهيزات. اختر قطعة لتركيبها أو نزعها. يستطيع راتشيت زيادة سعة الطاقة.',
    s_slot: 'منظّم الطاقة', s_slotd: 'يزيد سعة طاقة المعدات بوحدة دائمة.', sk_mindd: 'وحدة إضافية لسعة طاقة المعدات.',
    c_ground: 'نعال عازلة', c_sprint: 'معزّز النفاثات', c_over: 'مسرّع المحرّكات', c_nine: 'وحدة إعادة تشغيل طارئة',
    m_dash: 'نفاثات الاندفاع', m_djump: 'حذاء القفز الهوائي', gear_boots: 'حذاء أساسي',
    gear_bootsd: 'مركّب منذ البداية. يتيح القفز من الأرض.', gear_locked: 'لم تحصل عليه', gear_installed: 'مركّب',
    gear_stored: 'في المخزون', gear_core: 'معدات تنقّل دائمة', gear_parts: 'المعدات', gear_empty: 'فارغ',
    gear_dashlock: 'احصل على النفاثات بعد هزيمة نولفانغ.', gear_djumplock: 'تطوير لاحق للحذاء يضيف قفزة ثانية في الهواء.',
    gear_phase: 'ملف الطور', gear_phaselock: 'يتطلب نفاثات الاندفاع. يتيح المرور أثناء الاندفاع.',
    gear_bootslot: 'الحذاء', gear_jetslot: 'النفاثات', gear_handslot: 'اليدان', gear_coreslot: 'النواة',
    gear_claws: 'مخالب فقط', gear_sword: 'سيف المطهّر', gear_joined: 'المطهّر الموصول',
    gear_fixed: 'هذا التطوير القصصي يبقى مركّباً.', gear_requiresjets: 'احصل على نفاثات الاندفاع أولاً.',
    gear_loading: 'تحميل الشخصية…', gear_more: '↑ / ↓ تصفّح القطع'
  }
};
if (typeof I18N !== 'undefined') GEAR_TEXT.en.ctl = I18N.en.ctl.map(line => line.replace('Crests', 'Gear').replace('Twin Thrusters', 'Air-Jump Boots'));
function gearRows(save) {
  const a = save.abil || {}, owned = save.crests || [], eq = save.equip || [];
  const row = (id, name, desc, acquired, fixed, installed, slot) => ({ id, name, desc, acquired, fixed, installed, slot });
  const rows = [row('boots', a.djump ? 'm_djump' : 'gear_boots', a.djump ? 'm_djumpd' : 'gear_bootsd', true, true, true, 'gear_bootslot'),
    row('dash', 'm_dash', a.dash ? 'm_dashd' : 'gear_dashlock', !!a.dash, true, !!a.dash, 'gear_jetslot')];
  if (!a.djump) rows.push(row('djump', 'm_djump', 'gear_djumplock', false, true, false, 'gear_bootslot'));
  for (const id of ['wall', 'emp', 'key']) rows.push(row(id, 'm_' + id, 'm_' + id + 'd', !!a[id], true, !!a[id], id === 'wall' ? 'gear_handslot' : 'gear_coreslot'));
  const ids = Array.from(new Set(owned.concat('phantom'))).filter(id => Object.prototype.hasOwnProperty.call(CRESTS, id));
  for (const id of ids) rows.push(row(id, id === 'phantom' ? 'gear_phase' : 'c_' + id,
    id === 'phantom' ? 'gear_phaselock' : 'c_' + id + 'd', owned.includes(id), false, eq.includes(id),
    ['phantom', 'sprint'].includes(id) ? 'gear_jetslot' : id === 'ground' ? 'gear_bootslot' : id === 'claws' ? 'gear_handslot' : 'gear_coreslot'));
  return rows;
}
function gearLayout() {
  const rows = gearRows(G.save), index = Math.max(0, Math.min(G.crestIdx || 0, rows.length - 1));
  const start = Math.max(0, Math.min(index - 2, rows.length - 6));
  return { rows, index, start, visible: rows.slice(start, start + 6), x: 480, w: 430, y: 144, step: 46, h: 42 };
}
function gearActivate() {
  const r = gearLayout().rows[gearLayout().index];
  if (!r.acquired) { G.toast(t('gear_locked')); sfx('no'); return; }
  if (r.fixed) { G.toast(t('gear_fixed')); sfx('ui'); return; }
  const eq = G.save.equip, at = eq.indexOf(r.id);
  if (at >= 0) eq.splice(at, 1);
  else {
    if (['phantom', 'sprint'].includes(r.id) && !G.save.abil.dash) { G.toast(t('gear_requiresjets')); sfx('no'); return; }
    const used = eq.reduce((n, id) => n + (CRESTS[id] || 0), 0);
    if (used + CRESTS[r.id] > effSlots()) { G.toast(t('crest_full')); sfx('no'); return; }
    eq.push(r.id);
  }
  player.cores = Math.min(player.cores, player.maxCores()); persist(); sfx('ok');
}
function updateGear() {
  if (inP('CREST') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const n = gearRows(G.save).length;
  G.crestIdx = gearLayout().index;
  if (inP('DOWN')) { G.crestIdx = (G.crestIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.crestIdx = (G.crestIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) gearActivate();
}
function gearTouch(x, y) {
  const l = gearLayout(), i = Math.round((y - l.y) / l.step);
  if (x >= l.x && x <= l.x + l.w && i >= 0 && i < l.visible.length && Math.abs(y - (l.y + i * l.step)) <= l.h / 2) {
    G.crestIdx = l.start + i; tPress('VOK'); return;
  }
  if (y >= 410 && y <= 450) {
    if (x >= 480 && x <= 650) G.crestIdx = Math.max(0, l.index - 1);
    else if (x >= 740 && x <= 910) G.crestIdx = Math.min(l.rows.length - 1, l.index + 1);
  }
}
function drawGear() {
  c.fillStyle = 'rgba(4,7,12,0.97)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('crest_title'), 480, 42, 28, '#eef3fa');
  const used = G.save.equip.reduce((n, id) => n + (CRESTS[id] || 0), 0), l = gearLayout(), selected = l.rows[l.index];
  ftxt(t('crest_slots') + '  ' + used + ' / ' + effSlots(), 695, 83, 15, '#37ffd0');
  ftxt(t('gear_parts'), 695, 112, 16, '#9fb8c8');
  dimPanel(38, 82, 415, 352);
  // Use existing authored character art. Attachment labels report real save
  // state; do not invent painted boots/jets that have no approved source.
  const im = MEDIA_IMG.heroStates;
  if (im && im.width) {
    const cw = im.width / HERO_CELLS, dh = 226, dw = dh * cw / im.height;
    c.drawImage(im, 0, 0, cw, im.height, 240 - dw / 2, 133, dw, dh);
  } else ftxt(t('gear_loading'), 245, 240, 15, '#9fb8c8');
  const a = G.save.abil || {}, f = G.save.flags || {};
  // Equipment inspection cards use existing approved Higgsfield assets.
  // They remain separate from the body until matching wearable poses exist.
  for (const [owned, key, x, y] of [[a.dash, 'jetpack', 65, 206], [a.djump, 'bootsIdle', 337, 258]]) {
    if (!owned) continue;
    const part = MEDIA_IMG[key];
    if (!part || !part.width) { if (typeof mediaFetch === 'function') mediaFetch(key, 1); continue; }
    const scale = Math.min(78 / part.width, 84 / part.height);
    c.drawImage(part, x + (78 - part.width * scale) / 2, y, part.width * scale, part.height * scale);
  }
  const labels = [
    ['gear_handslot', f.crystal2 ? 'gear_joined' : f.crystal ? 'gear_sword' : 'gear_claws', 116],
    ['gear_jetslot', a.dash ? 'm_dash' : 'gear_empty', 374],
    ['gear_bootslot', a.djump ? 'm_djump' : 'gear_boots', 406]
  ];
  for (const [slot, value, y] of labels) ftxt(t(slot) + ' · ' + t(value), 245, y, 15, '#bcebdc');
  l.visible.forEach((r, i) => {
    const y = l.y + i * l.step, sel = l.start + i === l.index;
    c.fillStyle = sel ? 'rgba(55,255,208,0.15)' : 'rgba(110,140,160,0.06)';
    rr(c, l.x, y - 21, l.w, l.h, 6); c.fill();
    const align = LANG === 'ar' ? 'right' : 'left', x = LANG === 'ar' ? 894 : 495;
    ftxt(t(r.name), x, y - 4, 16, r.acquired ? '#eef3fa' : '#6f8294', align);
    ftxt(t(r.slot) + ' · ' + t(r.installed ? 'gear_installed' : r.acquired ? 'gear_stored' : 'gear_locked'), x, y + 13, 11, r.installed ? '#37ffd0' : '#8098ad', align);
  });
  ftxt('↑', 565, 432, 22, '#37ffd0'); ftxt((l.index + 1) + ' / ' + l.rows.length, 695, 432, 13, '#8aa2b5'); ftxt('↓', 825, 432, 22, '#37ffd0');
  wrapText(t(selected.desc), 850, 14).slice(0, 2).forEach((line, i) => ftxt(line, 480, 462 + i * 19, 14, '#b2c6d4'));
  ftxt(t('crest_hint'), 480, 516, 12, '#8aa2b5');
}
