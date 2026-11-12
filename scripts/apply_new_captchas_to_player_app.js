const fs = require('fs');
const path = require('path');

const playerAppPath = path.join(__dirname, '..', 'public', 'js', 'playerApp.js');
let code = fs.readFileSync(playerAppPath, 'utf8');

const newCaptchaCode = `  // ==========================================
  // GEAVANCEERDE VISUELE CAPTCHA ENGINE (8 TYPES)
  // - Ik ben geen robot checkbox
  // - Selecteer alle {zebrapad, bus, motor, stoplicht} (3x2 / 3x3 photo grid)
  // - Richting captcha (Hand wijst richting, dier/auto moet matchen)
  // - Slider captcha (Puzzelstukje horizontaal naar doelvakje)
  // - Dice matching captcha (Dobbelstenen optellen tot doel)
  // - Odd one out (Kamerplant tussen dieren)
  // - Audio captcha (Gesproken cijfers via SpeechSynthesis)
  // - Distorted text captcha (Klassiek vertekend beeld)
  // ==========================================

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
      targetName: "motorfietsen",
      targetSingular: "een motor 🏍️",
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
        subTitle: 'Bevestig met één klik dat je een menselijke speler bent:'
      };
    }

    if (type === 'grid_select') {
      const keys = Object.keys(CAPTCHA_PHOTO_SETS);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const set = CAPTCHA_PHOTO_SETS[key];
      const tiles = [...set.tiles].sort(() => Math.random() - 0.5);
      return {
        uiType: 'grid_select',
        title: \`Selecteer alle \${set.targetName}\`,
        subTitle: \`Klik op alle vakjes met \${set.targetSingular}:\`,
        targetKey: key,
        tiles: tiles
      };
    }

    if (type === 'direction_match') {
      const directions = [
        { angle: 0, label: 'naar RECHTS 👉' },
        { angle: 90, label: 'naar BENEDEN 👇' },
        { angle: 180, label: 'naar LINKS 👈' },
        { angle: 270, label: 'naar BOVEN 👆' }
      ];
      const targetDir = directions[Math.floor(Math.random() * directions.length)];
      const animals = [
        { icon: '🐕', name: 'de hond' },
        { icon: '🚗', name: 'de auto' },
        { icon: '🐴', name: 'het paard' },
        { icon: '✈️', name: 'het vliegtuig' }
      ];
      const animal = animals[Math.floor(Math.random() * animals.length)];
      let startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      while (startAngle === targetDir.angle) {
        startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      }
      return {
        uiType: 'direction_match',
        title: 'Draai in de juiste richting',
        subTitle: \`Draai \${animal.name} totdat deze \${targetDir.label} wijst:\`,
        animal: animal,
        targetAngle: targetDir.angle,
        initialAngle: startAngle
      };
    }

    if (type === 'slider_puzzle') {
      const targetPercent = [50, 60, 70, 75, 80][Math.floor(Math.random() * 5)];
      return {
        uiType: 'slider_puzzle',
        title: 'Schuif het puzzelstukje op zijn plek',
        subTitle: 'Sleep de schuifregelaar zodat het puzzelstukje precies in het vakje valt:',
        targetPercent: targetPercent
      };
    }

    if (type === 'dice_match') {
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
        subTitle: \`Gebruik de pijltjes om de dobbelstenen te vinden die optellen tot \${targetSum}:\`,
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
        title: 'Audio verificatie',
        subTitle: 'Klik op de speaker, luister naar de 4 cijfers en voer ze in:',
        code: digits
      };
    }

    // Default: distorted text
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

  function renderCaptchaWidgetHtml(challenge, prefix) {
    if (challenge.uiType === 'robot_checkbox') {
      return \`
        <div class="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 my-2 flex items-center justify-between shadow-xs select-none">
          <label class="flex items-center gap-3 cursor-pointer py-1" id="\${prefix}-robot-label">
            <div id="\${prefix}-robot-box" class="w-7 h-7 rounded-lg border-2 border-stone-400 bg-white flex items-center justify-center transition shadow-inner">
              <span class="material-symbols-outlined text-lg hidden text-emerald-600 font-black" id="\${prefix}-robot-check">check</span>
              <div class="w-4 h-4 border-2 border-stone-400 border-t-emerald-600 rounded-full animate-spin hidden" id="\${prefix}-robot-spinner"></div>
            </div>
            <span class="text-xs font-black text-stone-800">Ik ben geen robot</span>
          </label>
          <div class="flex flex-col items-center opacity-70">
            <span class="material-symbols-outlined text-2xl text-stone-400">sync</span>
            <span class="text-[8px] font-bold text-stone-400 tracking-tighter uppercase">reCAPTCHA</span>
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'grid_select') {
      return \`
        <div class="grid grid-cols-3 gap-2 my-2 select-none" id="\${prefix}-grid-container">
          \${challenge.tiles.map(t => \`
            <div class="captcha-grid-tile aspect-square rounded-xl overflow-hidden relative border-2 border-stone-200 cursor-pointer active:scale-95 transition bg-stone-100 shadow-xs" data-id="\${t.id}" data-target="\${t.isTarget}">
              <img src="\${t.img}" class="w-full h-full object-cover pointer-events-none" alt="optie">
              <div class="tile-check-badge hidden absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow">
                <span class="material-symbols-outlined text-xs">check</span>
              </div>
            </div>
          \`).join('')}
        </div>
      \`;
    }

    if (challenge.uiType === 'direction_match') {
      return \`
        <div class="flex items-center justify-center gap-3 my-2">
          <!-- Doel richting box -->
          <div class="w-24 h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 flex flex-col items-center justify-center shadow-inner relative">
            <span class="text-3xl select-none" style="transform: rotate(\${challenge.targetAngle}deg); display:inline-block;">👉</span>
            <span class="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-wider">Doelrichting</span>
          </div>
          <span class="text-stone-400 text-lg font-bold">➔</span>
          <!-- Roterend object box -->
          <div class="w-24 h-24 rounded-2xl bg-stone-100 border-2 border-stone-300 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <div id="\${prefix}-dir-target" class="text-4xl select-none transition-transform duration-200" style="transform: rotate(\${challenge.initialAngle}deg);">
              \${challenge.animal.icon}
            </div>
            <span class="text-[9px] font-mono font-bold text-stone-500 mt-1" id="\${prefix}-dir-angle">\${challenge.initialAngle}°</span>
          </div>
        </div>
        <div class="flex justify-center gap-2 pt-0.5">
          <button type="button" id="\${prefix}-btn-dir-left" class="py-1.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold active:scale-95 transition flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-sm">rotate_left</span>
            <span>Draai Links</span>
          </button>
          <button type="button" id="\${prefix}-btn-dir-right" class="py-1.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold active:scale-95 transition flex items-center gap-1 cursor-pointer">
            <span>Draai Rechts</span>
            <span class="material-symbols-outlined text-sm">rotate_right</span>
          </button>
        </div>
      \`;
    }

    if (challenge.uiType === 'slider_puzzle') {
      return \`
        <div class="w-full h-20 bg-stone-900 rounded-2xl relative overflow-hidden border border-stone-700 shadow-inner my-2 select-none flex items-center px-3" id="\${prefix}-slider-track">
          <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 0, transparent 8px);"></div>
          <!-- Doel vakje -->
          <div class="absolute w-12 h-12 rounded-xl border-2 border-dashed border-amber-400 bg-amber-400/20 flex items-center justify-center pointer-events-none transition-all duration-150" style="left: calc(\${challenge.targetPercent}% - 24px);" id="\${prefix}-slider-slot">
            <span class="text-[9px] font-black text-amber-300 uppercase tracking-tighter" id="\${prefix}-slider-slot-text">PAS HIER</span>
          </div>
          <!-- Beweegbaar puzzelstukje -->
          <div id="\${prefix}-slider-piece" class="absolute w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg border-2 border-emerald-300 pointer-events-none" style="left: 0px;">
            🧩
          </div>
        </div>
        <div class="space-y-1 text-left">
          <input type="range" id="\${prefix}-slider-range" min="0" max="100" value="0" class="w-full accent-emerald-600 cursor-ew-resize">
        </div>
      \`;
    }

    if (challenge.uiType === 'dice_match') {
      return \`
        <div class="flex items-center justify-center gap-2.5 my-2">
          <!-- Doel getal -->
          <div class="w-20 h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 flex flex-col items-center justify-center shadow-inner">
            <span class="text-3xl font-black text-white drop-shadow">\${challenge.targetSum}</span>
            <span class="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Doel</span>
          </div>
          <span class="text-stone-400 text-lg font-bold">=</span>
          <!-- Dobbelstenen Carousel -->
          <div class="flex-1 h-24 rounded-2xl bg-stone-100 border-2 border-stone-300 flex items-center justify-between px-2 shadow-inner">
            <button type="button" id="\${prefix}-btn-dice-prev" class="w-7 h-7 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 flex items-center justify-center cursor-pointer shadow-xs active:scale-95">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div id="\${prefix}-dice-display" class="flex items-center gap-1 text-2xl font-bold select-none">
            </div>
            <button type="button" id="\${prefix}-btn-dice-next" class="w-7 h-7 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 flex items-center justify-center cursor-pointer shadow-xs active:scale-95">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        <div class="flex justify-center gap-1.5" id="\${prefix}-dice-dots">
          \${challenge.options.map((_, i) => \`
            <div class="w-2 h-2 rounded-full \${i === 0 ? 'bg-emerald-600' : 'bg-stone-300'}" id="\${prefix}-dice-dot-\${i}"></div>
          \`).join('')}
        </div>
      \`;
    }

    if (challenge.uiType === 'odd_one_out') {
      return \`
        <div class="grid grid-cols-3 gap-2.5 my-2" id="\${prefix}-odd-container">
          \${challenge.items.map(it => \`
            <button type="button" class="odd-item-btn p-3 rounded-2xl bg-white hover:bg-stone-50 border-2 border-stone-200 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer group" data-id="\${it.id}" data-odd="\${it.isOdd}">
              <span class="text-3xl select-none group-hover:scale-110 transition">\${it.icon}</span>
              <span class="text-[10px] font-bold text-stone-600">\${it.name}</span>
            </button>
          \`).join('')}
        </div>
      \`;
    }

    if (challenge.uiType === 'audio_captcha') {
      return \`
        <div class="w-full bg-stone-900 rounded-2xl p-3.5 my-2 text-center border border-stone-700 shadow-inner space-y-2">
          <div class="flex items-center justify-center gap-1 h-6">
            <div class="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div class="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" style="animation-delay: 150ms;"></div>
            <div class="w-1.5 h-4 bg-amber-400 rounded-full animate-pulse" style="animation-delay: 300ms;"></div>
            <div class="w-1.5 h-6 bg-rose-400 rounded-full animate-pulse" style="animation-delay: 450ms;"></div>
            <div class="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse" style="animation-delay: 200ms;"></div>
          </div>
          <button type="button" id="\${prefix}-btn-play-audio" class="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-600 cursor-pointer active:scale-95 transition">
            <span class="material-symbols-outlined text-base">volume_up</span>
            <span>Speel 4 gesproken cijfers af</span>
          </button>
        </div>
        <div class="space-y-1 text-left">
          <label class="text-[11px] font-bold text-stone-700 uppercase">Typ de 4 cijfers:</label>
          <input id="\${prefix}-audio-input" type="text" maxlength="4" inputmode="numeric" placeholder="CIJFERS..." autocomplete="off" class="w-full text-center text-xl font-mono font-black tracking-widest uppercase bg-stone-50 border-2 border-stone-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-600">
        </div>
      \`;
    }

    // Default: distorted text
    return \`
      <div class="w-full h-16 bg-stone-900 rounded-2xl flex items-center justify-center font-mono select-none relative overflow-hidden border border-stone-700 shadow-inner my-2">
        <div class="absolute inset-0 opacity-25 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 0, transparent 8px);"></div>
        <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
          <path d="M 10 30 Q 150 5 300 35" stroke="#10b981" stroke-width="2" fill="none"/>
          <path d="M 10 20 Q 150 45 300 20" stroke="#06b6d4" stroke-width="1.5" fill="none"/>
        </svg>
        <span class="transform -rotate-1 skew-x-3 drop-shadow-lg tracking-[10px] relative z-10 text-emerald-400 font-black text-2xl">\${challenge.code}</span>
      </div>
      <div class="space-y-1 text-left">
        <label class="text-[11px] font-bold text-stone-700 uppercase">Typ de 4 tekens exact over:</label>
        <input id="\${prefix}-distorted-input" type="text" maxlength="10" placeholder="CODE..." autocomplete="off" class="w-full text-center text-xl font-mono font-black tracking-widest uppercase bg-stone-50 border-2 border-stone-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-600">
      </div>
    \`;
  }

  function bindCaptchaWidgetEvents(challenge, prefix) {
    if (challenge.uiType === 'robot_checkbox') {
      const box = document.getElementById(\`\${prefix}-robot-box\`);
      const check = document.getElementById(\`\${prefix}-robot-check\`);
      const spinner = document.getElementById(\`\${prefix}-robot-spinner\`);
      challenge.isVerified = false;
      const label = document.getElementById(\`\${prefix}-robot-label\`);
      if (label) {
        label.addEventListener('click', (e) => {
          e.preventDefault();
          if (challenge.isVerified) return;
          spinner.classList.remove('hidden');
          setTimeout(() => {
            spinner.classList.add('hidden');
            check.classList.remove('hidden');
            box.classList.add('border-emerald-600', 'bg-emerald-50');
            challenge.isVerified = true;
            if (window.sounds) window.sounds.playSuccess();
          }, 900);
        });
      }
    } else if (challenge.uiType === 'grid_select') {
      const tiles = document.querySelectorAll(\`#\${prefix}-grid-container .captcha-grid-tile\`);
      tiles.forEach(tile => {
        tile.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          const isSel = tile.classList.toggle('selected');
          const badge = tile.querySelector('.tile-check-badge');
          if (isSel) {
            tile.classList.add('ring-4', 'ring-emerald-500', 'border-emerald-600', 'scale-[0.98]');
            if (badge) badge.classList.remove('hidden');
          } else {
            tile.classList.remove('ring-4', 'ring-emerald-500', 'border-emerald-600', 'scale-[0.98]');
            if (badge) badge.classList.add('hidden');
          }
        });
      });
    } else if (challenge.uiType === 'direction_match') {
      const targetEl = document.getElementById(\`\${prefix}-dir-target\`);
      const angleEl = document.getElementById(\`\${prefix}-dir-angle\`);
      let curAngle = challenge.initialAngle;
      challenge.currentAngle = curAngle;
      const updateDir = () => {
        curAngle = (curAngle % 360 + 360) % 360;
        challenge.currentAngle = curAngle;
        if (targetEl) targetEl.style.transform = \`rotate(\${curAngle}deg)\`;
        if (angleEl) angleEl.textContent = \`\${curAngle}°\`;
        if (window.sounds) window.sounds.playClick();
      };
      const btnLeft = document.getElementById(\`\${prefix}-btn-dir-left\`);
      const btnRight = document.getElementById(\`\${prefix}-btn-dir-right\`);
      if (btnLeft) btnLeft.addEventListener('click', () => { curAngle -= 90; updateDir(); });
      if (btnRight) btnRight.addEventListener('click', () => { curAngle += 90; updateDir(); });
    } else if (challenge.uiType === 'slider_puzzle') {
      const rangeInput = document.getElementById(\`\${prefix}-slider-range\`);
      const piece = document.getElementById(\`\${prefix}-slider-piece\`);
      const slot = document.getElementById(\`\${prefix}-slider-slot\`);
      const slotText = document.getElementById(\`\${prefix}-slider-slot-text\`);
      challenge.currentPercent = 0;
      if (rangeInput) {
        rangeInput.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          challenge.currentPercent = val;
          const trackWidth = rangeInput.offsetWidth || 260;
          const leftPx = (val / 100) * (trackWidth - 48);
          if (piece) piece.style.left = \`\${leftPx}px\`;
          const isMatch = Math.abs(val - challenge.targetPercent) <= 6;
          if (isMatch) {
            if (slot) {
              slot.classList.add('border-emerald-400', 'bg-emerald-400/30', 'scale-105');
              slot.classList.remove('border-amber-400', 'bg-amber-400/20');
            }
            if (slotText) slotText.textContent = 'MATCH! ✓';
          } else {
            if (slot) {
              slot.classList.remove('border-emerald-400', 'bg-emerald-400/30', 'scale-105');
              slot.classList.add('border-amber-400', 'bg-amber-400/20');
            }
            if (slotText) slotText.textContent = 'PAS HIER';
          }
        });
      }
    } else if (challenge.uiType === 'dice_match') {
      const diceIcons = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };
      let diceIdx = 0;
      challenge.currentIndex = 0;
      const updateDiceView = () => {
        challenge.currentIndex = diceIdx;
        const currentOpt = challenge.options[diceIdx];
        const display = document.getElementById(\`\${prefix}-dice-display\`);
        if (display) {
          display.innerHTML = currentOpt.dice.map(d => \`
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-stone-300 shadow-xs text-xl font-bold text-stone-900">\${diceIcons[d] || d}</span>
          \`).join('');
        }
        challenge.options.forEach((_, i) => {
          const dot = document.getElementById(\`\${prefix}-dice-dot-\${i}\`);
          if (dot) dot.className = \`w-2 h-2 rounded-full \${i === diceIdx ? 'bg-emerald-600 scale-125' : 'bg-stone-300'}\`;
        });
      };
      updateDiceView();
      const btnPrev = document.getElementById(\`\${prefix}-btn-dice-prev\`);
      const btnNext = document.getElementById(\`\${prefix}-btn-dice-next\`);
      if (btnPrev) btnPrev.addEventListener('click', () => {
        diceIdx = (diceIdx - 1 + challenge.options.length) % challenge.options.length;
        updateDiceView();
        if (window.sounds) window.sounds.playClick();
      });
      if (btnNext) btnNext.addEventListener('click', () => {
        diceIdx = (diceIdx + 1) % challenge.options.length;
        updateDiceView();
        if (window.sounds) window.sounds.playClick();
      });
    } else if (challenge.uiType === 'odd_one_out') {
      const oddBtns = document.querySelectorAll(\`#\${prefix}-odd-container .odd-item-btn\`);
      challenge.selectedOddId = null;
      oddBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          oddBtns.forEach(b => b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30'));
          btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
          challenge.selectedOddId = btn.getAttribute('data-id');
        });
      });
    } else if (challenge.uiType === 'audio_captcha') {
      const playBtn = document.getElementById(\`\${prefix}-btn-play-audio\`);
      const speakCode = () => {
        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const spoken = challenge.code.split('').join(' . ');
            const u = new SpeechSynthesisUtterance(spoken);
            u.lang = 'nl-NL';
            u.rate = 0.8;
            window.speechSynthesis.speak(u);
          } catch(e) {}
        }
      };
      if (playBtn) playBtn.addEventListener('click', speakCode);
      setTimeout(speakCode, 350);
      const audioInput = document.getElementById(\`\${prefix}-audio-input\`);
      if (audioInput) setTimeout(() => audioInput.focus(), 200);
    } else {
      // Distorted text
      const distInput = document.getElementById(\`\${prefix}-distorted-input\`);
      if (distInput) setTimeout(() => distInput.focus(), 150);
    }
  }

  function verifyActiveCaptchaChallenge(challenge, prefix) {
    if (challenge.uiType === 'robot_checkbox') {
      if (!challenge.isVerified) return 'select_none';
      return true;
    }
    if (challenge.uiType === 'grid_select') {
      const tiles = document.querySelectorAll(\`#\${prefix}-grid-container .captcha-grid-tile\`);
      let allMatch = true;
      let selectedCount = 0;
      tiles.forEach(tile => {
        const isTarget = tile.getAttribute('data-target') === 'true';
        const isSelected = tile.classList.contains('selected');
        if (isSelected) selectedCount++;
        if (isTarget !== isSelected) allMatch = false;
      });
      if (selectedCount === 0) return 'select_none';
      return allMatch;
    }
    if (challenge.uiType === 'direction_match') {
      const cur = (challenge.currentAngle % 360 + 360) % 360;
      const tgt = (challenge.targetAngle % 360 + 360) % 360;
      return cur === tgt;
    }
    if (challenge.uiType === 'slider_puzzle') {
      const cur = challenge.currentPercent !== undefined ? challenge.currentPercent : 0;
      return Math.abs(cur - challenge.targetPercent) <= 6;
    }
    if (challenge.uiType === 'dice_match') {
      return challenge.currentIndex === challenge.winningIndex;
    }
    if (challenge.uiType === 'odd_one_out') {
      if (!challenge.selectedOddId) return 'select_none';
      const winningItem = challenge.items.find(i => i.isOdd);
      return challenge.selectedOddId === winningItem?.id;
    }
    if (challenge.uiType === 'audio_captcha') {
      const input = document.getElementById(\`\${prefix}-audio-input\`);
      const val = (input?.value || '').trim();
      if (!val) return 'select_none';
      return val === challenge.code;
    }
    if (challenge.uiType === 'distorted_text') {
      const input = document.getElementById(\`\${prefix}-distorted-input\`);
      const val = (input?.value || '').trim().toUpperCase();
      if (!val) return 'select_none';
      return val === challenge.code.toUpperCase();
    }
    return true;
  }
`;

