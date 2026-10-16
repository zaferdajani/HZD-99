// Physical equipment UI. Keep legacy save IDs so earned gear survives upgrades.
const GEAR_TEXT = {
  en: {
    combat_export: 'Export combat log [L]', combat_stats: 'HP %h cores | ATK %a | DEF 0%',
    combat_rate: '%s swings/s | Special %b',
    combat_pass: ' / pass',
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
    weapon_secondlock: 'Forge your first sword and defeat the Crystal Prowler to recover this blade.',
    weapon_connectorlock: 'Bring both swords after defeating the Foundry guardian to recover this connector.',
    i_crystal2: 'Second Purifier Sword', i_crystal2d: 'A second blade, still separate. Dual swords are equipped. Hold attack to charge, then release for a hurricane swirl. Change weapons in Gear.',
    i_connector: 'Purifier Connector', i_connectord: 'The connector joins your two swords into a double-bladed weapon. Hold attack to charge, then release to throw it. It returns to your hands. Choose dual swords again in Gear.',
    gear_dual: 'Dual purifier swords', gear_weaponbusy: 'Finish your attack and recover the weapon before changing equipment.',
    gear_clawsd: 'Put weapons away and attack with bare claws. Owned swords remain in your inventory.',
    gear_swordd: 'Bring raw crystal back to Ratchet to forge your first sword. Equip it for sword cuts.',
    gear_duald: 'Recover the second sword in the Crystal Cache. Hold attack and release to perform a hurricane swirl.',
    gear_joinedd: 'Recover the connector in the Foundry after earning both swords. Hold attack and release for a returning throw.',
    gear_claws: 'Bare claws', gear_sword: 'Purifier sword', gear_joined: 'Joined purifier',
    gear_fixed: 'This story upgrade stays installed.', gear_requiresjets: 'Acquire dash jets first.',
    gear_loading: 'Loading character…', gear_more: '↑ / ↓ Browse parts',
    t3: ['COLD STORAGE NOTE: the Prowler stole the ninth prototype restart unit and fled toward the crystal seams.']
  },
  ar: {
    combat_export: 'تصدير سجل القتال [L]', combat_stats: 'الطاقة %h | الهجوم %a | الدفاع 0%',
    combat_rate: '%s ضربة/ث | الضربة الخاصة %b',
    combat_pass: ' / مرور',
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
    weapon_secondlock: 'اصنع سيفك الأول واهزم حارس البلورات لاستعادة هذا السيف.',
    weapon_connectorlock: 'أحضر السيفين بعد هزيمة حارس المسبك لاستعادة الوصلة.',
    i_crystal2: 'سيف المطهّر الثاني', i_crystal2d: 'سيف ثانٍ مستقل. السيفان مجهّزان الآن. اضغط مطولاً على الهجوم ثم اتركه لتنفيذ دوامة إعصار. بدّل الأسلحة من التجهيزات.',
    i_connector: 'وصلة المطهّر', i_connectord: 'تصل السيفين بسلاح واحد ذي نصلين. اضغط مطولاً على الهجوم ثم اتركه لرميه؛ سيعود إلى يديك. يمكنك اختيار السيفين مجدداً من التجهيزات.',
    gear_dual: 'سيفا المطهّر', gear_weaponbusy: 'أكمل هجومك واستعد السلاح قبل تبديل التجهيزات.',
    gear_clawsd: 'ضع الأسلحة جانباً وهاجم بالمخالب. تبقى السيوف في مخزونك.',
    gear_swordd: 'أعد البلورة الخام إلى راتشيت لصنع سيفك الأول. جهّزه للهجوم بالسيف.',
    gear_duald: 'استعد السيف الثاني من مخبأ البلورات. اضغط مطولاً ثم اترك الهجوم لتنفيذ دوامة إعصار.',
    gear_joinedd: 'استعد الوصلة من المسبك بعد جمع السيفين. اضغط مطولاً ثم اترك الهجوم لرمي السلاح واستعادته.',
    gear_claws: 'مخالب فقط', gear_sword: 'سيف المطهّر', gear_joined: 'المطهّر الموصول',
    gear_fixed: 'هذا التطوير القصصي يبقى مركّباً.', gear_requiresjets: 'احصل على نفاثات الاندفاع أولاً.',
    gear_loading: 'تحميل الشخصية…', gear_more: '↑ / ↓ تصفّح القطع',
    t3: ['ملاحظة المخزن البارد: سرق حارس البلورات وحدة إعادة التشغيل التاسعة التجريبية وهرب نحو عروق البلور.']
  },
  // tr / zh / ru: the screen used to fall back to English in three of the five
  // languages the game speaks (found by the loadout pass, C2)
  tr: {
    crest_title: 'Teçhizat', pm_crests: 'Teçhizat', pa_CREST: 'Teçhizat', crest_slots: 'Güç kapasitesi',
    crest_full: 'Yeterli güç kapasitesi yok', crest_hint: 'Bir parça seç · Enter ile tak / çıkar · Geri ile dön',
    crest_lore: 'Gövden onarılmak ve geliştirilmek için yapıldı. İşe yarar parçaları topla, malzemeleri demirciye getir ve kazandığın teçhizatı tak.',
    crest_none: 'Standart botlar takılı. Atılma jetlerini almak için NULLFANG’ı yen; sonraki geliştirmeler havada zıplama ve yeni yetenekler ekler.',
    crest_port: 'Hareket donanımı takılı kalır. İsteğe bağlı teçhizat güç kapasitesini paylaşır.',
    crest_first: 'Kurtarılmış bir teçhizat modülü. Gövdenin neler yapabileceğini değiştirmek için tak.',
    crest_first2: 'Duraklat → Teçhizat’ı aç. Takmak ya da çıkarmak için bir parça seç. Ratchet güç kapasiteni artırabilir.',
    s_slot: 'Güç Regülatörü', s_slotd: 'Teçhizat güç kapasitesine kalıcı olarak bir birim ekler.',
    sk_mindd: '+1 teçhizat güç kapasitesi.', c_ground: 'Yalıtımlı Tabanlar', c_sprint: 'Jet Güçlendirici',
    c_over: 'Eyleyici Hız Aşırtma', c_nine: 'Acil Yeniden Başlatma Birimi',
    m_dash: 'Atılma Jetleri', m_djump: 'Havada Zıplama Botları',
    gear_boots: 'Standart Botlar', gear_bootsd: 'Baştan beri takılı. Yerden zıplar.',
    gear_locked: 'Edinilmedi', gear_installed: 'Takılı', gear_stored: 'Envanterde',
    gear_core: 'Kalıcı hareket donanımı', gear_parts: 'Teçhizat', gear_empty: 'Boş',
    gear_dashlock: 'Bu jetleri NULLFANG’ı yendikten sonra geri al.',
    gear_djumplock: 'Sonraki bir bot geliştirmesi havada ikinci bir zıplama ekler.',
    gear_phase: 'Faz Bobini', gear_phaselock: 'Atılma jetleri gerekir. Atılırken fazlanmak için bu bobini tak.',
    gear_bootslot: 'Botlar', gear_jetslot: 'Jetler', gear_handslot: 'Eller', gear_coreslot: 'Çekirdek',
    weapon_secondlock: 'İlk kılıcını döv ve bu kılıcı geri almak için Kristal Avcısı’nı yen.',
    weapon_connectorlock: 'Dökümhane muhafızını yendikten sonra bu bağlayıcıyı almak için iki kılıcı da getir.',
    i_crystal2: 'İkinci Arındırıcı Kılıç', i_crystal2d: 'İkinci bir kılıç, hâlâ ayrı. Çift kılıç kuşanıldı. Saldırıyı basılı tutup doldur, sonra bırakıp kasırga dönüşü yap. Silahları Teçhizat’tan değiştir.',
    i_connector: 'Arındırıcı Bağlayıcı', i_connectord: 'Bağlayıcı iki kılıcını çift ağızlı tek bir silahta birleştirir. Saldırıyı basılı tutup doldur, sonra bırakıp fırlat; ellerine geri döner. Çift kılıcı yine Teçhizat’tan seçebilirsin.',
    gear_dual: 'Çift arındırıcı kılıç', gear_weaponbusy: 'Teçhizat değiştirmeden önce saldırını bitir ve silahı geri al.',
    gear_clawsd: 'Silahları kaldır ve çıplak pençelerle saldır. Sahip olduğun kılıçlar envanterde kalır.',
    gear_swordd: 'İlk kılıcını dövmek için ham kristali Ratchet’e getir. Kılıç darbeleri için kuşan.',
    gear_duald: 'İkinci kılıcı Kristal Deposu’nda geri al. Kasırga dönüşü için saldırıyı basılı tut ve bırak.',
    gear_joinedd: 'İki kılıcı da kazandıktan sonra bağlayıcıyı Dökümhane’de geri al. Geri dönen bir atış için saldırıyı basılı tut ve bırak.',
    gear_claws: 'Çıplak pençeler', gear_sword: 'Arındırıcı kılıç', gear_joined: 'Birleşik arındırıcı',
    gear_fixed: 'Bu hikâye geliştirmesi takılı kalır.', gear_requiresjets: 'Önce atılma jetlerini edin.',
    gear_loading: 'Karakter yükleniyor…', gear_more: '↑ / ↓ Parçalara göz at',
    t3: ['SOĞUK DEPO NOTU: Kristal Avcısı dokuzuncu prototip yeniden başlatma birimini çaldı ve kristal damarlarına doğru kaçtı.']
  },
  zh: {
    crest_title: '装备', pm_crests: '装备', pa_CREST: '装备', crest_slots: '能量容量',
    crest_full: '能量容量不足', crest_hint: '选择部件 · Enter 安装 / 卸下 · 返回',
    crest_lore: '你的身体生来就能被修复和升级。收集有用的零件，把材料带去锻炉，安装你赢得的装备。',
    crest_none: '已安装标准靴。击败 NULLFANG 以取回冲刺喷射器；之后的升级会加入空中跳跃和新能力。',
    crest_port: '移动硬件始终安装。可选装备共享你的能量容量。',
    crest_first: '一个回收来的装备模块。安装它来改变你身体的能力。',
    crest_first2: '打开 暂停 → 装备。选择部件来安装或卸下。Ratchet 可以升级你的能量容量。',
    s_slot: '能量调节器', s_slotd: '永久增加一单位装备能量容量。',
    sk_mindd: '装备能量容量 +1。', c_ground: '绝缘鞋底', c_sprint: '喷射增压器',
    c_over: '致动器超频', c_nine: '紧急重启单元',
    m_dash: '冲刺喷射器', m_djump: '空中跳跃靴',
    gear_boots: '标准靴', gear_bootsd: '一开始就已安装。从地面起跳。',
    gear_locked: '未获得', gear_installed: '已安装', gear_stored: '在背包中',
    gear_core: '永久移动硬件', gear_parts: '装备', gear_empty: '空',
    gear_dashlock: '击败 NULLFANG 后取回这些喷射器。',
    gear_djumplock: '之后的靴子升级会加入一次空中二段跳。',
    gear_phase: '相位线圈', gear_phaselock: '需要冲刺喷射器。安装此线圈可在冲刺时相位穿行。',
    gear_bootslot: '靴子', gear_jetslot: '喷射器', gear_handslot: '双手', gear_coreslot: '核心',
    weapon_secondlock: '锻造你的第一把剑并击败水晶潜行者，以取回这把剑。',
    weapon_connectorlock: '击败铸造厂守护者后带上两把剑，以取回这个连接器。',
    i_crystal2: '第二把净化之剑', i_crystal2d: '第二把剑，仍是分开的。已装备双剑。按住攻击蓄力，松开施展飓风旋斩。在装备中切换武器。',
    i_connector: '净化连接器', i_connectord: '连接器把你的两把剑合成一把双刃武器。按住攻击蓄力，松开将它掷出；它会回到你手中。也可以在装备中重新选择双剑。',
    gear_dual: '净化双剑', gear_weaponbusy: '先完成攻击并收回武器，再更换装备。',
    gear_clawsd: '收起武器，用利爪攻击。已拥有的剑留在背包中。',
    gear_swordd: '把原矿水晶带回给 Ratchet 来锻造你的第一把剑。装备后用剑斩击。',
    gear_duald: '在水晶宝库取回第二把剑。按住攻击再松开，施展飓风旋斩。',
    gear_joinedd: '集齐两把剑后，在铸造厂取回连接器。按住攻击再松开，掷出会飞回的武器。',
    gear_claws: '徒手利爪', gear_sword: '净化之剑', gear_joined: '合体净化之刃',
    gear_fixed: '这个剧情升级会一直保持安装。', gear_requiresjets: '先获得冲刺喷射器。',
    gear_loading: '角色加载中…', gear_more: '↑ / ↓ 浏览部件',
    t3: ['冷库记录：水晶潜行者偷走了第九台原型重启单元，逃向了水晶矿脉。']
  },
  ru: {
    crest_title: 'Снаряжение', pm_crests: 'Снаряжение', pa_CREST: 'Снаряжение', crest_slots: 'Запас мощности',
    crest_full: 'Недостаточно мощности', crest_hint: 'Выберите деталь · Enter — установить / снять · Назад',
    crest_lore: 'Ваше тело создано, чтобы его чинили и улучшали. Собирайте полезные детали, несите материалы в кузню и ставьте заслуженное снаряжение.',
    crest_none: 'Установлены обычные ботинки. Победите NULLFANG, чтобы вернуть рывковые двигатели; позже улучшения добавят прыжок в воздухе и новые умения.',
    crest_port: 'Ходовое оборудование остаётся установленным. Дополнительное снаряжение делит запас мощности.',
    crest_first: 'Спасённый модуль снаряжения. Установите его, чтобы изменить возможности тела.',
    crest_first2: 'Откройте Пауза → Снаряжение. Выберите деталь, чтобы установить или снять её. Ratchet может увеличить запас мощности.',
    s_slot: 'Регулятор мощности', s_slotd: 'Навсегда добавляет одну единицу мощности снаряжения.',
    sk_mindd: '+1 к мощности снаряжения.', c_ground: 'Изолированные подошвы', c_sprint: 'Реактивный ускоритель',
    c_over: 'Разгон приводов', c_nine: 'Блок аварийного перезапуска',
    m_dash: 'Рывковые двигатели', m_djump: 'Ботинки воздушного прыжка',
    gear_boots: 'Обычные ботинки', gear_bootsd: 'Установлены с самого начала. Прыжок с земли.',
    gear_locked: 'Не получено', gear_installed: 'Установлено', gear_stored: 'В инвентаре',
    gear_core: 'Постоянное ходовое оборудование', gear_parts: 'Снаряжение', gear_empty: 'Пусто',
    gear_dashlock: 'Верните эти двигатели после победы над NULLFANG.',
    gear_djumplock: 'Будущее улучшение ботинок добавит второй прыжок в воздухе.',
    gear_phase: 'Фазовая катушка', gear_phaselock: 'Нужны рывковые двигатели. Установите катушку, чтобы проходить сквозь врагов в рывке.',
    gear_bootslot: 'Ботинки', gear_jetslot: 'Двигатели', gear_handslot: 'Руки', gear_coreslot: 'Ядро',
    weapon_secondlock: 'Выкуйте первый меч и победите Кристального охотника, чтобы вернуть этот клинок.',
    weapon_connectorlock: 'Принесите оба меча после победы над стражем литейной, чтобы вернуть соединитель.',
    i_crystal2: 'Второй меч очищения', i_crystal2d: 'Второй клинок, пока отдельный. Экипированы два меча. Удерживайте атаку для заряда и отпустите для вихря. Оружие меняется в Снаряжении.',
    i_connector: 'Соединитель очищения', i_connectord: 'Соединитель объединяет два меча в один двуклинковый. Удерживайте атаку для заряда и отпустите, чтобы метнуть его; он вернётся в руки. Два меча снова можно выбрать в Снаряжении.',
    gear_dual: 'Два меча очищения', gear_weaponbusy: 'Закончите атаку и верните оружие, прежде чем менять снаряжение.',
    gear_clawsd: 'Уберите оружие и атакуйте когтями. Мечи остаются в инвентаре.',
    gear_swordd: 'Принесите сырой кристалл Ratchet, чтобы выковать первый меч. Экипируйте его для ударов мечом.',
    gear_duald: 'Верните второй меч в Кристальном тайнике. Удерживайте и отпустите атаку для вихря.',
    gear_joinedd: 'Верните соединитель в литейной, получив оба меча. Удерживайте и отпустите атаку для возвращающегося броска.',
    gear_claws: 'Голые когти', gear_sword: 'Меч очищения', gear_joined: 'Соединённый меч очищения',
    gear_fixed: 'Это сюжетное улучшение остаётся установленным.', gear_requiresjets: 'Сначала получите рывковые двигатели.',
    gear_loading: 'Загрузка персонажа…', gear_more: '↑ / ↓ Листать детали',
    t3: ['ЗАПИСЬ ХОЛОДНОГО СКЛАДА: Кристальный охотник украл девятый опытный блок перезапуска и сбежал к кристальным жилам.']
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
  for (const mode of ['claws', 'single', 'dual', 'joined']) {
    const name = mode === 'single' ? 'gear_sword' : 'gear_' + mode;
    rows.push(row('weapon:' + mode, name, name + 'd', weaponOwned(mode, save), false, weaponMode(save) === mode, 'gear_handslot'));
  }
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
  if (r.id.startsWith('weapon:')) {
    if (G.boomer || player && (player.swing || player.swingVis || player.chargeT > 0 || player.swirlT > 0)) {
      G.toast(t('gear_weaponbusy')); sfx('no'); return;
    }
    if (equipWeapon(r.id.slice(7))) { persist(); sfx('ok'); }
    return;
  }
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
  if (typeof keysP !== 'undefined' && keysP.KeyL && typeof exportCombatLog === 'function') { exportCombatLog(); keysP.KeyL = 0; }
  if (inP('CREST') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const n = gearRows(G.save).length;
  G.crestIdx = gearLayout().index;
  if (inP('DOWN')) { G.crestIdx = (G.crestIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.crestIdx = (G.crestIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) gearActivate();
}
function gearTouch(x, y) {
  if (x >= 730 && x <= 935 && y >= 20 && y <= 65 && typeof exportCombatLog === 'function') { exportCombatLog(); return; }
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
  dimPanel(38, 82, 415, 352);
  if (typeof combatStats === 'function') {
    const stats = combatStats(player);
    ftxt(t('combat_export'), 830, 42, 13, '#9fe8ff');
    ftxt(t('combat_stats').replace('%h', stats.hp + '/' + stats.hpMax).replace('%a', stats.attackPower), 245, 96, 12, '#eef3fa');
    ftxt(t('combat_rate').replace('%s', stats.attackSpeed).replace('%b', stats.specialPower) + (stats.specialPerPass ? t('combat_pass') : ''), 245, 426, 11, '#9fe8ff');
  }
  const used = G.save.equip.reduce((n, id) => n + (CRESTS[id] || 0), 0), l = gearLayout(), selected = l.rows[l.index];
  ftxt(t('crest_slots') + '  ' + used + ' / ' + effSlots(), 695, 83, 15, '#37ffd0');
  ftxt(t('gear_parts'), 695, 112, 16, '#9fb8c8');
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
    ['gear_handslot', ({claws:'gear_claws',single:'gear_sword',dual:'gear_dual',joined:'gear_joined'})[weaponMode()], 116],
    ['gear_jetslot', a.dash ? 'm_dash' : 'gear_empty', 374],
    ['gear_bootslot', a.djump ? 'm_djump' : 'gear_boots', 406]
  ];
  for (const [slot, value, y] of labels) ftxt(t(slot) + ' · ' + t(value), 245, y, 15, '#bcebdc');
  l.visible.forEach((r, i) => {
    const y = l.y + i * l.step, sel = l.start + i === l.index;
    c.fillStyle = sel ? 'rgba(55,255,208,0.15)' : 'rgba(110,140,160,0.06)';
    rr(c, l.x, y - 21, l.w, l.h, 6); c.fill();
    // A CREST ROW WEARS THE CREST'S DIAMOND (js/loadout.js): seated filled,
    // carried dashed, not yet hers faint. Traversal hardware and the weapon
    // forms are not loadout systems and keep a bare line; every name moves
    // over by the frame's width so the column stays one column.
    const ar = LANG === 'ar', lo = typeof loadoutKindOf === 'function' ? loadoutKindOf('gear', r.id) : null;
    if (lo) drawLoadoutFrame(c, lo, ar ? 890 : 500, y, 11, r.installed ? 'filled' : r.acquired ? 'empty' : 'locked');
    const align = ar ? 'right' : 'left', x = ar ? 870 : 520;
    ftxt(t(r.name), x, y - 4, 16, r.acquired ? '#eef3fa' : '#6f8294', align);
    // ONE STYLE AT A TIME (C1): a worn seal with an attack block says whether
    // it is the one setting her fighting style, or which seal is
    const note = r.installed && typeof crestStyleNote === 'function' ? crestStyleNote(r.id) : '';
    ftxt(t(r.slot) + ' · ' + t(r.installed ? 'gear_installed' : r.acquired ? 'gear_stored' : 'gear_locked') + (note ? ' · ' + note : ''), x, y + 13, 11, r.installed ? '#37ffd0' : '#8098ad', align);
  });
  ftxt('↑', 565, 432, 22, '#37ffd0'); ftxt((l.index + 1) + ' / ' + l.rows.length, 695, 432, 13, '#8aa2b5'); ftxt('↓', 825, 432, 22, '#37ffd0');
  // the part's own line, then — for a seal that changes how she fights — what
  // it does to her attacks, in plain words (C1)
  const fight = typeof crestFightText === 'function' && Object.prototype.hasOwnProperty.call(CRESTS, selected.id) ? crestFightText(selected.id) : '';
  const wrap = typeof wrapCrest === 'function' ? wrapCrest : wrapText;
  const lines = wrap(t(selected.desc), 850, 14).slice(0, fight ? 1 : 2).concat(fight ? wrap(fight, 850, 14).slice(0, 2) : []);
  lines.forEach((line, i) => ftxt(line, 480, 462 + i * 19, 14, i && fight ? '#e2edf5' : '#b2c6d4'));
  ftxt(t('crest_hint'), 480, 516, 12, '#8aa2b5');
}
// CREST NAMES AND THEIR PASSIVES in tr / zh / ru. The tables in js/i18n.js carry
// only English and Arabic, so in three of the five languages a crest's name
// and what it does fell back to English — visible since C1 put "Style held by
// <crest>" on screen. The English and Arabic are read from I18N so this layer
// changes nothing in those two; the four names GEAR_TEXT renames for the robot
// (sprint, over, ground, nine) keep theirs.
(function () {
  if (typeof TEXT_LAYERS === 'undefined' || typeof I18N === 'undefined') return;
  const KEYS = ['c_claws', 'c_plate', 'c_magnet', 'c_siphon', 'c_phantom',
    'c_clawsd', 'c_overd', 'c_plated', 'c_magnetd', 'c_siphond', 'c_phantomd', 'c_groundd', 'c_sprintd', 'c_nined'];
  const pick = (L) => { const o = {}; for (const k of KEYS) if (I18N[L] && I18N[L][k] != null) o[k] = I18N[L][k]; return o; };
  TEXT_LAYERS.push({
    robo: true,
    en: pick('en'), ar: pick('ar'),
    tr: { c_claws: 'Bilenmiş Pençeler', c_plate: 'Kalın Zırh', c_magnet: 'Mıknatıs Çekirdek', c_siphon: 'Volt Sifonu', c_phantom: 'Hayalet Bobin',
      c_clawsd: 'Pençe hasarı +%25.', c_overd: 'Pençelerini %30 daha hızlı savur.', c_plated: 'Takılıyken +1 çekirdek.',
      c_magnetd: 'Hurda uzaktan sana uçar.', c_siphond: 'Vuruş başına %50 daha fazla volt.', c_phantomd: 'Atılırken kısa süre dokunulmaz olursun.',
      c_groundd: 'Canlı raylar sana zarar veremez — kırılgan olanı kesip geçebilirsin.', c_sprintd: '%15 daha hızlı koş, daha uzağa atıl.',
      c_nined: 'Her dinlenmede bir kez ölümü atlat: 3 çekirdekle dirilirsin.' },
    zh: { c_claws: '磨利之爪', c_plate: '厚重装甲', c_magnet: '磁力核心', c_siphon: '电压虹吸', c_phantom: '幻影线圈',
      c_clawsd: '利爪伤害 +25%。', c_overd: '挥爪速度加快 30%。', c_plated: '装备时核心 +1。',
      c_magnetd: '废料会从远处飞向你。', c_siphond: '每次命中多获得 50% 电压。', c_phantomd: '冲刺时短暂无敌。',
      c_groundd: '带电轨道伤不到你——脆弱的轨道还能被切开。', c_sprintd: '奔跑快 15%，冲刺更远。',
      c_nined: '每次休息可免死一次：以 3 个核心复活。' },
    ru: { c_claws: 'Заточенные когти', c_plate: 'Толстая броня', c_magnet: 'Магнитное ядро', c_siphon: 'Вольт-сифон', c_phantom: 'Фантомная катушка',
      c_clawsd: 'Урон когтями +25%.', c_overd: 'Когти бьют на 30% быстрее.', c_plated: '+1 ядро, пока установлено.',
      c_magnetd: 'Лом летит к вам издалека.', c_siphond: 'На 50% больше вольт за удар.', c_phantomd: 'Рывок ненадолго делает вас неуязвимой.',
      c_groundd: 'Рельсы под током вам не вредят — а хрупкие можно прорубить.', c_sprintd: 'Бег на 15% быстрее, рывок дальше.',
      c_nined: 'Раз за отдых обмануть смерть: воскрешение с 3 ядрами.' },
  });
})();
