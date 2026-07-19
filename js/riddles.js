// NOSTOS — riddles of the Oracle (knowledge → Metis → Gifts of Cunning)
// All riddles original to this project. Shape:
// { id, iq, q:{en,ar}, choices:[{en,ar}×3], correct }
const RIDDLES = [
  { id: 'wind', iq: 10,
    q: { en: 'I have no wings, yet I carry a hundred ships. I have no mouth, yet sailors curse my howling. What am I?', ar: 'لا أجنحة لي ومع ذلك أحمل مئة سفينة. لا فم لي ومع ذلك يلعن البحّارة عوائي. من أنا؟' },
    choices: [{ en: 'The oarsmen', ar: 'المجدّفون' }, { en: 'The wind', ar: 'الريح' }, { en: 'A sea-god', ar: 'إله البحر' }],
    correct: 1 },
  { id: 'river', iq: 10,
    q: { en: 'I run day and night without legs, and sing without a tongue, yet I never once leave my bed. What am I?', ar: 'أجري ليل نهار بلا ساقين، وأغنّي بلا لسان، ولا أغادر فراشي أبدًا. من أنا؟' },
    choices: [{ en: 'A messenger', ar: 'رسول' }, { en: 'A dream', ar: 'حلم' }, { en: 'A river', ar: 'نهر' }],
    correct: 2 },
  { id: 'pit', iq: 10,
    q: { en: 'The more you take from me, the greater I become. What am I?', ar: 'كلما أخذتَ مني أكثر، صرتُ أعظم. من أنا؟' },
    choices: [{ en: 'A pit in the sand', ar: 'حفرة في الرمل' }, { en: 'A purse of obols', ar: 'صرّة أوبولات' }, { en: 'A storm cloud', ar: 'غيمة عاصفة' }],
    correct: 0 },
  { id: 'statue', iq: 10,
    q: { en: 'I have a face but never speak, I stand my watch but never sleep, and I remember a man long after the sea forgets him. What am I?', ar: 'لي وجه ولا أتكلم، أقف حارسًا ولا أنام، وأذكر الرجل بعدما ينساه البحر. من أنا؟' },
    choices: [{ en: 'An old helmsman', ar: 'ربّان عجوز' }, { en: 'A marble statue', ar: 'تمثال من رخام' }, { en: 'A shade of the dead', ar: 'طيف من الموتى' }],
    correct: 1 },
  { id: 'tomorrow', iq: 10,
    q: { en: 'I am always sailing toward you, yet I never make harbor. What am I?', ar: 'أُبحر نحوك دائمًا ولكنني لا أبلغ المرفأ أبدًا. من أنا؟' },
    choices: [{ en: 'Tomorrow', ar: 'الغد' }, { en: 'A lost ship', ar: 'سفينة تائهة' }, { en: 'The horizon’s gull', ar: 'نورس الأفق' }],
    correct: 0 },
  { id: 'shadow', iq: 10,
    q: { en: 'I walk with you under the sun, swim with you under the moon, and abandon you only in the dark. What am I?', ar: 'أمشي معك تحت الشمس، وأسبح معك تحت القمر، ولا أهجرك إلا في الظلام. من أنا؟' },
    choices: [{ en: 'A loyal hound', ar: 'كلب وفيّ' }, { en: 'Your shadow', ar: 'ظلّك' }, { en: 'Your name', ar: 'اسمك' }],
    correct: 1 },
  { id: 'metis', iq: 15,
    q: { en: 'Swords dull with use, and oars wear thin — what grows only sharper the more it is used?', ar: 'السيوف تكلّ مع الاستعمال والمجاديف تُبرى — فما الذي لا يزداد إلا حدّةً كلما استُعمل؟' },
    choices: [{ en: 'A spear of ash-wood', ar: 'رمح من خشب الدردار' }, { en: 'The tooth of Scylla', ar: 'ناب سكيلّا' }, { en: 'The mind', ar: 'العقل' }],
    correct: 2 },
  { id: 'chart', iq: 15,
    q: { en: 'I hold islands without shores, seas without salt, and a hundred harbors no keel has touched. What am I?', ar: 'أحوي جزرًا بلا شواطئ، وبحارًا بلا ملح، ومئة مرفأ لم يمسّها هيكل سفينة. من أنا؟' },
    choices: [{ en: 'A chart', ar: 'خريطة' }, { en: 'A bard’s song', ar: 'أغنية منشد' }, { en: 'The night sky', ar: 'سماء الليل' }],
    correct: 0 },
];

// Gifts of Cunning — skills unlocked with accumulated Metis
const SKILLS = [
  { id: 'mind', cost: 10, tier: 0 },    // +1 blessing socket
  { id: 'calc', cost: 20, tier: 0 },    // stronger combo finisher
  { id: 'reflex', cost: 30, tier: 1 },  // longer invincibility after hits
  { id: 'router', cost: 40, tier: 1 },  // cheaper Aegis Pulse
  { id: 'triple', cost: 60, tier: 2 },  // third jump
  { id: 'wave', cost: 80, tier: 2 },    // slashes fire a kleos crescent
];
function tierOpen(tier, unlocked) { return tier === 0 || (tier === 1 && unlocked >= 1) || (tier === 2 && unlocked >= 3); }

// Treasures — 'drop' from fallen foes, guardian trophies, or hidden glimmers
const RELIC_DROPS = ['bell', 'lens', 'coolant', 'spring'];
const RELIC_TROPHY = { glitch: 'fang', brood: 'silk', atlas: 'ember', zero: 'shard', prism: 'whisker', mother: 'silent' };
const RELIC_ICONS = { bell: '🔔', lens: '◐', coolant: '🧪', spring: '〰', fang: '⟅', silk: '❋', ember: '✶', shard: '❀', whisker: '⌇', silent: '⌒', collar: '◍', coin: '◎', star: '✦' };
