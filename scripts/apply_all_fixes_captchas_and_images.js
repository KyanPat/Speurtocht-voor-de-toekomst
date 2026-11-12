const fs = require('fs');
const path = require('path');

// ==========================================
// 1. UPDATE itemsData.js WITH INLINE SVG ILLUSTRATIONS FOR VISUAL QUESTIONS
// ==========================================
const itemsDataPath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');
let itemsDataCode = fs.readFileSync(itemsDataPath, 'utf8');

// SVG for Stop sign (Autosleutels Taak 1)
const svgStopSign = `<svg viewBox="0 0 200 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="200" height="120" fill="url(#roadGrad)"/>
  <!-- Witte wegstrepen -->
  <line x1="100" y1="90" x2="100" y2="120" stroke="#f8fafc" stroke-width="6" stroke-dasharray="10 8"/>
  <!-- Verkeersbord paal -->
  <rect x="96" y="65" width="8" height="50" fill="#94a3b8"/>
  <!-- Rood achthoekig Stopbord -->
  <polygon points="80,15 120,15 145,40 145,65 120,90 80,90 55,65 55,40" fill="#dc2626" stroke="#ffffff" stroke-width="4"/>
  <polygon points="82,19 118,19 141,42 141,63 118,86 82,86 59,63 59,42" fill="#ef4444"/>
  <text x="100" y="59" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">STOP</text>
</svg>`;

// SVG for Horse (Diploma Taak 2)
const svgHorse = `<svg viewBox="0 0 200 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="60%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
  </defs>
  <rect width="200" height="120" fill="url(#skyGrad)"/>
  <!-- Groene heuvel -->
  <ellipse cx="100" cy="130" rx="140" ry="40" fill="#16a34a"/>
  <!-- Paard silhouet / illustratie -->
  <g transform="translate(60, 20) scale(0.9)">
    <!-- Romp -->
    <ellipse cx="45" cy="50" rx="32" ry="18" fill="#78350f"/>
    <!-- Nek & Hoofd -->
    <path d="M 58 45 L 75 22 Q 82 18 85 24 L 88 32 Q 82 38 72 48 Z" fill="#78350f"/>
    <ellipse cx="84" cy="27" rx="8" ry="6" fill="#78350f"/>
    <!-- Oor -->
    <polygon points="78,16 83,14 81,22" fill="#5c2607"/>
    <!-- Manen -->
    <path d="M 75 18 Q 72 26 70 34 Q 68 42 66 48" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
    <!-- Benen -->
    <rect x="25" y="58" width="6" height="34" rx="2" fill="#5c2607"/>
    <rect x="35" y="58" width="5" height="32" rx="2" fill="#78350f"/>
    <rect x="55" y="58" width="6" height="34" rx="2" fill="#5c2607"/>
    <rect x="65" y="58" width="5" height="32" rx="2" fill="#78350f"/>
    <!-- Hoefjes -->
    <rect x="24" y="88" width="8" height="5" rx="1" fill="#1c1917"/>
    <rect x="34" y="86" width="7" height="5" rx="1" fill="#1c1917"/>
    <rect x="54" y="88" width="8" height="5" rx="1" fill="#1c1917"/>
    <rect x="64" y="86" width="7" height="5" rx="1" fill="#1c1917"/>
    <!-- Witte bles op neus -->
    <ellipse cx="85" cy="28" rx="3" ry="5" fill="#f8fafc"/>
    <!-- Wapperende staart -->
    <path d="M 16 46 Q 8 60 12 75" stroke="#f8fafc" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

// SVG for Eiffel Tower (Droomreis Taak 1)
const svgEiffelTower = `<svg viewBox="0 0 200 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="parisSunset" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="50%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#fde047"/>
    </linearGradient>
  </defs>
  <rect width="200" height="120" fill="url(#parisSunset)"/>
  <!-- Franse Vlag Badge -->
  <g transform="translate(160, 12)">
    <rect x="0" y="0" width="8" height="18" fill="#1d4ed8"/>
    <rect x="8" y="0" width="8" height="18" fill="#ffffff"/>
    <rect x="16" y="0" width="8" height="18" fill="#dc2626"/>
  </g>
  <!-- Eiffeltoren Silhouet -->
  <g transform="translate(100, 10) scale(0.9)" stroke="#1e1b4b" stroke-width="1.8" fill="none">
    <!-- Top Spits -->
    <line x1="0" y1="0" x2="0" y2="15" stroke="#1e1b4b" stroke-width="2.5"/>
    <polygon points="-4,15 4,15 3,35 -3,35" fill="#1e1b4b"/>
    <!-- Eerste Platform -->
    <rect x="-10" y="35" width="20" height="4" fill="#1e1b4b"/>
    <!-- Middenstuk -->
    <polygon points="-12,39 12,39 16,70 -16,70" fill="#1e1b4b"/>
    <rect x="-22" y="70" width="44" height="5" fill="#1e1b4b"/>
    <!-- Basis Boog & Benen -->
    <path d="M -22 75 L -34 115 M 22 75 L 34 115" stroke="#1e1b4b" stroke-width="6"/>
    <path d="M -20 115 Q 0 85 20 115" stroke="#1e1b4b" stroke-width="5"/>
  </g>
