// CRESTS THAT CHANGE HOW SHE FIGHTS (handoff Part 2 C1): the plain-words line
// each style-setting seal adds to its card, in all five languages. The numbers
// are CREST_ATTACK's (js/game.js) and docs/CRESTS.md's; tests/crestfight.cjs
// checks every key exists in every language and is translated. Worded for
// both worlds ("your attacks", never claws or hearts): the same seal shapes
// the robot's claws and blades and the hero's sword.
//   cf_<id>   the full line on the item card, Gear and the Crests panel
//   cfs_<id>  the style's short name (the shop line, the active-style note)
TEXT_LAYERS.push({
  en: {
    cf_style: 'Fighting style', cf_active: 'Sets your fighting style', cf_held: 'Style held by %s',
    cf_claws: 'Fighting style — Long reach: every weapon cuts 25% further, but 10% narrower, and recovers 15% slower.',
    cf_plate: 'Fighting style — Heavy slam: 35% wider, 40% more push, slower to swing and recover; the down-strike goes diagonal.',
    cf_over: 'Fighting style — Quick swipes: 20% quicker cuts, but 15% shorter with 25% less push.',
    cf_phantom: 'Fighting style — Lunge: every cut carries you forward, but reaches 10% less and recovers 10% slower.',
    cf_ground: 'Fighting style — Rooted: no step and no recoil; 15% wider and 30% more push, 10% slower recovery.',
    cf_nine: 'Fighting style — Two-beat: every second cut is your finisher; a shorter, heavier string.',
    cfs_claws: 'Long reach', cfs_plate: 'Heavy slam', cfs_over: 'Quick swipes',
    cfs_phantom: 'Lunge', cfs_ground: 'Rooted', cfs_nine: 'Two-beat',
  },
  ar: {
    cf_style: 'أسلوب القتال', cf_active: 'يحدّد أسلوب قتالك', cf_held: 'الأسلوب يحدّده %s',
    cf_claws: 'أسلوب القتال — مدى طويل: كل سلاح يقطع أبعد بنسبة 25%، لكن الضربة أضيق بنسبة 10% والتعافي أبطأ بنسبة 15%.',
    cf_plate: 'أسلوب القتال — سحق ثقيل: أعرض بنسبة 35% ودفع أقوى بنسبة 40%، لكن التأرجح والتعافي أبطأ؛ والضربة السفلية تصير مائلة.',
    cf_over: 'أسلوب القتال — خطفات سريعة: ضربات أسرع بنسبة 20%، لكنها أقصر بنسبة 15% ودفعها أضعف بنسبة 25%.',
    cf_phantom: 'أسلوب القتال — اندفاعة: كل ضربة تحملك إلى الأمام، لكن مداها أقصر بنسبة 10% والتعافي أبطأ بنسبة 10%.',
    cf_ground: 'أسلوب القتال — ثبات: لا خطوة ولا ارتداد؛ أعرض بنسبة 15% ودفع أقوى بنسبة 30%، والتعافي أبطأ بنسبة 10%.',
    cf_nine: 'أسلوب القتال — إيقاع ثنائي: كل ضربة ثانية هي ضربتك الختامية؛ سلسلة أقصر وأثقل.',
    cfs_claws: 'مدى طويل', cfs_plate: 'سحق ثقيل', cfs_over: 'خطفات سريعة',
    cfs_phantom: 'اندفاعة', cfs_ground: 'ثبات', cfs_nine: 'إيقاع ثنائي',
  },
  tr: {
    cf_style: 'Dövüş stili', cf_active: 'Dövüş stilini belirler', cf_held: 'Stili %s belirliyor',
    cf_claws: 'Dövüş stili — Uzun menzil: her silah %25 daha uzağa keser, ama darbe %10 daha dar ve toparlanma %15 daha yavaş.',
    cf_plate: 'Dövüş stili — Ağır darbe: %35 daha geniş, %40 daha güçlü itiş; savurma ve toparlanma daha yavaş, aşağı vuruş çapraz iner.',
    cf_over: 'Dövüş stili — Hızlı savuruş: darbeler %20 daha çabuk, ama %15 daha kısa ve itişi %25 daha zayıf.',
    cf_phantom: 'Dövüş stili — Hamle: her darbe seni ileri taşır, ama menzil %10 daha kısa ve toparlanma %10 daha yavaş.',
    cf_ground: 'Dövüş stili — Sabit duruş: adım yok, geri tepme yok; %15 daha geniş, %30 daha güçlü itiş, toparlanma %10 daha yavaş.',
    cf_nine: 'Dövüş stili — İki vuruş: her ikinci darbe bitirici vuruşun olur; daha kısa, daha ağır bir seri.',
    cfs_claws: 'Uzun menzil', cfs_plate: 'Ağır darbe', cfs_over: 'Hızlı savuruş',
    cfs_phantom: 'Hamle', cfs_ground: 'Sabit duruş', cfs_nine: 'İki vuruş',
  },
  zh: {
    cf_style: '战斗风格', cf_active: '决定你的战斗风格', cf_held: '战斗风格由%s决定',
    cf_claws: '战斗风格·长距：所有武器的攻击距离+25%，但斩击窄10%，收招慢15%。',
    cf_plate: '战斗风格·重砸：斩击宽35%，击退+40%，但出招与收招更慢；下劈变为斜劈。',
    cf_over: '战斗风格·快斩：出招快20%，但距离短15%，击退弱25%。',
    cf_phantom: '战斗风格·突进：每次斩击都带你向前冲，但距离短10%，收招慢10%。',
    cf_ground: '战斗风格·扎根：不前踏、不后坐；斩击宽15%，击退+30%，收招慢10%。',
    cf_nine: '战斗风格·双拍：每第二击就是终结技；连段更短、更重。',
    cfs_claws: '长距', cfs_plate: '重砸', cfs_over: '快斩',
    cfs_phantom: '突进', cfs_ground: '扎根', cfs_nine: '双拍',
  },
  ru: {
    cf_style: 'Стиль боя', cf_active: 'Задаёт ваш стиль боя', cf_held: 'Стиль задаёт: %s',
    cf_claws: 'Стиль боя — Дальний удар: любое оружие бьёт на 25% дальше, но на 10% уже, а восстановление на 15% дольше.',
    cf_plate: 'Стиль боя — Тяжёлый удар: на 35% шире, отбрасывает на 40% сильнее, но замах и восстановление медленнее; удар вниз — по диагонали.',
    cf_over: 'Стиль боя — Быстрые взмахи: удары на 20% быстрее, но на 15% короче и отбрасывают на 25% слабее.',
    cf_phantom: 'Стиль боя — Выпад: каждый удар несёт вас вперёд, но бьёт на 10% ближе и восстанавливается на 10% дольше.',
    cf_ground: 'Стиль боя — Стойка: ни шага, ни отдачи; на 15% шире, отбрасывает на 30% сильнее, восстановление на 10% дольше.',
    cf_nine: 'Стиль боя — Двойной ритм: каждый второй удар — завершающий; серия короче и тяжелее.',
    cfs_claws: 'Дальний удар', cfs_plate: 'Тяжёлый удар', cfs_over: 'Быстрые взмахи',
    cfs_phantom: 'Выпад', cfs_ground: 'Стойка', cfs_nine: 'Двойной ритм',
  },
});
