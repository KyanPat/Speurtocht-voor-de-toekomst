const fs = require('fs');
const path = require('path');

const playerAppPath = path.join(__dirname, '..', 'public', 'js', 'playerApp.js');
let code = fs.readFileSync(playerAppPath, 'utf8');

// 1. Build the new Captcha Engine code
const newCaptchaEngine = `  // ==========================================
  // GEAVANCEERDE VISUELE CAPTCHA ENGINE (8 UNIEKE TYPES - 100% SVG/CSS/AUDIO)
  // Geen externe Unsplash foto's (altijd 100% werkend)
  // Geen 'ik ben geen robot' checkbox
  // In een reeks van 8 altijd 8 verschillende types (0 duplicaten!)
  // 1. direction_match: Oriëntatie puzzel (Draai dier tot deze oriëntatie)
  // 2. slider_puzzle: Horizontale slider naar uitsparing
  // 3. dice_match: Dobbelstenen optellen tot doelgetal
  // 4. maze_cheese: Doolhof muis bereikt exact aantal kaasjes
  // 5. odd_one_out: Vind wat er niet bij hoort (bijv. plant tussen dieren)
  // 6. audio_captcha: Gesproken code via SpeechSynthesis
  // 7. distorted_word: Klassiek vervormd woord met golflijnen
  // 8. distorted_code: 4-karakter alfanumerieke code met ruis
  // ==========================================

  const CAPTCHA_WORDS = ['SPADE', 'ESCAPE', 'DROOM', 'PAARD', 'ROBOT', 'CAMPUS', 'FOCUS', 'BEWUST', 'TAART', 'STUUR'];
  const CAPTCHA_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  function getRandomCaptchaCode(len = 4) {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }
    return res;
  }

  function generateCaptchaChallengeByType(type) {
    if (type === 'direction_match') {
      const angles = [0, 90, 180, 270];
      const targetAngle = angles[Math.floor(Math.random() * angles.length)];
      const animals = [
        { icon: '🐕', name: 'de hond' },
        { icon: '🚗', name: 'de auto' },
        { icon: '🐴', name: 'het paard' },
        { icon: '✈️', name: 'het vliegtuig' }
      ];
      const animal = animals[Math.floor(Math.random() * animals.length)];
      let startAngle = angles[Math.floor(Math.random() * angles.length)];
      while (startAngle === targetAngle) {
        startAngle = angles[Math.floor(Math.random() * angles.length)];
      }

      return {
        uiType: 'direction_match',
        title: 'Oriëntatie Puzzel',
        subTitle: \`Draai \${animal.name} tot deze oriëntatie:\`,
        animal: animal,
        targetAngle: targetAngle,
        currentAngle: startAngle
      };
    }

    if (type === 'slider_puzzle') {
      const target = Math.floor(Math.random() * 45) + 35; // 35% tot 80%
      return {
        uiType: 'slider_puzzle',
        title: 'Puzzel Slider',
        subTitle: 'Sleep het puzzelstukje naar de juiste plek in de uitsparing:',
        targetPercent: target,
        currentPercent: 0
      };
    }

    if (type === 'dice_match') {
      const targetSums = [14, 16, 18, 20];
      const targetSum = targetSums[Math.floor(Math.random() * targetSums.length)];
      const configs = [
        { dice: [2, 3, 4, 2], sum: 11 },
        { dice: [5, 4, 3, 2], sum: 14 },
        { dice: [6, 4, 4, 2], sum: 16 },
        { dice: [6, 5, 4, 3], sum: 18 },
        { dice: [6, 6, 5, 3], sum: 20 }
      ].sort(() => Math.random() - 0.5);

      const winIdx = configs.findIndex(c => c.sum === targetSum);
      return {
        uiType: 'dice_match',
        title: 'Dobbelstenen Match',
        subTitle: \`Gebruik de pijltjes om de dobbelstenen op te tellen tot \${targetSum}:\`,
        targetSum: targetSum,
        configs: configs,
        currentIndex: (winIdx + 2) % configs.length,
        winningIndex: winIdx
      };
    }

    if (type === 'maze_cheese') {
      const targetCheese = Math.random() > 0.5 ? 2 : 3;
      const mazes = [
        { id: 'm1', reachable: 1, cheeses: [{ x: 50, y: 70, ok: true }, { x: 80, y: 30, ok: false }] },
        { id: 'm2', reachable: 2, cheeses: [{ x: 40, y: 60, ok: true }, { x: 75, y: 65, ok: true }, { x: 80, y: 25, ok: false }] },
        { id: 'm3', reachable: 3, cheeses: [{ x: 35, y: 55, ok: true }, { x: 65, y: 50, ok: true }, { x: 75, y: 80, ok: true }] }
      ].sort(() => Math.random() - 0.5);

      const winIdx = mazes.findIndex(m => m.reachable === targetCheese);
      return {
        uiType: 'maze_cheese',
        title: 'Doolhof Puzzel',
        subTitle: \`Kies het doolhof waarin de muis exact \${targetCheese} \${targetCheese === 1 ? 'kaasje' : 'kaasjes'} kan bereiken:\`,
        targetCheese: targetCheese,
        mazes: mazes,
        currentIndex: (winIdx + 1) % mazes.length,
        winningIndex: winIdx
      };
    }

    if (type === 'odd_one_out') {
      const themes = [
        {
          items: [
            { id: 'o1', icon: '🐶', name: 'Hond' },
            { id: 'o2', icon: '🐱', name: 'Kat' },
            { id: 'o3', icon: '🐰', name: 'Konijn' },
            { id: 'o4', icon: '🪴', name: 'Kamerplant', isOdd: true },
            { id: 'o5', icon: '🦊', name: 'Vos' },
            { id: 'o6', icon: '🐼', name: 'Panda' }
          ]
        },
        {
          items: [
            { id: 'v1', icon: '🚗', name: 'Auto' },
            { id: 'v2', icon: '🚕', name: 'Taxi' },
            { id: 'v3', icon: '🍕', name: 'Pizza', isOdd: true },
            { id: 'v4', icon: '🚙', name: 'Jeep' },
            { id: 'v5', icon: '🚌', name: 'Bus' },
            { id: 'v6', icon: '🏎️', name: 'Raceauto' }
          ]
        },
        {
          items: [
            { id: 't1', icon: '🎂', name: 'Taart' },
            { id: 't2', icon: '🧁', name: 'Cupcake' },
            { id: 't3', icon: '🍦', name: 'IJsje' },
            { id: 't4', icon: '🍩', name: 'Donut' },
            { id: 't5', icon: '🔧', name: 'Moersleutel', isOdd: true },
            { id: 't6', icon: '🍪', name: 'Koekje' }
          ]
        }
      ];
      const selTheme = themes[Math.floor(Math.random() * themes.length)];
      const shuffledItems = [...selTheme.items].sort(() => Math.random() - 0.5);
      return {
        uiType: 'odd_one_out',
        title: 'Vind wat er niet bij hoort',
        subTitle: 'Klik op het voorwerp dat er NIET bij hoort:',
        items: shuffledItems,
        selectedOddId: null
      };
    }

    if (type === 'audio_captcha') {
      const words = ['FOCUS', 'ESCAPE', 'DROOM', 'PAARD', 'ROBOT', 'CAMPUS'];
      const isDigits = Math.random() > 0.5;
      const code = isDigits
        ? \`\${Math.floor(Math.random() * 9) + 1}\${Math.floor(Math.random() * 9) + 1}\${Math.floor(Math.random() * 9) + 1}\${Math.floor(Math.random() * 9) + 1}\`
        : words[Math.floor(Math.random() * words.length)];

      return {
        uiType: 'audio_captcha',
        title: 'Audio Verificatie',
        subTitle: 'Klik op afspelen, luister goed en typ de code over:',
        code: code,
        isDigits: isDigits
      };
    }

    if (type === 'distorted_word') {
      const word = CAPTCHA_WORDS[Math.floor(Math.random() * CAPTCHA_WORDS.length)];
      return {
        uiType: 'distorted_word',
        title: 'Tekstverificatie',
        subTitle: 'Typ het vervormde woord exact over:',
        code: word
      };
    }

    // distorted_code
    return {
      uiType: 'distorted_code',
      title: 'Beveiligingscode',
      subTitle: 'Typ de 4 tekens exact over:',
      code: getRandomCaptchaCode(4)
    };
  }

  // Genereert een gegarandeerd unieke reeks van 8 captchas (geen duplicaten!)
  function generateUniqueCaptchaSequence(totalSteps = 8) {
    const allTypes = [
      'direction_match',
      'slider_puzzle',
      'dice_match',
      'maze_cheese',
      'odd_one_out',
      'audio_captcha',
      'distorted_word',
      'distorted_code'
    ];
    // Shuffle de types zodat de volgorde per item anders is
    const shuffled = [...allTypes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalSteps).map(t => generateCaptchaChallengeByType(t));
  }

  function renderCaptchaWidgetHtml(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const targetDeg = challenge.targetAngle;
      const curDeg = challenge.currentAngle;
      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-2 gap-3 items-center">
            <!-- Doel Oriëntatie -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Doel Oriëntatie</span>
              <div class="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center border border-stone-700 shadow-inner">
                <div style="transform: rotate(\${targetDeg}deg); transition: transform 0.3s ease;">
                  <span class="material-symbols-outlined text-4xl text-amber-400">arrow_forward</span>
                </div>
              </div>
            </div>

            <!-- Draaibaar Object -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">\${challenge.animal.name}</span>
              <div class="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                <div id="\${prefix}-dir-target-icon" class="text-4xl transition-transform duration-300" style="transform: rotate(\${curDeg}deg);">
                  \${challenge.animal.icon}
                </div>
              </div>
            </div>
          </div>

          <!-- Draaiknoppen -->
          <div class="flex justify-center gap-2.5 mt-3">
            <button type="button" id="\${prefix}-btn-rot-left" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span class="material-symbols-outlined text-sm">rotate_left</span>
              <span>Draai links</span>
            </button>
            <button type="button" id="\${prefix}-btn-rot-right" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span>Draai rechts</span>
              <span class="material-symbols-outlined text-sm">rotate_right</span>
            </button>
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'slider_puzzle') {
      const tgt = challenge.targetPercent;
      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="relative w-full h-24 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 border border-emerald-800/50 overflow-hidden shadow-inner flex items-center mb-3">
            <!-- Doel Uitsparing -->
            <div class="absolute top-2.5 bottom-2.5 w-12 rounded-lg border-2 border-dashed border-amber-400/90 bg-amber-400/10 flex items-center justify-center pointer-events-none" style="left: calc(\${tgt}% - 24px);">
              <span class="text-xs font-bold text-amber-300/80">Hier</span>
            </div>
            <!-- Verschuifbaar Puzzelstukje -->
            <div id="\${prefix}-puzzle-piece" class="absolute top-2.5 bottom-2.5 w-12 rounded-lg bg-emerald-500 border-2 border-emerald-300 shadow-lg flex items-center justify-center text-xl transition-all duration-75 pointer-events-none" style="left: 0%;">
              🧩
            </div>
          </div>
          <div class="px-2">
            <input type="range" id="\${prefix}-slider-input" min="0" max="100" value="0" class="w-full accent-emerald-500 cursor-pointer h-2 bg-stone-700 rounded-lg">
            <div class="flex justify-between text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-wider">
              <span>Start</span>
              <span class="text-amber-400 flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">arrow_forward</span> Sleep naar uitsparing</span>
              <span>Eind</span>
            </div>
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'dice_match') {
      const curConfig = challenge.configs[challenge.currentIndex];
      const pipMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };
      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-5 gap-2 items-center">
            <!-- Doel Som -->
            <div class="col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Match dit getal:</span>
              <span class="text-4xl font-black font-mono text-amber-400">\${challenge.targetSum}</span>
            </div>

            <!-- Dobbelstenen Groep -->
            <div class="col-span-3 flex flex-col items-center justify-center p-2 rounded-xl bg-stone-950/80 border border-stone-800">
              <div id="\${prefix}-dice-display" class="grid grid-cols-2 gap-1.5 p-1">
                \${curConfig.dice.map(v => \`
                  <div class="w-10 h-10 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center text-3xl font-bold text-stone-900 shadow-sm leading-none">
                    \${pipMap[v] || v}
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>

          <!-- Wissel Pijlen -->
          <div class="flex items-center justify-between mt-3 px-2">
            <button type="button" id="\${prefix}-btn-dice-prev" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div class="flex items-center gap-1.5" id="\${prefix}-dice-dots">
              \${challenge.configs.map((_, i) => \`
                <div class="w-2 h-2 rounded-full transition-all \${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
              \`).join('')}
            </div>
            <button type="button" id="\${prefix}-btn-dice-next" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'maze_cheese') {
      const curMaze = challenge.mazes[challenge.currentIndex];
      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-5 gap-2 items-center">
            <!-- Doel Kaas Aantal -->
            <div class="col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Doel Kaas:</span>
              <span class="text-4xl font-black font-mono text-amber-400">\${challenge.targetCheese}</span>
              <span class="text-[10px] text-stone-400 mt-0.5">🧀 kaasjes</span>
            </div>

            <!-- SVG Doolhof Visual -->
            <div class="col-span-3 flex flex-col items-center justify-center p-2 rounded-xl bg-stone-950/80 border border-stone-800">
              <div id="\${prefix}-maze-display" class="w-28 h-24 relative bg-stone-900 rounded-lg border border-stone-700 p-1 overflow-hidden flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 100 80" class="w-full h-full">
                  <!-- Doolhof Muren -->
                  <path d="M 5 5 L 95 5 L 95 75 L 5 75 Z" fill="none" stroke="#64748b" stroke-width="3"/>
                  <path d="M 30 5 L 30 50 M 60 75 L 60 30 M 5 40 L 45 40 M 55 55 L 85 55" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
                  <!-- Muis bij start -->
                  <text x="12" y="25" font-size="14" text-anchor="middle">🐭</text>
                  <!-- Kaasjes in dit doolhof -->
                  \${curMaze.cheeses.map(c => \`<text x="\${c.x}" y="\${c.y}" font-size="12" text-anchor="middle">🧀</text>\`).join('')}
                </svg>
              </div>
            </div>
          </div>

          <!-- Wissel Pijlen -->
          <div class="flex items-center justify-between mt-3 px-2">
            <button type="button" id="\${prefix}-btn-maze-prev" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div class="flex items-center gap-1.5" id="\${prefix}-maze-dots">
              \${challenge.mazes.map((_, i) => \`
                <div class="w-2 h-2 rounded-full transition-all \${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
              \`).join('')}
            </div>
            <button type="button" id="\${prefix}-btn-maze-next" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'odd_one_out') {
      return \`
        <div class="p-3 bg-stone-50 rounded-2xl border-2 border-stone-200 my-2 select-none text-center">
          <div class="grid grid-cols-3 gap-2" id="\${prefix}-odd-grid">
            \${challenge.items.map(item => \`
              <button type="button" class="odd-item-btn p-3 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-100 active:scale-95 transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs" data-id="\${item.id}">
                <span class="text-3xl">\${item.icon}</span>
                <span class="text-[10px] font-bold text-stone-700">\${item.name}</span>
              </button>
            \`).join('')}
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'audio_captcha') {
      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center space-y-3">
          <div class="flex items-center justify-center gap-3">
            <button type="button" id="\${prefix}-btn-play-audio" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md">
              <span class="material-symbols-outlined text-xl">volume_up</span>
              <span>Speel audio af</span>
            </button>
            <div class="flex items-center gap-1 text-emerald-400 text-xs font-mono animate-pulse">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>

          <div class="pt-1">
            <input type="text" id="\${prefix}-audio-input" maxlength="8" placeholder="TYP CODE..." class="w-full bg-stone-950 border-2 border-stone-700 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 uppercase placeholder:text-stone-600">
          </div>
        </div>
      \`;
    }

    if (challenge.uiType === 'distorted_word') {
      const letters = challenge.code.split('');
      const charOffsets = letters.map((ch, idx) => {
        const y = 38 + Math.sin(idx * 1.3) * 8;
        const rot = (idx % 2 === 0 ? 1 : -1) * (8 + (idx * 3) % 12);
        return { ch, x: 25 + idx * 30, y, rot };
      });

      return \`
        <div class="space-y-3 my-2 select-none">
          <div class="relative w-full h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 overflow-hidden flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 240 70" class="w-full h-full">
              <!-- Ruis lijnen -->
              <path d="M 10 35 Q 60 10 120 40 T 230 35" fill="none" stroke="#059669" stroke-width="2.5" opacity="0.6"/>
              <path d="M 10 50 Q 80 65 150 20 T 230 45" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.5"/>
              <path d="M 20 20 Q 110 5 180 55 T 235 25" fill="none" stroke="#d97706" stroke-width="1.5" opacity="0.4"/>
              <!-- Vervormde Letters -->
              \${charOffsets.map(o => \`
                <text x="\${o.x}" y="\${o.y}" transform="rotate(\${o.rot}, \${o.x}, \${o.y})" font-family="serif" font-weight="900" font-size="28" fill="#34d399" text-anchor="middle" letter-spacing="4">
                  \${o.ch}
                </text>
              \`).join('')}
            </svg>
            <button type="button" id="\${prefix}-btn-reload-word" class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center hover:bg-stone-700 transition cursor-pointer" title="Nieuw woord">
              <span class="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          <div>
            <input type="text" id="\${prefix}-distorted-input" maxlength="12" placeholder="TYP WOORD..." class="w-full bg-stone-50 border-2 border-stone-300 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-stone-900 focus:outline-none focus:border-emerald-600 uppercase placeholder:text-stone-400">
          </div>
        </div>
      \`;
    }

    // distorted_code
    const chars = challenge.code.split('');
    const charOffsets = chars.map((ch, idx) => {
      const y = 38 + Math.sin(idx * 1.5) * 8;
      const rot = (idx % 2 === 0 ? 1 : -1) * (10 + (idx * 4) % 15);
      return { ch, x: 35 + idx * 45, y, rot };
    });

    return \`
      <div class="space-y-3 my-2 select-none">
        <div class="relative w-full h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 overflow-hidden flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 240 70" class="w-full h-full">
            <!-- Ruis lijnen en raster -->
            <path d="M 10 35 Q 70 15 130 45 T 230 35" fill="none" stroke="#10b981" stroke-width="2.5" opacity="0.6"/>
            <path d="M 10 55 Q 90 65 160 25 T 230 45" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.5"/>
            <!-- 4 Alfanumerieke tekens -->
            \${charOffsets.map(o => \`
              <text x="\${o.x}" y="\${o.y}" transform="rotate(\${o.rot}, \${o.x}, \${o.y})" font-family="monospace" font-weight="900" font-size="32" fill="#6ee7b7" text-anchor="middle">
                \${o.ch}
              </text>
            \`).join('')}
          </svg>
          <button type="button" id="\${prefix}-btn-reload-code" class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center hover:bg-stone-700 transition cursor-pointer" title="Nieuwe code">
            <span class="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        <div>
          <input type="text" id="\${prefix}-distorted-input" maxlength="6" placeholder="CODE . . ." class="w-full bg-stone-50 border-2 border-stone-300 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-stone-900 focus:outline-none focus:border-emerald-600 uppercase placeholder:text-stone-400">
        </div>
      </div>
    \`;
  }

  function bindCaptchaWidgetEvents(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const icon = document.getElementById(\`\${prefix}-dir-target-icon\`);
      const btnLeft = document.getElementById(\`\${prefix}-btn-rot-left\`);
      const btnRight = document.getElementById(\`\${prefix}-btn-rot-right\`);

      if (btnLeft) {
        btnLeft.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle - 90 + 360) % 360;
          if (icon) icon.style.transform = \`rotate(\${challenge.currentAngle}deg)\`;
        };
      }
      if (btnRight) {
        btnRight.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle + 90) % 360;
          if (icon) icon.style.transform = \`rotate(\${challenge.currentAngle}deg)\`;
        };
      }
    } else if (challenge.uiType === 'slider_puzzle') {
      const piece = document.getElementById(\`\${prefix}-puzzle-piece\`);
      const slider = document.getElementById(\`\${prefix}-slider-input\`);
      if (slider) {
        slider.oninput = () => {
          const val = parseInt(slider.value, 10);
          challenge.currentPercent = val;
          if (piece) piece.style.left = \`calc(\${val}% - \${val * 0.48}px)\`;
        };
      }
    } else if (challenge.uiType === 'dice_match') {
      const btnPrev = document.getElementById(\`\${prefix}-btn-dice-prev\`);
      const btnNext = document.getElementById(\`\${prefix}-btn-dice-next\`);
      const display = document.getElementById(\`\${prefix}-dice-display\`);
      const dots = document.getElementById(\`\${prefix}-dice-dots\`);
      const pipMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

      const updateDiceView = () => {
        const cur = challenge.configs[challenge.currentIndex];
        if (display) {
          display.innerHTML = cur.dice.map(v => \`
            <div class="w-10 h-10 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center text-3xl font-bold text-stone-900 shadow-sm leading-none">
              \${pipMap[v] || v}
            </div>
          \`).join('');
        }
        if (dots) {
          dots.innerHTML = challenge.configs.map((_, i) => \`
            <div class="w-2 h-2 rounded-full transition-all \${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
          \`).join('');
        }
      };

      if (btnPrev) {
        btnPrev.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentIndex = (challenge.currentIndex - 1 + challenge.configs.length) % challenge.configs.length;
          updateDiceView();
        };
      }
      if (btnNext) {
        btnNext.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentIndex = (challenge.currentIndex + 1) % challenge.configs.length;
          updateDiceView();
        };
      }
    } else if (challenge.uiType === 'maze_cheese') {
      const btnPrev = document.getElementById(\`\${prefix}-btn-maze-prev\`);
      const btnNext = document.getElementById(\`\${prefix}-btn-maze-next\`);
      const display = document.getElementById(\`\${prefix}-maze-display\`);
      const dots = document.getElementById(\`\${prefix}-maze-dots\`);

      const updateMazeView = () => {
        const curMaze = challenge.mazes[challenge.currentIndex];
        if (display) {
          display.innerHTML = \`
            <svg viewBox="0 0 100 80" class="w-full h-full">
              <path d="M 5 5 L 95 5 L 95 75 L 5 75 Z" fill="none" stroke="#64748b" stroke-width="3"/>
              <path d="M 30 5 L 30 50 M 60 75 L 60 30 M 5 40 L 45 40 M 55 55 L 85 55" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
              <text x="12" y="25" font-size="14" text-anchor="middle">🐭</text>
              \${curMaze.cheeses.map(c => \`<text x="\${c.x}" y="\${c.y}" font-size="12" text-anchor="middle">🧀</text>\`).join('')}
            </svg>
          \`;
        }
        if (dots) {
          dots.innerHTML = challenge.mazes.map((_, i) => \`
            <div class="w-2 h-2 rounded-full transition-all \${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
          \`).join('');
        }
      };

      if (btnPrev) {
        btnPrev.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentIndex = (challenge.currentIndex - 1 + challenge.mazes.length) % challenge.mazes.length;
          updateMazeView();
        };
      }
      if (btnNext) {
        btnNext.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentIndex = (challenge.currentIndex + 1) % challenge.mazes.length;
          updateMazeView();
        };
      }
    } else if (challenge.uiType === 'odd_one_out') {
      const oddBtns = document.querySelectorAll(\`#\${prefix}-odd-grid .odd-item-btn\`);
      oddBtns.forEach(btn => {
        btn.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          oddBtns.forEach(b => {
            b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
            b.classList.add('border-stone-200', 'bg-white');
          });
          btn.classList.remove('border-stone-200', 'bg-white');
          btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
          challenge.selectedOddId = btn.getAttribute('data-id');
        };
      });
    } else if (challenge.uiType === 'audio_captcha') {
      const btnPlay = document.getElementById(\`\${prefix}-btn-play-audio\`);
      if (btnPlay) {
        btnPlay.onclick = () => {
          if ('speechSynthesis' in window) {
            const speechText = challenge.isDigits
              ? challenge.code.split('').join(' . ')
              : challenge.code.split('').join(' - ');
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = 'nl-NL';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
          } else {
            showToast(\`Audio niet ondersteund. Code is: \${challenge.code}\`);
          }
        };
      }
    } else if (challenge.uiType === 'distorted_word') {
      const btnReload = document.getElementById(\`\${prefix}-btn-reload-word\`);
      if (btnReload) {
        btnReload.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          const newWord = CAPTCHA_WORDS[Math.floor(Math.random() * CAPTCHA_WORDS.length)];
          challenge.code = newWord;
          if (prefix === 'loc' && state.locationCaptchaSequence) {
            renderCurrentLocationCaptchaStep(ITEMS_DATA[state.locationCaptchaSequence.itemId]);
          } else if (prefix === 'hint' && state.hintCaptchaSequence) {
            renderCurrentHintCaptchaStep(ITEMS_DATA[state.hintCaptchaSequence.itemId]);
          }
        };
      }
    } else if (challenge.uiType === 'distorted_code') {
      const btnReload = document.getElementById(\`\${prefix}-btn-reload-code\`);
      if (btnReload) {
        btnReload.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.code = getRandomCaptchaCode(4);
          if (prefix === 'loc' && state.locationCaptchaSequence) {
            renderCurrentLocationCaptchaStep(ITEMS_DATA[state.locationCaptchaSequence.itemId]);
          } else if (prefix === 'hint' && state.hintCaptchaSequence) {
            renderCurrentHintCaptchaStep(ITEMS_DATA[state.hintCaptchaSequence.itemId]);
          }
        };
      }
    }
  }

  function verifyActiveCaptchaChallenge(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const cur = (challenge.currentAngle % 360 + 360) % 360;
      const tgt = (challenge.targetAngle % 360 + 360) % 360;
      return cur === tgt;
    }
    if (challenge.uiType === 'slider_puzzle') {
      const cur = challenge.currentPercent !== undefined ? challenge.currentPercent : 0;
      return Math.abs(cur - challenge.targetPercent) <= 7;
    }
    if (challenge.uiType === 'dice_match') {
      return challenge.currentIndex === challenge.winningIndex;
    }
    if (challenge.uiType === 'maze_cheese') {
      return challenge.currentIndex === challenge.winningIndex;
    }
    if (challenge.uiType === 'odd_one_out') {
      if (!challenge.selectedOddId) return 'select_none';
      const winningItem = challenge.items.find(i => i.isOdd);
      return challenge.selectedOddId === winningItem?.id;
    }
    if (challenge.uiType === 'audio_captcha') {
      const input = document.getElementById(\`\${prefix}-audio-input\`);
      const val = (input?.value || '').trim().toUpperCase();
      if (!val) return 'select_none';
      return val === challenge.code.toUpperCase();
    }
    if (challenge.uiType === 'distorted_word' || challenge.uiType === 'distorted_code') {
      const input = document.getElementById(\`\${prefix}-distorted-input\`);
      const val = (input?.value || '').trim().toUpperCase();
      if (!val) return 'select_none';
      return val === challenge.code.toUpperCase();
    }
    return true;
  }`;