// Replace lines from generateRandomCaptchaChallenge to the end of renderCurrentLocationCaptchaStep
const markerStart = '  function generateRandomCaptchaChallenge() {';
const markerEnd = '  function renderQuestionModal(item) {';

const idxStart = code.indexOf(markerStart);
const idxEnd = code.indexOf(markerEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Markers not found! idxStart:', idxStart, 'idxEnd:', idxEnd);
  process.exit(1);
}

// Build renderCurrentLocationCaptchaStep
const newLocationCaptchaFunction = `  function renderCurrentLocationCaptchaStep(item) {
    if (!state.locationCaptchaSequence) {
      startLocationCaptchaSequence(item);
      return;
    }

    state.activeModal = 'CAPTCHA_LOCATION';
    const currentStep = state.locationCaptchaSequence.currentStep;
    const totalSteps = state.locationCaptchaSequence.totalSteps || 8;

    // Genereer elke stap een willekeurige, gevarieerde captcha uitdaging uit de 8 typen
    const challenge = generateRandomCaptchaChallenge();
    state.locationCaptchaSequence.currentChallenge = challenge;

    // 8 Voortgangsbolletjes om te zien hoe ver de speler is (zonder cijfertekst)
    const progressDotsHtml = [1, 2, 3, 4, 5, 6, 7, 8].map(s => \`
      <div class="w-2.5 h-2.5 rounded-full transition-all \${
        s < currentStep
          ? 'bg-emerald-600'
          : (s === currentStep ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-125' : 'bg-stone-300')
      }"></div>
    \`).join('');

    const widgetHtml = renderCaptchaWidgetHtml(challenge, 'loc');

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto" id="loc-captcha-container">
        
        <!-- Header met 8 voortgangsbollen (zonder cijfertekst) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-base">password</span>
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-800 uppercase tracking-wide block">Beveiligings-Captcha</span>
              <span class="text-[10px] font-bold text-emerald-700 block">\${item.name}</span>
            </div>
          </div>
          <!-- 8 Voortgangsbolletjes -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 border border-stone-200/80">
            \${progressDotsHtml}
          </div>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">\${challenge.title}</h3>
          <p class="text-xs text-stone-600 mt-0.5 leading-snug">
            \${challenge.subTitle}
          </p>
        </div>

        <!-- Dynamische Captcha Widget (1 van de 8 types) -->
        \${widgetHtml}

        <!-- Knoppen & Skip (ZONDER valstrik!) -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-verify-location-captcha" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">\${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>\${currentStep === totalSteps ? 'Verifieer & Onthul Geheime Locatie' : 'Volgende Captcha'}</span>
          </button>
          <button type="button" id="btn-location-step-skip-video" class="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
            <span class="material-symbols-outlined text-base text-amber-700">play_circle</span>
            <span>Te saai? Kijk video om te skippen</span>
          </button>
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <button type="button" id="btn-location-step-back" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Ga terug</span>
            </button>
            <button type="button" id="btn-location-step-cancel" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">close</span>
              <span>Terug naar campuskaart</span>
            </button>
          </div>
        </div>
      </div>
    \`;

    bindCaptchaWidgetEvents(challenge, 'loc');

    const verify = () => {
      const res = verifyActiveCaptchaChallenge(challenge, 'loc');
      if (res === true) {
        if (currentStep < totalSteps) {
          state.locationCaptchaSequence.currentStep++;
          if (window.sounds) window.sounds.playSuccess();
          showToast('Captcha goed opgelost! Ga door...', 'success');
          renderCurrentLocationCaptchaStep(item);
        } else {
          // Alle 8 opgelost!
          state.locationCaptchaSequence = null;
          onCaptchaSuccess(item);
        }
      } else if (res === 'select_none') {
        showToast('Kies of voltooi eerst de verificatie!');
      } else {
        if (window.sounds) window.sounds.playError();
        const container = document.getElementById('loc-captcha-container');
        if (container) {
          container.classList.add('shake');
          setTimeout(() => container.classList.remove('shake'), 400);
        }
        showToast('Onjuist! Probeer het nog eens.', 'error');
      }
    };

    document.getElementById('btn-verify-location-captcha').addEventListener('click', verify);

    const distInput = document.getElementById('loc-distorted-input');
    if (distInput) distInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
    const audioInput = document.getElementById('loc-audio-input');
    if (audioInput) audioInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });

    document.getElementById('btn-location-step-skip-video').addEventListener('click', () => {
      skipLocationCaptchaWithVideo(item);
    });

    document.getElementById('btn-location-step-back').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      state.locationCaptchaSequence = null;
      openCaptchaLocationModal(item);
    });

    document.getElementById('btn-location-step-cancel').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      state.locationCaptchaSequence = null;
      closeModal();
    });
  }
`;

