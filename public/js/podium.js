// Gedeeld eindpodium voor digibord EN telefoon (zelfde poppetjes, labels en animatie)
(function () {
  function createPlayer2DModelSvg(place, avatar) {
    const av = avatar || '🎒';

    if (place === 3) {
      // 3e Plaats: 2D Model van speler ingedoken in telefoon door doomscrollen
      return `
      <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="screenBeam3" cx="50%" cy="80%" r="65%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95"/>
            <stop offset="45%" stop-color="#0284c7" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#0369a1" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="hoodieGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>

        <!-- Donkere kamer achtergrond -->
        <circle cx="80" cy="80" r="76" fill="#090d16" stroke="#b45309" stroke-width="2.5"/>

        <!-- Zwevende storende notificaties -->
        <g opacity="0.9">
          <circle cx="28" cy="38" r="9" fill="#ef4444"/>
          <text x="28" y="42" font-size="10" text-anchor="middle" fill="#fff" font-weight="900" font-family="sans-serif">!</text>

          <circle cx="132" cy="44" r="10" fill="#ec4899"/>
          <text x="132" y="48" font-size="10" text-anchor="middle" fill="#fff" font-family="sans-serif">❤</text>

          <rect x="108" y="18" width="24" height="15" rx="5" fill="#f59e0b"/>
          <text x="120" y="29" font-size="8" text-anchor="middle" fill="#000" font-weight="900" font-family="sans-serif">REELS</text>
        </g>

        <!-- Kromme ingedoken rug / lichaam -->
        <path d="M 32 158 Q 40 96 74 94 Q 112 92 128 158 Z" fill="url(#hoodieGrad3)"/>

        <!-- Speler avatar op hoodie -->
        <circle cx="80" cy="116" r="13" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
        <text x="80" y="121" font-size="14" text-anchor="middle">${av}</text>

        <!-- Voorovergebogen hoofd in schermtrance -->
        <g>
          <circle cx="80" cy="58" r="23" fill="#1e293b"/>
          <ellipse cx="80" cy="65" rx="19" ry="17" fill="#fed7aa"/>
          <!-- Halve droopy oogjes gericht op het scherm -->
          <ellipse cx="73" cy="68" rx="3.5" ry="2" fill="#0284c7"/>
          <ellipse cx="87" cy="68" rx="3.5" ry="2" fill="#0284c7"/>
          <circle cx="73" cy="68" r="1.2" fill="#38bdf8"/>
          <circle cx="87" cy="68" r="1.2" fill="#38bdf8"/>
          <!-- Gezichtsuitdrukking: verdoofd door scherm -->
          <ellipse cx="80" cy="76" rx="2.5" ry="2" fill="#9a3412" opacity="0.6"/>
        </g>

        <!-- Telefoonscherm schijnsel (blauw beam omhoog op het gezicht) -->
        <polygon points="62,118 98,118 106,64 54,64" fill="url(#screenBeam3)" opacity="0.85"/>

        <!-- Armen gebogen naar voren met telefoon -->
        <path d="M 45 118 Q 62 136 70 128" stroke="#334155" stroke-width="10" stroke-linecap="round" fill="none"/>
        <path d="M 115 118 Q 98 136 90 128" stroke="#334155" stroke-width="10" stroke-linecap="round" fill="none"/>

        <!-- De oplichtende smartphone -->
        <rect x="66" y="108" width="28" height="42" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="2" transform="rotate(-3 80 129)"/>
        <rect x="69" y="112" width="22" height="34" rx="2" fill="#e0f2fe" transform="rotate(-3 80 129)"/>
        <!-- Duimen op het scherm -->
        <circle cx="68" cy="125" r="3.5" fill="#fed7aa"/>
        <circle cx="92" cy="123" r="3.5" fill="#fed7aa"/>
      </svg>`;
    }

    if (place === 2) {
      // 2e Plaats: 2D Model van speler meer overeind, telefoon omlaag/uit, blik omhoog
      return `
      <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shirtGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>

        <!-- Frisse achtergrond cirkel -->
        <circle cx="80" cy="80" r="76" fill="#131c2e" stroke="#94a3b8" stroke-width="2.5"/>

        <!-- Frisse aura/sterretjes -->
        <circle cx="34" cy="36" r="2" fill="#38bdf8" opacity="0.7"/>
        <circle cx="126" cy="38" r="2.5" fill="#38bdf8" opacity="0.7"/>
        <circle cx="28" cy="72" r="1.5" fill="#94a3b8" opacity="0.6"/>

        <!-- Rechtop zittend lichaam / romp -->
        <path d="M 36 158 Q 42 102 80 100 Q 118 102 124 158 Z" fill="url(#shirtGrad2)"/>

        <!-- Kraagje -->
        <polygon points="70,102 80,116 90,102" fill="#e2e8f0"/>

        <!-- Speler avatar op borst -->
        <circle cx="80" cy="128" r="13" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="80" y="133" font-size="14" text-anchor="middle">${av}</text>

        <!-- Hoofd rechtop en omhoog gericht -->
        <g>
          <circle cx="80" cy="54" r="24" fill="#334155"/>
          <ellipse cx="80" cy="58" rx="20" ry="20" fill="#fed7aa"/>
          <!-- Heldere, wakkere ogen recht naar voren/omhoog -->
          <circle cx="73" cy="56" r="3.5" fill="#1e293b"/>
          <circle cx="87" cy="56" r="3.5" fill="#1e293b"/>
          <circle cx="74.5" cy="54.5" r="1.2" fill="#ffffff"/>
          <circle cx="88.5" cy="54.5" r="1.2" fill="#ffffff"/>
          <!-- Lichte glimlach / ontspanning -->
          <path d="M 74 68 Q 80 73 86 68" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none"/>
        </g>

        <!-- Rechterarm relaxed -->
        <path d="M 44 110 Q 36 130 38 150" stroke="#0284c7" stroke-width="9" stroke-linecap="round" fill="none"/>

        <!-- Linkerarm houdt de telefoon omlaag (scherm staat UIT!) -->
        <path d="M 116 110 Q 124 130 118 144" stroke="#0284c7" stroke-width="9" stroke-linecap="round" fill="none"/>
        <!-- Telefoon omlaag gericht, zwart scherm -->
        <rect x="112" y="136" width="16" height="22" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.5" transform="rotate(15 120 147)"/>
        <rect x="114" y="138" width="12" height="18" rx="1.5" fill="#0f172a" transform="rotate(15 120 147)"/>
        <circle cx="118" cy="144" r="3.5" fill="#fed7aa"/>
      </svg>`;
    }

    // 1e Plaats: 2D Model van speler afgestudeerd & schermvrij (Baret, Toga, Diploma omhoog!)
    return `
    <svg viewBox="0 0 160 160" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldAura" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <linearGradient id="togaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
      </defs>

      <!-- Gouden glorieuze achtergrond cirkel -->
      <circle cx="80" cy="80" r="76" fill="#171821" stroke="url(#goldAura)" stroke-width="3.5"/>

      <!-- Gouden vonken / feestelijke sterren -->
      <g fill="#fbbf24" opacity="0.9">
        <polygon points="26,32 29,38 36,39 30,44 32,51 26,47 20,51 22,44 16,39 23,38"/>
        <polygon points="134,32 137,38 144,39 138,44 140,51 134,47 128,51 130,44 124,39 131,38"/>
        <circle cx="48" cy="22" r="2" fill="#fff"/>
        <circle cx="112" cy="20" r="2.5" fill="#fff"/>
      </g>

      <!-- Statige Toga (Academisch afstudeerkleed) -->
      <path d="M 32 158 Q 40 96 80 94 Q 120 96 128 158 Z" fill="url(#togaGrad)"/>

      <!-- Gouden sjerp / revers van geslaagde -->
      <path d="M 68 96 L 76 158 L 84 158 L 92 96 Z" fill="url(#goldAura)"/>

      <!-- Gouden Ere-medaille met speler avatar -->
      <circle cx="80" cy="120" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
      <text x="80" y="125.5" font-size="15" text-anchor="middle">${av}</text>

      <!-- Vrolijk, trots hoofd -->
      <g>
        <circle cx="80" cy="56" r="22" fill="#fed7aa"/>
        <path d="M 70 54 Q 74 49 78 54" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M 82 54 Q 86 49 90 54" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M 72 65 Q 80 73 88 65" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle cx="68" cy="62" r="3" fill="#f43f5e" opacity="0.4"/>
        <circle cx="92" cy="62" r="3" fill="#f43f5e" opacity="0.4"/>
      </g>

      <!-- Academische Baret (Graduation Cap / Mortarboard) -->
      <g transform="translate(0, -2)">
        <ellipse cx="80" cy="38" rx="16" ry="6" fill="#09090b"/>
        <polygon points="80,18 122,30 80,42 38,30" fill="#0f172a" stroke="#fbbf24" stroke-width="1.5"/>
        <circle cx="80" cy="30" r="2.5" fill="#fbbf24"/>
        <path d="M 80 30 Q 106 33 108 48" stroke="#fbbf24" stroke-width="2" fill="none"/>
        <rect x="105" y="48" width="6" height="8" rx="1" fill="#f59e0b"/>
      </g>

      <!-- Rechterhand steekt trots het DIPLOMA omhoog! -->
      <g transform="translate(-16, -6)">
        <path d="M 52 104 Q 40 85 42 70" stroke="#1e1b4b" stroke-width="9" stroke-linecap="round" fill="none"/>
        <circle cx="42" cy="68" r="4" fill="#fed7aa"/>
        <rect x="28" y="52" width="28" height="11" rx="2" fill="#fffbeb" stroke="#d97706" stroke-width="1.5" transform="rotate(-25 42 57)"/>
        <rect x="40" y="50" width="4" height="15" fill="#dc2626" transform="rotate(-25 42 57)"/>
      </g>

      <!-- Linkerhand zwaait vrolijk -->
      <path d="M 112 104 Q 124 88 122 75" stroke="#1e1b4b" stroke-width="9" stroke-linecap="round" fill="none"/>
      <circle cx="122" cy="73" r="4" fill="#fed7aa"/>
    </svg>`;
  }

  // SVG-id's uniek maken per render, zodat gradients niet botsen als er meerdere podia op een pagina staan
  let uid = 0;
  function modelSvg(place, avatar) {
    uid++;
    return createPlayer2DModelSvg(place, avatar)
      .replace(/id="([A-Za-z0-9]+)"/g, `id="$1_${uid}"`)
      .replace(/url\(#([A-Za-z0-9]+)\)/g, `url(#$1_${uid})`);
  }

  const CONFIGS = {
    3: {
      place: '3e Plaats', medal: '🥉',
      pillarHeight: 'h-24 md:h-28', pillarHeightCompact: 'h-14',
      pillarColor: 'bg-gradient-to-t from-amber-950 via-amber-900 to-amber-700 text-amber-200 border-amber-600/50',
      badgeText: '📱 Verzonken in doomscrollen',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-800/80',
      descText: 'Tijd verloren aan schermen & video feeds'
    },
    2: {
      place: '2e Plaats', medal: '🥈',
      pillarHeight: 'h-32 md:h-36', pillarHeightCompact: 'h-20',
      pillarColor: 'bg-gradient-to-t from-stone-600 via-stone-400 to-stone-200 text-stone-900 border-stone-100',
      badgeText: '👀 Minder op scherm, blik omhoog',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
      descText: 'Weerstand geboden aan de meeste afleidingen'
    },
    1: {
      place: '1e Plaats', medal: '🥇',
      pillarHeight: 'h-44 md:h-52', pillarHeightCompact: 'h-28',
      pillarColor: 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 text-stone-950 border-amber-200 shadow-amber-500/20 shadow-xl',
      badgeText: '🎓 Schermvrij & Glansrijk Geslaagd!',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 ring-1 ring-emerald-400/40',
      descText: 'Volledig gefocust op de echte toekomst!'
    }
  };

  let timeouts = [];

  /**
   * Render het podium in `grid`. opts.compact = telefoonformaat (zelfde inhoud, kleiner).
   */
  function render(grid, leaderboard, opts = {}) {
    if (!grid) return;
    const compact = !!opts.compact;
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
    grid.innerHTML = '';

    const list = Array.isArray(leaderboard) ? leaderboard : [];

    const buildColumn = (rank) => {
      const cfg = CONFIGS[rank];
      const player = list[rank - 1] || null;
      const pillarH = compact ? cfg.pillarHeightCompact : cfg.pillarHeight;
      const col = document.createElement('div');
      col.className = 'flex flex-col items-center justify-end transition-all duration-700 ease-out opacity-0 transform translate-y-10 scale-95 min-w-0';

      if (!player) {
        col.innerHTML = `
          <div class="w-full text-center mb-3"><span class="text-stone-600 text-xs font-mono">- Geen speler -</span></div>
          <div class="w-full ${pillarH} bg-stone-900/90 ${compact ? 'rounded-t-2xl' : 'rounded-t-3xl'} border border-stone-800 flex items-center justify-center text-stone-600 font-bold text-xl">${cfg.medal}</div>`;
        return col;
      }

      col.innerHTML = `
        <div class="flex flex-col items-center text-center mb-2 w-full">
          <div class="${compact ? 'w-[4.5rem] h-[4.5rem]' : 'w-20 h-20 sm:w-28 sm:h-28'} rounded-3xl overflow-hidden shadow-2xl relative mb-1.5 flex items-center justify-center">
            ${modelSvg(rank, player.avatar)}
          </div>
          <span class="text-xs ${compact ? '' : 'sm:text-sm'} font-black text-white truncate max-w-full px-1">${player.name}</span>
          <span class="text-[11px] ${compact ? '' : 'sm:text-xs'} font-mono font-bold text-emerald-400">${player.score} pt</span>
          <div class="mt-1 px-1.5 py-0.5 rounded-lg border ${compact ? 'text-[8.5px]' : 'text-[9px] sm:text-[10px]'} font-bold leading-tight max-w-full ${cfg.badgeClass}">
            ${cfg.badgeText}
          </div>
          <p class="text-[9px] text-stone-400 mt-0.5 ${compact ? 'leading-tight' : 'hidden sm:block max-w-[140px] leading-tight'}">${cfg.descText}</p>
        </div>
        <div class="w-full ${pillarH} ${cfg.pillarColor} ${compact ? 'rounded-t-2xl' : 'rounded-t-3xl'} flex flex-col items-center justify-center shadow-2xl border-t-2">
          <span class="${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black drop-shadow">${cfg.medal}</span>
          <span class="${compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'} font-black uppercase tracking-wider">${cfg.place}</span>
        </div>`;
      return col;
    };

    const col2 = buildColumn(2), col1 = buildColumn(1), col3 = buildColumn(3);
    grid.appendChild(col2); grid.appendChild(col1); grid.appendChild(col3);

    const reveal = (col) => {
      col.classList.remove('opacity-0', 'translate-y-10', 'scale-95');
      col.classList.add('opacity-100', 'translate-y-0', 'scale-100');
    };
    timeouts.push(setTimeout(() => { reveal(col3); if (window.sounds && window.sounds.playClick) window.sounds.playClick(); }, 600));
    timeouts.push(setTimeout(() => { reveal(col2); if (window.sounds && window.sounds.playClick) window.sounds.playClick(); }, 2200));
    timeouts.push(setTimeout(() => {
      reveal(col1);
      if (window.sounds) {
        if (typeof window.sounds.playReward === 'function') window.sounds.playReward();
        else if (typeof window.sounds.playSuccess === 'function') window.sounds.playSuccess();
      }
      if (typeof window.confetti === 'function') window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }, 3800));
  }

  window.SharedPodium = { render, createPlayer2DModelSvg: modelSvg };
})();