</svg>`;

// Inject svgIllustrations into itemsData.js
itemsDataCode = itemsDataCode.replace(
  `        "id": "autosleutels_task_1",
        "tag": "Verkeersbord herkennen",`,
  `        "id": "autosleutels_task_1",
        "tag": "Verkeersbord herkennen",
        "svgIllustration": ${JSON.stringify(svgStopSign)},`
);

itemsDataCode = itemsDataCode.replace(
  `        "id": "diploma_task_2",
        "tag": "Biologie dierenkennis",`,
  `        "id": "diploma_task_2",
        "tag": "Biologie dierenkennis",
        "svgIllustration": ${JSON.stringify(svgHorse)},`
);

itemsDataCode = itemsDataCode.replace(
  `        "id": "droomreis_task_1",
        "tag": "Topografie monumenten",`,
  `        "id": "droomreis_task_1",
        "tag": "Topografie monumenten",
        "svgIllustration": ${JSON.stringify(svgEiffelTower)},`
);

fs.writeFileSync(itemsDataPath, itemsDataCode, 'utf8');
console.log('✅ itemsData.js updated with crisp SVG illustrations for visual tasks!');

// ==========================================
// 2. UPDATE playerApp.js
// ==========================================
const playerAppPath = path.join(__dirname, '..', 'public', 'js', 'playerApp.js');
let playerCode = fs.readFileSync(playerAppPath, 'utf8');

// A. Render svgIllustration inside renderCurrentItemTaskStep if present
if (!playerCode.includes('currentTask.svgIllustration')) {
  playerCode = playerCode.replace(
    '<!-- Situatieschets -->',
    `<!-- Visuele Illustratie (Indien aanwezig) -->
        \${currentTask.svgIllustration ? \`
          <div class="w-full h-32 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center my-2 border border-stone-200/80 bg-stone-900">
            \${currentTask.svgIllustration}
          </div>
        \` : ''}

        <!-- Situatieschets -->`
  );
  console.log('✅ playerApp.js now renders svgIllustration in task steps!');
}

