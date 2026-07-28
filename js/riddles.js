// CLAWBYTE — Mind Node riddles (knowledge → IQ → Neural Tree skills)
//
// IMPORT FORMAT for external riddle packs (e.g. "Who Has the Biggest Brain"):
// append objects with this exact shape to RIDDLES (theme-neutral content is
// fine — re-theme wording to the machine world where possible):
// {
//   id: 'unique-string',
//   iq: 10,                                  // knowledge points awarded
//   q:       { en: 'Question…', ar: 'السؤال…' },
//   choices: [ { en:'…', ar:'…' }, { en:'…', ar:'…' }, { en:'…', ar:'…' } ],
//   correct: 0                               // index into choices
// }
const RIDDLES = [
  { id: 'keys', iq: 10,
    q: { en: 'I carry a thousand keys yet open no gate. What am I?', ar: 'أحمل ألف مفتاح ولا أفتح بوابة واحدة. من أنا؟' },
    choices: [{ en: 'A key-smith drone', ar: 'روبوت صانع مفاتيح' }, { en: 'An input terminal', ar: 'طرفية إدخال' }, { en: 'A prison warden', ar: 'حارس سجن' }],
    correct: 1 },
  { id: 'wires', iq: 10,
    q: { en: 'I race through the wires all day, yet I never leave home. What am I?', ar: 'أركض في الأسلاك طوال اليوم ولا أغادر البيت أبدًا. من أنا؟' },
    choices: [{ en: 'A courier drone', ar: 'روبوت توصيل' }, { en: 'A spider-bot', ar: 'روبوت عنكبوت' }, { en: 'The electric current', ar: 'التيار الكهربائي' }],
    correct: 2 },
  { id: 'pit', iq: 10,
    q: { en: 'The more you take from me, the bigger I become. What am I?', ar: 'كلما أخذتَ مني أكثر، كبرتُ أكثر. من أنا؟' },
    choices: [{ en: 'A scrap pit', ar: 'حفرة الخردة' }, { en: 'A battery', ar: 'بطارية' }, { en: 'A memory bank', ar: 'بنك ذاكرة' }],
    correct: 0 },
  { id: 'heart', iq: 10,
    q: { en: 'I have a heart that never beats, and still I can die. What am I?', ar: 'لي قلبٌ لا ينبض، ومع ذلك يمكن أن أموت. من أنا؟' },
    choices: [{ en: 'A stone statue', ar: 'تمثال حجري' }, { en: 'A machine with a core', ar: 'آلة بنواة' }, { en: 'A shadow', ar: 'ظل' }],
    correct: 1 },
  { id: 'tomorrow', iq: 10,
    q: { en: 'I am always coming, but I never arrive. What am I?', ar: 'أنا قادمٌ دائمًا ولكنني لا أصل أبدًا. من أنا؟' },
    choices: [{ en: 'Tomorrow', ar: 'الغد' }, { en: 'A delivery drone', ar: 'روبوت توصيل' }, { en: 'A signal echo', ar: 'صدى إشارة' }],
    correct: 0 },
  { id: 'shadow', iq: 10,
    q: { en: 'I follow you all day in the light, and vanish in the dark. What am I?', ar: 'أتبعك طوال النهار في الضوء وأختفي في الظلام. من أنا؟' },
    choices: [{ en: 'A patrol drone', ar: 'روبوت دورية' }, { en: 'Your shadow', ar: 'ظلّك' }, { en: 'Rust', ar: 'الصدأ' }],
    correct: 1 },
  { id: 'mind', iq: 15,
    q: { en: 'What grows sharper the more you use it?', ar: 'ما الذي يزداد حدّةً كلما استخدمته أكثر؟' },
    choices: [{ en: 'A claw', ar: 'مخلب' }, { en: 'A drill bit', ar: 'رأس مثقاب' }, { en: 'The mind', ar: 'العقل' }],
    correct: 2 },
  { id: 'map', iq: 15,
    q: { en: 'I hold cities without houses, rivers without water, and depths without darkness. What am I?', ar: 'أحوي مدنًا بلا بيوت، وأنهارًا بلا ماء، وأعماقًا بلا ظلام. من أنا؟' },
    choices: [{ en: 'A map', ar: 'خريطة' }, { en: 'An archive', ar: 'أرشيف' }, { en: 'A dream-log', ar: 'سجلّ أحلام' }],
    correct: 0 },
];

// Neural Tree — skills unlocked with accumulated IQ
const SKILLS = [
  { id: 'mind', cost: 10, tier: 0 },    // +1 crest socket
  { id: 'calc', cost: 20, tier: 0 },    // stronger combo finisher
  { id: 'reflex', cost: 30, tier: 1 },  // longer invincibility after hits
  { id: 'router', cost: 40, tier: 1 },  // cheaper EMP
  { id: 'triple', cost: 60, tier: 2 },  // third jump
  { id: 'wave', cost: 80, tier: 2 },    // slashes fire an energy wave
];
function tierOpen(tier, unlocked) { return tier === 0 || (tier === 1 && unlocked >= 1) || (tier === 2 && unlocked >= 3); }

// Relics — bonus items: 'drop' from enemy wrecks, boss trophies, or hidden glimmers
const RELIC_DROPS = ['bell', 'lens', 'coolant', 'spring'];
const RELIC_TROPHY = { glitch: 'fang', brood: 'silk', atlas: 'ember', zero: 'shard', prism: 'whisker', mother: 'silent' };
const RELIC_ICONS = { bell: '🔔', lens: '◐', coolant: '🧪', spring: '〰', fang: '⟅', silk: '❋', ember: '🔥', shard: '❆', whisker: '⌇', silent: '●', collar: '◍', coin: '◎', star: '✦', sigil1: '⚿', sigil2: '⚿', sigil3: '⚿', aegis: '⛨' };
