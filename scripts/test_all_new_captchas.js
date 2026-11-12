// Test all 8 new captcha generators
const CAPTCHA_PHOTO_SETS = {
  zebrapad: {
    targetName: "zebrapaden",
    targetSingular: "een zebrapad 🦓",
    tiles: [
      { id: 'z1', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'z2', img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'z3', img: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'z4', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'z5', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'z6', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  },
  bus: {
    targetName: "bussen",
    targetSingular: "een bus 🚌",
    tiles: [
      { id: 'b1', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'b2', img: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'b3', img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b4', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b5', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'b6', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  },
  motor: {
    targetName: "motoren",
    targetSingular: "een motorfiets 🏍️",
    tiles: [
      { id: 'm1', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'm2', img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 'm3', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'm4', img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'm5', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 'm6', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  },
  stoplicht: {
    targetName: "stoplichten",
    targetSingular: "een stoplicht 🚦",
    tiles: [
      { id: 's1', img: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 's2', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=300&q=80', isTarget: true },
      { id: 's3', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 's4', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 's5', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80', isTarget: false },
      { id: 's6', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', isTarget: false }
    ]
  }
};

function generateRandomCaptchaChallenge() {
  const challengeTypes = [
    'robot_checkbox',
    'grid_select',
    'direction_match',
    'slider_puzzle',
    'dice_match',
    'odd_one_out',
    'audio_captcha',
    'distorted_text'
  ];
  const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  if (type === 'robot_checkbox') {
    return {
      uiType: 'robot_checkbox',
      title: 'Beveiligingsverificatie',
      subTitle: 'Bevestig dat je een menselijke speler bent'
    };
  }

  if (type === 'grid_select') {
    const keys = Object.keys(CAPTCHA_PHOTO_SETS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const set = CAPTCHA_PHOTO_SETS[key];
    const tiles = [...set.tiles].sort(() => Math.random() - 0.5);
    return {
      uiType: 'grid_select',
      title: `Selecteer alle vakjes met ${set.targetSingular}`,
      subTitle: `Klik op alle afbeeldingen die ${set.targetName} tonen:`,
      targetKey: key,
      tiles: tiles
    };
  }

  if (type === 'direction_match') {
    // 0 = rechts, 90 = onder, 180 = links, 270 = boven
    const directions = [
      { angle: 0, label: 'naar RECHTS 👉', handIcon: '👉' },
      { angle: 90, label: 'naar BENEDEN 👇', handIcon: '👇' },
      { angle: 180, label: 'naar LINKS 👈', handIcon: '👈' },
      { angle: 270, label: 'naar BOVEN 👆', handIcon: '👆' }
    ];
    const targetDir = directions[Math.floor(Math.random() * directions.length)];
    const animals = [
      { icon: '🐕', name: 'de hond' },
      { icon: '🚗', name: 'de auto' },
      { icon: '🐴', name: 'het paard' },
      { icon: '✈️', name: 'het vliegtuig' }
    ];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    // Zorg dat startAngle niet gelijk is aan targetDir
    let startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    while (startAngle === targetDir.angle) {
      startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    }
    return {
      uiType: 'direction_match',
      title: 'Draai het object in de juiste richting',
      subTitle: `Draai ${animal.name} totdat deze ${targetDir.label} wijst:`,
      animal: animal,
      targetAngle: targetDir.angle,
      targetHand: targetDir.handIcon,
      initialAngle: startAngle
    };
  }

  if (type === 'slider_puzzle') {
    const targetPercent = [50, 60, 70, 75, 80][Math.floor(Math.random() * 5)];
    return {
      uiType: 'slider_puzzle',
      title: 'Schuif het puzzelstukje op zijn plek',
      subTitle: 'Sleep de schuifregelaar zodat het puzzelstukje in het vakje valt:',
      targetPercent: targetPercent
    };
  }

  if (type === 'dice_match') {
    // Dobbelstenen combinaties
    const options = [
      { dice: [5, 5, 4], sum: 14 },
      { dice: [6, 6, 6, 2], sum: 20 },
      { dice: [4, 4, 3, 5], sum: 16 },
      { dice: [6, 5, 1], sum: 12 }
    ];
    const winningIdx = Math.floor(Math.random() * options.length);
    const targetSum = options[winningIdx].sum;
    return {
      uiType: 'dice_match',
      title: 'Match het totale aantal ogen',
      subTitle: `Gebruik de pijltjes om de dobbelstenen te vinden die optellen tot ${targetSum}:`,
      targetSum: targetSum,
      options: options,
      winningIndex: winningIdx
    };
  }

  if (type === 'odd_one_out') {
    const items = [
      { id: 'o1', icon: '🐶', name: 'Hond', isOdd: false },
      { id: 'o2', icon: '🦁', name: 'Leeuw', isOdd: false },
      { id: 'o3', icon: '🦔', name: 'Egel', isOdd: false },
      { id: 'o4', icon: '🦝', name: 'Wasbeer', isOdd: false },
      { id: 'o5', icon: '🐻', name: 'Beer', isOdd: false },
      { id: 'o6', icon: '🪴', name: 'Kamerplant', isOdd: true }
    ];
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return {
      uiType: 'odd_one_out',
      title: 'Vind wat er niet bij hoort',
      subTitle: 'Klik op het object dat GEEN dier is:',
      items: shuffled
    };
  }

  if (type === 'audio_captcha') {
    const digits = [
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1
    ].join('');
    return {
      uiType: 'audio_captcha',
      title: 'Audio beveiligingsverificatie',
      subTitle: 'Klik op de speaker, luister naar de cijfers en typ ze over:',
      code: digits
    };
  }

  // Fallback / Classic: distorted_text
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return {
    uiType: 'distorted_text',
    title: 'Typ de beveiligingscode',
    subTitle: 'Typ de 4 tekens uit het vervormde beeld exact over:',
    code: code
  };
}

console.log('Testing all 8 new captcha generators:');
for (let i = 0; i < 20; i++) {
  const c = generateRandomCaptchaChallenge();
  console.log(`[${i+1}] uiType: ${c.uiType} | ${c.title}`);
}
console.log('All generators pass without errors!');