// Find starting point: const CAPTCHA_PHOTO_SETS
const startIndex = code.indexOf('const CAPTCHA_PHOTO_SETS');
const endIndex = code.indexOf('function renderCurrentLocationCaptchaStep');

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find captcha engine bounds!', { startIndex, endIndex });
  process.exit(1);
}

code = code.substring(0, startIndex) + newCaptchaEngine + '\n\n  ' + code.substring(endIndex);

console.log('Replaced captcha engine successfully!');

// Now let's update startLocationCaptchaSequence and renderCurrentLocationCaptchaStep
// to use generateUniqueCaptchaSequence(8)
code = code.replace(
  `function startLocationCaptchaSequence(item) {
    state.locationCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8
    };
    renderCurrentLocationCaptchaStep(item);
  }`,
  `function startLocationCaptchaSequence(item) {
    state.locationCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8,
      challenges: generateUniqueCaptchaSequence(8)
    };
    renderCurrentLocationCaptchaStep(item);
  }`
);

// In renderCurrentLocationCaptchaStep:
code = code.replace(
  `    const challenge = generateRandomCaptchaChallenge();
    state.locationCaptchaSequence.currentChallenge = challenge;`,
  `    if (!state.locationCaptchaSequence.challenges || !state.locationCaptchaSequence.challenges.length) {
      state.locationCaptchaSequence.challenges = generateUniqueCaptchaSequence(totalSteps);
    }
    const challenge = state.locationCaptchaSequence.challenges[currentStep - 1];
    state.locationCaptchaSequence.currentChallenge = challenge;`
);