// Also check and update renderCurrentHintCaptchaStep
const newHintCaptchaFunction = `  function renderCurrentHintCaptchaStep(item) {
    if (!state.hintCaptchaSequence) {
      startHintCaptchaSequence(item);
      return;
    }

    state.activeModal = 'HINT_CAPTCHA';
    const currentStep = state.hintCaptchaSequence.currentStep;
    const totalSteps = state.hintCaptchaSequence.totalSteps || 8;

    // Genereer elke stap een willekeurige, gevarieerde captcha uitdaging uit de 8 typen
    const challenge = generateRandomCaptchaChallenge();
    state.hintCaptchaSequence.currentChallenge = challenge;

    // 8 Voortgangsbolletjes om te zien hoe ver de speler is (zonder cijfertekst)
    const progressDotsHtml = [1, 2, 3, 4, 5, 6, 7, 8].map(s => \`
      <div class="w-2.5 h-2.5 rounded-full transition-all \${
        s < currentStep
          ? 'bg-amber-600'
          : (s === currentStep ? 'bg-amber-500 ring-2 ring-amber-300 scale-125' : 'bg-stone-300')
      }"></div>
    \`).join('');

    const widgetHtml = renderCaptchaWidgetHtml(challenge, 'hint');

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto" id="hint-captcha-container">
        
        <!-- Header met 8 voortgangsbollen (zonder cijfertekst) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-base">password</span>
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-800 uppercase tracking-wide block">Beveiligings-Captcha</span>
              <span class="text-[10px] font-bold text-amber-700 block">\${item.name} Hint</span>
            </div>
          </div>
          <!-- 8 Voortgangsbolletjes -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 border border-stone-200/80">
            \${progressDotsHtml}
          </div>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">\${challenge.title}</h3>
          <p class="text-xs text-stone-600 mt-0.5 leading-snug">
            \${challenge.subTitle}
          </p>
        </div>

        <!-- Dynamische Captcha Widget (1 van de 8 types) -->
        \${widgetHtml}

        <!-- Knoppen & Valstrik -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-verify-hint-captcha" class="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">\${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>\${currentStep === totalSteps ? 'Verifieer & Toon Hint' : 'Volgende Captcha'}</span>
          </button>
          <button type="button" id="btn-hint-step-skip-video" class="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
            <span class="material-symbols-outlined text-base text-amber-700">play_circle</span>
            <span>Te saai? Kijk video om te skippen</span>
          </button>
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <button type="button" id="btn-hint-step-back" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Ga terug</span>
            </button>
            <button type="button" id="btn-hint-step-cancel" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Terug naar item</span>
            </button>
          </div>
        </div>
      </div>
    \`;

    bindCaptchaWidgetEvents(challenge, 'hint');

    const verify = () => {
      const res = verifyActiveCaptchaChallenge(challenge, 'hint');
      if (res === true) {
        if (currentStep < totalSteps) {
          state.hintCaptchaSequence.currentStep++;
          if (window.sounds) window.sounds.playSuccess();
          showToast('Captcha goed opgelost! Ga door...', 'success');
          renderCurrentHintCaptchaStep(item);
        } else {
          // Alle 8 opgelost!
          state.hintCaptchaSequence = null;
          if (!state.revealedHints) state.revealedHints = {};
          state.revealedHints[item.id] = true;
          localStorage.setItem('doomscroll_revealed_hints', JSON.stringify(state.revealedHints));
          renderHintSuccessModal(item);
        }
      } else if (res === 'select_none') {
        showToast('Kies of voltooi eerst de verificatie!');
      } else {
        if (window.sounds) window.sounds.playError();
        const container = document.getElementById('hint-captcha-container');
        if (container) {
          container.classList.add('shake');
          setTimeout(() => container.classList.remove('shake'), 400);
        }
        showToast('Onjuist! Probeer het nog eens.', 'error');
      }
    };

    document.getElementById('btn-verify-hint-captcha').addEventListener('click', verify);

    const distInput = document.getElementById('hint-distorted-input');
    if (distInput) distInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
    const audioInput = document.getElementById('hint-audio-input');
    if (audioInput) audioInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });

    document.getElementById('btn-hint-step-skip-video').addEventListener('click', () => {
      skipHintWithVideo(item);
    });

    document.getElementById('btn-hint-step-back').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      state.hintCaptchaSequence = null;
      openHintChoiceModal(item);
    });

    document.getElementById('btn-hint-step-cancel').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      state.hintCaptchaSequence = null;
      openItemDetailModal(item);
    });
  }
`;

// Replace location captcha block
const finalCodeSection = newCaptchaCode + '\n' + newLocationCaptchaFunction + '\n';
code = code.slice(0, idxStart) + finalCodeSection + code.slice(idxEnd);

// Now replace renderCurrentHintCaptchaStep
const hintMarkerStart = '  function renderCurrentHintCaptchaStep(item) {';
const hintMarkerEnd = '  function renderHintSuccessModal(item) {';
const hIdxStart = code.indexOf(hintMarkerStart);
const hIdxEnd = code.indexOf(hintMarkerEnd);

if (hIdxStart === -1 || hIdxEnd === -1) {
  console.error('Hint markers not found! hIdxStart:', hIdxStart, 'hIdxEnd:', hIdxEnd);
  process.exit(1);
}

code = code.slice(0, hIdxStart) + newHintCaptchaFunction + '\n' + code.slice(hIdxEnd);

fs.writeFileSync(playerAppPath, code, 'utf8');
console.log('Successfully updated playerApp.js with all 8 new visual captcha systems!');