// B. Replace picsum & pravatar generators with 100% offline, instant vector SVG photo cards & avatars!
const offlineImagesEngine = `  // ==========================================
  // 100% OFFLINE VECTOR SVG FOTO- & AVATAR GENERATOR
  // Geen netwerkafhankelijkheid, geen gebroken externe URLs (picsum/pravatar)
  // Werkt altijd, laadt instant (0ms latency), 100% schermvrij betrouwbaar
  // ==========================================
  const OFFLINE_POST_THEMES = [
    { title: 'Zonsondergang aan het strand', icon: '🌅', color1: '#f43f5e', color2: '#fb923c', desc: 'Vakantiegevoel en ontspannen golven' },
    { title: 'Koffiemoment in de stad', icon: '☕', color1: '#78350f', color2: '#d97706', desc: 'Warme cappuccino met verse croissants' },
    { title: 'Neon stadslichten & skyline', icon: '🌆', color1: '#1e1b4b', color2: '#38bdf8', desc: 'Levendige avond in het hart van de stad' },
    { title: 'Wandeling in de bergen', icon: '🏔️', color1: '#0f766e', color2: '#34d399', desc: 'Frisse berglucht en uitzicht over de toppen' },
    { title: 'Artisan Pizza Avond', icon: '🍕', color1: '#991b1b', color2: '#ea580c', desc: 'Houtoven pizza met verse basilicum' },
    { title: 'Live Muziekfestival', icon: '🎸', color1: '#581c87', color2: '#ec4899', desc: 'Epische lichten en gitaarsolo podium' },
    { title: 'Fitness workout motivatie', icon: '🏋️', color1: '#1e293b', color2: '#06b6d4', desc: 'Energieke trainingssessie in de gym' },
    { title: 'Roadtrip langs de kust', icon: '🏎️', color1: '#14532d', color2: '#22c55e', desc: 'Vrijheid op de open snelweg' }
  ];

  function getSvgPostDataUri(seed = 1, width = 600, height = 600) {
    const idx = Math.abs(seed) % OFFLINE_POST_THEMES.length;
    const t = OFFLINE_POST_THEMES[idx];
    const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \${width} \${height}" width="\${width}" height="\${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="\${t.color1}"/>
          <stop offset="100%" stop-color="\${t.color2}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <circle cx="\${width / 2}" cy="\${height / 2 - 30}" r="\${Math.min(width, height) * 0.25}" fill="#ffffff" opacity="0.15"/>
      <text x="\${width / 2}" y="\${height / 2}" font-size="\${Math.min(width, height) * 0.3}" text-anchor="middle" dominant-baseline="middle">\${t.icon}</text>
      <text x="\${width / 2}" y="\${height / 2 + 100}" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1">\${t.title}</text>
      <text x="\${width / 2}" y="\${height / 2 + 135}" font-family="sans-serif" font-weight="500" font-size="14" fill="#f8fafc" opacity="0.85" text-anchor="middle">\${t.desc}</text>
    </svg>\`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function getSvgAvatarDataUri(initial = '👤', bgHex = '#059669') {
    const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="avGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="\${bgHex}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#avGrad)" stroke="#ffffff" stroke-width="3"/>
      <text x="50" y="56" font-family="sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">\${initial}</text>
    </svg>\`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function getRandomPicsumUrl(w = 600, h = 600) {
    igPostSeedCounter++;
    return getSvgPostDataUri(igPostSeedCounter, w, h);
  }

  function getRandomAvatarUrl() {
    const initials = ['M', 'S', 'L', 'D', 'E', 'K', 'T', 'B', 'P', 'R'];
    const colors = ['#059669', '#2563eb', '#7c3aed', '#db2777', '#d97706', '#0284c7'];
    const init = initials[Math.floor(Math.random() * initials.length)];
    const col = colors[Math.floor(Math.random() * colors.length)];
    return getSvgAvatarDataUri(init, col);
  }`;

// Replace getRandomPicsumUrl and getRandomAvatarUrl in playerApp.js
playerCode = playerCode.replace(
  /function getRandomPicsumUrl[\s\S]*?return `https:\/\/i\.pravatar\.cc\/150\?img=\$\{avatarNum\}`;[\s\S]*?\}/,
  offlineImagesEngine
);

// Also replace any remaining pravatar or picsum hardcoded URLs
playerCode = playerCode.replace(/https:\/\/i\.pravatar\.cc\/150\?img=49/g, getSvgAvatarDataUriMock('S', '#db2777'));
playerCode = playerCode.replace(/https:\/\/i\.pravatar\.cc\/150\?img=15/g, getSvgAvatarDataUriMock('L', '#2563eb'));
playerCode = playerCode.replace(/https:\/\/picsum\.photos\/seed\/escape_\$\{igPostSeedCounter\}\/600\/600/g, '${getSvgPostDataUri(igPostSeedCounter, 600, 600)}');
playerCode = playerCode.replace(/https:\/\/picsum\.photos\/seed\/\$\{seed\}\/1080\/1920/g, '${getSvgPostDataUri(seed, 600, 900)}');

function getSvgAvatarDataUriMock(initial, bgHex) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="48" fill="${bgHex}" stroke="#ffffff" stroke-width="3"/><text x="50" y="56" font-family="sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// C. REPLACE CAPTCHA ENGINE:
// 1. direction_match -> Top-Down Racecar SVG, clear directional arrow / hand, and explicit direction labels on both cards!
// 2. maze_cheese -> shadow_match (Schaduw Match Puzzel)!
// 3. Keep other 6: slider_puzzle, dice_match, odd_one_out, audio_captcha, distorted_word, distorted_code.