// In startHintCaptchaSequence:
code = code.replace(
  `function startHintCaptchaSequence(item) {
    state.hintCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8
    };
    renderCurrentHintCaptchaStep(item);
  }`,
  `function startHintCaptchaSequence(item) {
    state.hintCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8,
      challenges: generateUniqueCaptchaSequence(8)
    };
    renderCurrentHintCaptchaStep(item);
  }`
);

// In renderCurrentHintCaptchaStep:
code = code.replace(
  `    const challenge = generateRandomCaptchaChallenge();
    state.hintCaptchaSequence.currentChallenge = challenge;`,
  `    if (!state.hintCaptchaSequence.challenges || !state.hintCaptchaSequence.challenges.length) {
      state.hintCaptchaSequence.challenges = generateUniqueCaptchaSequence(totalSteps);
    }
    const challenge = state.hintCaptchaSequence.challenges[currentStep - 1];
    state.hintCaptchaSequence.currentChallenge = challenge;`
);

// Now let's implement createPlayer2DModelSvg and renderMobilePodium in playerApp.js
const mobilePodiumCode = `
  // ==========================================
  // 2D MODEL CHARACTER GENERATOR & MOBIEL WINNAARS PODIUM
  // 3e Plaats: Speler helemaal ingedoken in telefoon door doomscrollen
  // 2e Plaats: Speler minder in telefoon, meer overeind
  // 1e Plaats: Speler zonder telefoon, geslaagd met diploma kleding & baret
  // ==========================================
  function createPlayer2DModelSvg(place, avatar) {
    const av = avatar || '🎒';

    if (place === 3) {
      return \`
      <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mScreenBeam3" cx="50%" cy="80%" r="65%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95"/>
            <stop offset="45%" stop-color="#0284c7" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#0369a1" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="mHoodieGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>

        <circle cx="80" cy="80" r="76" fill="#090d16" stroke="#b45309" stroke-width="2.5"/>

        <!-- Zwevende notificaties -->
        <g opacity="0.9">
          <circle cx="28" cy="38" r="8" fill="#ef4444"/>
          <text x="28" y="42" font-size="9" text-anchor="middle" fill="#fff" font-weight="900" font-family="sans-serif">!</text>
          <circle cx="132" cy="44" r="9" fill="#ec4899"/>
          <text x="132" y="48" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif">❤</text>
        </g>

        <!-- Kromme ingedoken rug -->
        <path d="M 32 158 Q 40 96 74 94 Q 112 92 128 158 Z" fill="url(#mHoodieGrad3)"/>

        <!-- Ingedoken speler avatar hoofd -->
        <g transform="translate(80, 88) rotate(24)">
          <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#0ea5e9" stroke-width="2"/>
          <text x="0" y="9" font-size="28" text-anchor="middle">\${av}</text>
        </g>

        <!-- Lichtgloed uit het telefoonscherm op gezicht -->
        <polygon points="56,150 104,150 88,88 72,88" fill="url(#mScreenBeam3)"/>

        <!-- Smartphone vastgeklampt in 2 handen -->
        <g transform="translate(64, 116) rotate(-8)">
          <rect x="0" y="0" width="32" height="42" rx="6" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
          <rect x="3" y="4" width="26" height="34" rx="3" fill="#bae6fd"/>
          <circle cx="16" cy="35" r="2" fill="#0369a1"/>
        </g>
      </svg>
      \`;
    }

    if (place === 2) {
      return \`
      <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mHoodieGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
        </defs>

        <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#cbd5e1" stroke-width="2.5"/>

        <!-- Lichaam: meer overeind -->
        <path d="M 36 158 Q 48 98 80 96 Q 112 98 124 158 Z" fill="url(#mHoodieGrad2)"/>

        <!-- Speler hoofd recht naar voren kijkend -->
        <g transform="translate(80, 68)">
          <circle cx="0" cy="0" r="27" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
          <text x="0" y="10" font-size="30" text-anchor="middle">\${av}</text>
        </g>

        <!-- Smartphone laag gehouden -->
        <g transform="translate(68, 126)">
          <rect x="0" y="0" width="24" height="32" rx="4" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
          <rect x="2" y="3" width="20" height="26" rx="2" fill="#0f172a"/>
        </g>
      </svg>
      \`;
    }

    // 1e Plaats: Geslaagd, Baret, Diploma, geen telefoon!
    return \`
    <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mGoldAura" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
        <linearGradient id="mGownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>

      <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="url(#mGoldAura)" stroke-width="3"/>

      <!-- Glorieuze stralenbundels -->
      <g stroke="#eab308" stroke-width="1" opacity="0.4">
        <line x1="80" y1="10" x2="80" y2="24"/>
        <line x1="30" y1="30" x2="40" y2="40"/>
        <line x1="130" y1="30" x2="120" y2="40"/>
        <line x1="15" y1="80" x2="28" y2="80"/>
        <line x1="145" y1="80" x2="132" y2="80"/>
      </g>

      <!-- Afstudeertoga / Gala kleding -->
      <path d="M 34 158 Q 44 94 80 92 Q 116 94 126 158 Z" fill="url(#mGownGrad)"/>
      <path d="M 80 92 L 72 158 L 88 158 Z" fill="#eab308" opacity="0.9"/>

      <!-- Trotse Speler Avatar Kop -->
      <g transform="translate(80, 68)">
        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#eab308" stroke-width="2.5"/>
        <text x="0" y="10" font-size="30" text-anchor="middle">\${av}</text>
      </g>

      <!-- Geslaagd Academische Baret -->
      <g transform="translate(80, 42)">
        <polygon points="0,-12 36,0 0,12 -36,0" fill="#0f172a" stroke="#eab308" stroke-width="2"/>
        <rect x="-14" y="0" width="28" height="9" fill="#1e1b4b"/>
        <path d="M 0,0 Q 22,6 26,18" fill="none" stroke="#eab308" stroke-width="2.5"/>
        <circle cx="26" cy="18" r="3.5" fill="#ca8a04"/>
      </g>

      <!-- Oprolbaar Diploma met rood lint in hand -->
      <g transform="translate(108, 108) rotate(-22)">
        <rect x="0" y="0" width="16" height="38" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/>
        <rect x="0" y="15" width="16" height="8" fill="#dc2626"/>
      </g>
    </svg>
    \`;
  }

  let mobilePodiumTimeouts = [];
  function clearMobilePodiumTimeouts() {
    mobilePodiumTimeouts.forEach(t => clearTimeout(t));
    mobilePodiumTimeouts = [];
  }

  function renderMobilePodium(leaderboard) {
    const grid = document.getElementById('mobile-podium-grid');
    if (!grid) return;

    clearMobilePodiumTimeouts();
    grid.innerHTML = '';

    const list = Array.isArray(leaderboard) ? leaderboard : [];
    const top1 = list[0] || null;
    const top2 = list[1] || null;
    const top3 = list[2] || null;

    const buildSlotHtml = (cfg) => {
      const p = cfg.player;
      const modelSvg = createPlayer2DModelSvg(cfg.rank, p ? p.avatar : '👤');
      return \`
        <div id="m-podium-\${cfg.rank}" class="flex flex-col items-center opacity-0 transform translate-y-6 transition-all duration-700 ease-out">
          <!-- 2D Speler Model -->
          <div class="relative w-16 h-16 sm:w-20 sm:h-20 mb-1.5 filter drop-shadow-md">
            \${modelSvg}
            <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-xs shadow-sm">
              \${cfg.medal}
            </div>
          </div>

          <!-- Spelersnaam & Score -->
          <div class="text-center w-full px-1 mb-1">
            <span class="block text-xs font-black text-white truncate max-w-[90px] mx-auto">\${p ? p.name : 'Niemand'}</span>
            <span class="block text-[10px] font-bold text-amber-300 font-mono">\${p ? \`\${p.score} pt\` : '-'}</span>
          </div>

          <!-- Podium Pilaar -->
          <div class="w-full \${cfg.pillarHeight} \${cfg.pillarColor} rounded-t-xl border-t border-x flex flex-col items-center justify-start pt-1.5 shadow-md">
            <span class="text-xs font-black">\${cfg.rank}</span>
            <span class="text-[8px] font-bold uppercase tracking-wider opacity-80">\${cfg.rank === 1 ? 'Goud' : cfg.rank === 2 ? 'Zilver' : 'Brons'}</span>
          </div>
        </div>
      \`;
    };

    const cfg2 = {
      rank: 2,
      medal: '🥈',
      pillarHeight: 'h-16 sm:h-20',
      pillarColor: 'bg-gradient-to-t from-stone-700 via-stone-500 to-stone-300 text-stone-950 border-stone-200',
      player: top2
    };

    const cfg1 = {
      rank: 1,
      medal: '🥇',
      pillarHeight: 'h-24 sm:h-28',
      pillarColor: 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 text-stone-950 border-amber-200 shadow-amber-500/30 shadow-lg',
      player: top1
    };

    const cfg3 = {
      rank: 3,
      medal: '🥉',
      pillarHeight: 'h-12 sm:h-14',
      pillarColor: 'bg-gradient-to-t from-amber-950 via-amber-900 to-amber-700 text-amber-200 border-amber-600/50',
      player: top3
    };

    grid.innerHTML = \`
      \${buildSlotHtml(cfg2)}
      \${buildSlotHtml(cfg1)}
      \${buildSlotHtml(cfg3)}
    \`;

    // 1. Onthul 3e Plaats (Brons)
    const t3 = setTimeout(() => {
      const el3 = document.getElementById('m-podium-3');
      if (el3) {
        el3.classList.remove('opacity-0', 'translate-y-6');
        el3.classList.add('opacity-100', 'translate-y-0');
        if (window.sounds) window.sounds.playClick();
      }
    }, 500);
    mobilePodiumTimeouts.push(t3);

    // 2. Onthul 2e Plaats (Zilver)
    const t2 = setTimeout(() => {
      const el2 = document.getElementById('m-podium-2');
      if (el2) {
        el2.classList.remove('opacity-0', 'translate-y-6');
        el2.classList.add('opacity-100', 'translate-y-0');
        if (window.sounds) window.sounds.playSuccess();
      }
    }, 2200);
    mobilePodiumTimeouts.push(t2);

    // 3. Onthul 1e Plaats (Goud & Confetti!)
    const t1 = setTimeout(() => {
      const el1 = document.getElementById('m-podium-1');
      if (el1) {
        el1.classList.remove('opacity-0', 'translate-y-6');
        el1.classList.add('opacity-100', 'translate-y-0', 'scale-105');
        if (window.sounds) window.sounds.playLimitedClaim();

        if (typeof window.confetti === 'function') {
          window.confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 3900);
    mobilePodiumTimeouts.push(t1);
  }
`;

// Insert mobile podium code right before showGameOverScreen
code = code.replace(
  'function showGameOverScreen(data) {',
  mobilePodiumCode + '\n  function showGameOverScreen(data) {'
);

// Call renderMobilePodium in showGameOverScreen
code = code.replace(
  `showScreen('gameOver');`,
  `renderMobilePodium(data.leaderboard);
    showScreen('gameOver');`
);

fs.writeFileSync(playerAppPath, code, 'utf8');
console.log('playerApp.js updated successfully!');

