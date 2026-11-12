// Test script voor de 6 types Captchas
const CAPTCHA_PHOTO_SETS = [
  {
    targetName: "auto's",
    targetSingular: "een auto 🚗",
    tiles: [
      { id: 'c1', img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'c2', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'c3', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'c4', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'c5', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'c6', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  },
  {
    targetName: "fietsen",
    targetSingular: "een fiets 🚲",
    tiles: [
      { id: 'b1', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'b2', img: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'b3', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b4', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b5', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b6', img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  },
  {
    targetName: "verkeerslichten",
    targetSingular: "een verkeerslicht 🚦",
    tiles: [
      { id: 'tl1', img: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'tl2', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'tl3', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'tl4', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'tl5', img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'tl6', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  }
];

function generateTestCaptcha(forcedType = null) {
  const types = ['grid', 'rotate', 'slider', 'sequence', 'unique', 'code'];
  const type = forcedType || types[Math.floor(Math.random() * types.length)];

  if (type === 'grid') {
    const set = CAPTCHA_PHOTO_SETS[Math.floor(Math.random() * CAPTCHA_PHOTO_SETS.length)];
    const shuffledTiles = [...set.tiles].sort(() => Math.random() - 0.5);
    return {
      uiType: 'grid',
      title: `Selecteer alle vakjes met ${set.targetSingular}`,
      subTitle: `Klik op alle afbeeldingen die ${set.targetName} bevatten`,
      targetName: set.targetName,
      tiles: shuffledTiles
    };
  }

  if (type === 'rotate') {
    const icons = [
      { icon: '🚗', name: 'de auto' },
      { icon: '🗝️', name: 'de sleutel' },
      { icon: '🎓', name: 'het diploma' },
      { icon: '🐕', name: 'het hondje' },
      { icon: '✈️', name: 'het vliegtuig' }
    ];
    const chosen = icons[Math.floor(Math.random() * icons.length)];
    const initialAngle = [90, 180, 270][Math.floor(Math.random() * 3)];
    return {
      uiType: 'rotate',
      title: 'Draai het object rechtop',
      subTitle: `Draai ${chosen.name} totdat deze exact rechtop (0°) staat`,
      icon: chosen.icon,
      name: chosen.name,
      initialAngle: initialAngle
    };
  }

  if (type === 'slider') {
    const targets = [55, 65, 75, 80, 85];
    const target = targets[Math.floor(Math.random() * targets.length)];
    return {
      uiType: 'slider',
      title: 'Schuif het puzzelstukje op zijn plek',
      subTitle: 'Sleep de slider zodat het stukje precies in het vakje past',
      targetPercent: target
    };
  }

  if (type === 'sequence') {
    const symbols = ['⭐', '🚀', '🎯', '🔥', '💎', '⚡'];
    const shuffled = [...symbols].sort(() => Math.random() - 0.5);
    const targetSeq = [shuffled[0], shuffled[1], shuffled[2]];
    const choicePool = [...shuffled.slice(0, 5)].sort(() => Math.random() - 0.5);
    return {
      uiType: 'sequence',
      title: 'Klik de symbolen in de juiste volgorde',
      subTitle: 'Volg de getoonde volgorde van links naar rechts',
      targetSequence: targetSeq,
      choicePool: choicePool
    };
  }

  if (type === 'unique') {
    const pairs = [
      ['🍎', '🍎'],
      ['🍌', '🍌'],
      ['🍇', '🍇']
    ];
    const uniqueIcon = '🥑';
    const all = [pairs[0][0], pairs[0][1], pairs[1][0], pairs[1][1], pairs[2][0], pairs[2][1], uniqueIcon];
    const tiles = all.sort(() => Math.random() - 0.5).map((ic, i) => ({
      id: `u_${i}`,
      icon: ic,
      isUnique: ic === uniqueIcon
    }));
    return {
      uiType: 'unique',
      title: 'Vind het unieke symbool',
      subTitle: 'Klik op het enige symbool dat géén duplicaat heeft',
      tiles: tiles
    };
  }

  // Classic code
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return {
    uiType: 'text_input',
    title: 'Typ de beveiligingscode',
    subTitle: 'Typ de 4 tekens exact over',
    expectedAnswer: code
  };
}

console.log('Testing all 6 captcha types:');
['grid', 'rotate', 'slider', 'sequence', 'unique', 'code'].forEach(t => {
  const c = generateTestCaptcha(t);
  console.log(`✓ Generated ${t}: ${c.title} (uiType: ${c.uiType})`);
});