const newCaptchaEngineAll8 = `  // ==========================================
  // GEAVANCEERDE VISUELE CAPTCHA ENGINE (8 UNIEKE TYPES - 100% SVG/CSS/AUDIO)
  // Geen externe foto's, geen platform-afhankelijke emoji-rotaties
  // 1. direction_match: Oriëntatie puzzel (Top-down raceauto met duidelijke neus & richtingslabels)
  // 2. slider_puzzle: Horizontale slider naar uitsparing
  // 3. dice_match: Dobbelstenen optellen tot doelgetal
  // 4. shadow_match: Schaduw Match (Kies de exacte schaduw van het object)
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

  // Direction definitions: 0° = RECHTS, 90° = BENEDEN, 180° = LINKS, 270° = BOVEN
  const CARDINAL_DIRS = [
    { angle: 0, label: 'RECHTS (→)', hand: '👉' },
    { angle: 90, label: 'BENEDEN (↓)', hand: '👇' },
    { angle: 180, label: 'LINKS (←)', hand: '👈' },
    { angle: 270, label: 'BOVEN (↑)', hand: '👆' }
  ];

  function generateCaptchaChallengeByType(type) {
    if (type === 'direction_match') {
      const target = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
      let startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      while (startAngle === target.angle) {
        startAngle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      }

      return {
        uiType: 'direction_match',
        title: 'Oriëntatie Puzzel',
        subTitle: 'Draai de raceauto tot deze oriëntatie:',
        targetAngle: target.angle,
        targetLabel: target.label,
        targetHand: target.hand,
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

    // SHADOW MATCH: Vervangt het onduidelijke doolhof met de populaire schaduw-puzzel!
    if (type === 'shadow_match') {
      const shadowThemes = [
        {
          name: 'Raceauto',
          icon: '🏎️',
          silhouetteSvg: \`<svg viewBox="0 0 100 60" class="w-full h-full"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>\`,
          distractor1: \`<svg viewBox="0 0 100 60" class="w-full h-full" transform="scale(-1, 1) translate(-100, 0)"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>\`,
          distractor2: \`<svg viewBox="0 0 100 60" class="w-full h-full"><path d="M 15 35 L 30 35 L 40 25 L 60 25 L 75 35 L 85 35 L 85 42 L 15 42 Z M 25 42 A 5 5 0 0 1 35 42 Z M 65 42 A 5 5 0 0 1 75 42 Z" fill="#0f172a"/></svg>\`,
          distractor3: \`<svg viewBox="0 0 100 60" class="w-full h-full" transform="rotate(18, 50, 30)"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>\`
        },
        {
          name: 'Ruimteraket',
          icon: '🚀',
          silhouetteSvg: \`<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 5 Q 45 30 45 60 L 55 70 L 40 68 L 30 75 L 20 68 L 5 70 L 15 60 Q 15 30 30 5 Z" fill="#0f172a"/></svg>\`,
          distractor1: \`<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 10 Q 40 35 40 65 L 50 72 L 38 68 L 30 72 L 22 68 L 10 72 L 20 65 Q 20 35 30 10 Z" fill="#0f172a"/></svg>\`,
          distractor2: \`<svg viewBox="0 0 60 80" class="w-full h-full" transform="rotate(35, 30, 40)"><path d="M 30 5 Q 45 30 45 60 L 55 70 L 40 68 L 30 75 L 20 68 L 5 70 L 15 60 Q 15 30 30 5 Z" fill="#0f172a"/></svg>\`,
          distractor3: \`<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 5 Q 48 35 48 65 L 30 65 L 12 65 Q 12 35 30 5 Z" fill="#0f172a"/></svg>\`
        },
        {
          name: 'Dolfijn',
          icon: '🐬',
          silhouetteSvg: \`<svg viewBox="0 0 90 60" class="w-full h-full"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>\`,
          distractor1: \`<svg viewBox="0 0 90 60" class="w-full h-full" transform="scale(-1, 1) translate(-90, 0)"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>\`,
          distractor2: \`<svg viewBox="0 0 90 60" class="w-full h-full" transform="rotate(25, 45, 30)"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>\`,
          distractor3: \`<svg viewBox="0 0 90 60" class="w-full h-full"><path d="M 15 35 Q 30 18 55 22 Q 70 24 82 32 Q 68 35 58 42 Q 48 45 35 42 Q 22 45 15 48 Z" fill="#0f172a"/></svg>\`
        }
      ];

      const sel = shadowThemes[Math.floor(Math.random() * shadowThemes.length)];
      const options = [
        { id: 'correct', svg: sel.silhouetteSvg, isCorrect: true },
        { id: 'd1', svg: sel.distractor1, isCorrect: false },
        { id: 'd2', svg: sel.distractor2, isCorrect: false },
        { id: 'd3', svg: sel.distractor3, isCorrect: false }
      ].sort(() => Math.random() - 0.5);

      return {
        uiType: 'shadow_match',
        title: 'Schaduw Match',
        subTitle: \`Kies de schaduw die exact overeenkomt met \${sel.name}:\`,
        theme: sel,
        options: options,
        selectedOptionId: null
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
      'shadow_match',
      'odd_one_out',
      'audio_captcha',
      'distorted_word',
      'distorted_code'
    ];
    // Shuffle de types zodat de volgorde per item anders is
    const shuffled = [...allTypes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalSteps).map(t => generateCaptchaChallengeByType(t));
  }

  function getCardinalDirLabel(deg) {
    const norm = (deg % 360 + 360) % 360;
    if (norm === 0) return 'RECHTS (→)';
    if (norm === 90) return 'BENEDEN (↓)';
    if (norm === 180) return 'LINKS (←)';
    if (norm === 270) return 'BOVEN (↑)';
    return \`\${norm}°\`;
  }

  function renderCaptchaWidgetHtml(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const targetDeg = challenge.targetAngle;
      const curDeg = challenge.currentAngle;
      const targetLabel = challenge.targetLabel || getCardinalDirLabel(targetDeg);
      const curLabel = getCardinalDirLabel(curDeg);

      return \`
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-2 gap-3 items-center">
            <!-- Doel Oriëntatie -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Doel Richting</span>
              <div class="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center border border-stone-700 shadow-inner">
                <div style="transform: rotate(\${targetDeg}deg); transition: transform 0.3s ease;">
                  <span class="text-4xl leading-none">👉</span>
                </div>
              </div>
              <span class="mt-2 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[10px] font-black tracking-wide">\${targetLabel}</span>
            </div>

            <!-- Draaibare Top-Down Raceauto (0° neus wijst naar RECHTS) -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Raceauto</span>
              <div class="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shadow-inner overflow-hidden">
                <div id="\${prefix}-dir-target-icon" class="w-12 h-12 flex items-center justify-center transition-transform duration-300" style="transform: rotate(\${curDeg}deg);">
                  <!-- Top-Down Raceauto SVG (Neus wijst strak naar RECHTS bij 0°) -->
                  <svg viewBox="0 0 80 40" class="w-full h-full">
                    <!-- Schaduw -->
                    <rect x="6" y="6" width="68" height="28" rx="10" fill="#000000" opacity="0.4"/>
                    <!-- Wielen -->
                    <rect x="14" y="2" width="14" height="6" rx="2" fill="#0f172a"/>
                    <rect x="14" y="32" width="14" height="6" rx="2" fill="#0f172a"/>
                    <rect x="52" y="2" width="14" height="6" rx="2" fill="#0f172a"/>
                    <rect x="52" y="32" width="14" height="6" rx="2" fill="#0f172a"/>
                    <!-- Carrosserie (Rood metallic) -->
                    <rect x="8" y="7" width="64" height="26" rx="9" fill="#dc2626"/>
                    <!-- Spoiler achteraan (links) -->
                    <rect x="6" y="5" width="4" height="30" rx="2" fill="#1e1b4b"/>
                    <!-- Dak & Voorruit (Cockpit) -->
                    <path d="M 28 11 L 48 11 L 54 15 L 54 25 L 48 29 L 28 29 Z" fill="#0f172a"/>
                    <path d="M 45 13 L 52 16 L 52 24 L 45 27 Z" fill="#38bdf8" opacity="0.8"/>
                    <!-- Koplampen (rechts = voorkant) -->
                    <circle cx="70" cy="11" r="2.5" fill="#fef08a"/>
                    <circle cx="70" cy="29" r="2.5" fill="#fef08a"/>
                    <!-- Pijl op dak om richting 100% helder te maken -->
                    <polygon points="34,20 44,16 44,24" fill="#ffffff" opacity="0.9"/>
                  </svg>
                </div>
              </div>
              <span id="\${prefix}-dir-current-label" class="mt-2 px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-mono text-[10px] font-black tracking-wide">Stand: \${curLabel}</span>
            </div>
          </div>

          <!-- Draaiknoppen (90 graden per klik) -->
          <div class="flex justify-center gap-2.5 mt-3">
            <button type="button" id="\${prefix}-btn-rot-left" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span class="material-symbols-outlined text-sm">rotate_left</span>
              <span>Draai links (90°)</span>
            </button>
            <button type="button" id="\${prefix}-btn-rot-right" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span>Draai rechts (90°)</span>
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

    if (challenge.uiType === 'shadow_match') {
      return \`
        <div class="p-3 bg-stone-50 rounded-2xl border-2 border-stone-200 my-2 select-none text-center space-y-2.5">
          <!-- Te matchen object in kleur -->
          <div class="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-stone-100 border border-stone-200 max-w-[200px] mx-auto shadow-inner">
            <span class="text-3xl">\${challenge.theme.icon}</span>
            <span class="text-xs font-black text-stone-800">\${challenge.theme.name}</span>
          </div>

          <!-- 4 Schaduw Opties (2x2 Grid) -->
          <div class="grid grid-cols-2 gap-2" id="\${prefix}-shadow-grid">
            \${challenge.options.map((opt, idx) => \`
              <button type="button" class="shadow-opt-btn p-3 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-100 active:scale-95 transition flex flex-col items-center justify-center h-20 cursor-pointer shadow-xs relative" data-id="\${opt.id}">
                <div class="w-16 h-12 flex items-center justify-center pointer-events-none">
                  \${opt.svg}
                </div>
                <span class="absolute top-1 left-2 text-[10px] font-bold text-stone-400">\${String.fromCharCode(65 + idx)}</span>
              </button>
            \`).join('')}
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
      const label = document.getElementById(\`\${prefix}-dir-current-label\`);
      const btnLeft = document.getElementById(\`\${prefix}-btn-rot-left\`);
      const btnRight = document.getElementById(\`\${prefix}-btn-rot-right\`);

      if (btnLeft) {
        btnLeft.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle - 90 + 360) % 360;
          if (icon) icon.style.transform = \`rotate(\${challenge.currentAngle}deg)\`;
          if (label) label.textContent = \`Stand: \${getCardinalDirLabel(challenge.currentAngle)}\`;
        };
      }
      if (btnRight) {
        btnRight.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle + 90) % 360;
          if (icon) icon.style.transform = \`rotate(\${challenge.currentAngle}deg)\`;
          if (label) label.textContent = \`Stand: \${getCardinalDirLabel(challenge.currentAngle)}\`;
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
    } else if (challenge.uiType === 'shadow_match') {
      const shadowBtns = document.querySelectorAll(\`#\${prefix}-shadow-grid .shadow-opt-btn\`);
      shadowBtns.forEach(btn => {
        btn.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          shadowBtns.forEach(b => {
            b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
            b.classList.add('border-stone-200', 'bg-white');
          });
          btn.classList.remove('border-stone-200', 'bg-white');
          btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
          challenge.selectedOptionId = btn.getAttribute('data-id');
        };
      });
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
    if (challenge.uiType === 'shadow_match') {
      if (!challenge.selectedOptionId) return 'select_none';
      return challenge.selectedOptionId === 'correct';
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

// Replace the captcha block
const capStart = playerCode.indexOf('// ==========================================\n  // GEAVANCEERDE VISUELE CAPTCHA ENGINE');
const capEnd = playerCode.indexOf('function renderCurrentLocationCaptchaStep');

if (capStart !== -1 && capEnd !== -1) {
  playerCode = playerCode.substring(0, capStart) + newCaptchaEngineAll8 + '\n\n  ' + playerCode.substring(capEnd);
  console.log('✅ playerApp.js captcha engine replaced with direction_match (racecar) and shadow_match!');
} else {
  console.error('Could not find captcha engine boundaries in playerApp.js!');
  process.exit(1);
}

fs.writeFileSync(playerAppPath, playerCode, 'utf8');
console.log('✅ playerApp.js written successfully!');

