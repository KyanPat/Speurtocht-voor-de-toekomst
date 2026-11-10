// Player App State & Controller voor Doomscroll Escape (v5)
(function () {
  const socket = io();

  // Lokale toestand
  const state = {
    playerId: localStorage.getItem('doomscroll_playerId') || null,
    playerName: localStorage.getItem('doomscroll_playerName') || '',
    playerAvatar: localStorage.getItem('doomscroll_playerAvatar') || '🎒',
    score: 0,
    claimedItems: [],
    cooldowns: {}, // itemId -> remainingSeconds
    revealedLocations: JSON.parse(localStorage.getItem('doomscroll_revealed_locs') || '{}'),
    cardOrder: null,
    reelsMuted: false,
    inDoomscroll: false,
    currentApp: 'Instagram',
    activeItemId: null,
    activeModal: null,
    gameStatus: 'LOBBY',
    timeRemaining: 900,
    limitedItems: {},
    generalItems: {},
    trapStartTime: null,
    feedBatchCount: 0,
    stats: {
      wrongAnswers: 0,
      hintsClicked: 0,
      selfControlRewards: 0,
      doomscrollSeconds: 0
    }
  };

  // Cooldown timers intervallen
  const cooldownIntervals = {};

  // DOM Elementen
  const screens = {
    login: document.getElementById('screen-login'),
    lobbyWait: document.getElementById('screen-lobby-wait'),
    gameplay: document.getElementById('screen-gameplay'),
    doomscrollTrap: document.getElementById('screen-doomscroll-trap'),
    gameOver: document.getElementById('screen-game-over')
  };

  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');

  // ==========================================
  // INITIALISATIE & SOCKET LISTENERS
  // ==========================================
  function syncItemsData(generalItems, limitedItems) {
    if (typeof ITEMS_DATA === 'undefined') return;
    const all = { ...(generalItems || {}), ...(limitedItems || {}) };
    Object.keys(all).forEach(id => {
      if (ITEMS_DATA[id]) {
        if (all[id].secretLocation) ITEMS_DATA[id].secretLocation = all[id].secretLocation;
        if (all[id].location && (!ITEMS_DATA[id].isLimited || (state.revealedLocations && state.revealedLocations[id]))) {
          ITEMS_DATA[id].location = all[id].location;
        }
        if (all[id].code) ITEMS_DATA[id].code = all[id].code;
      }
    });
  }

  function init() {
    setupAvatarPicker();
    setupLoginHandler();
    setupTrapExitHandler();
    setupFullscreenHandler();
    setupRulesHandler();
    setupBackdropDismiss();
    window.addEventListener('resize', updateAdventureTrail);

    // Notificatiesysteem initialiseren:
    // Als speler op een notificatie tikt, open direct de bijbehorende app (zoals WhatsApp / bericht van moeder)!
    window.notifications.init((notif) => {
      let targetApp = 'Instagram';
      const raw = `${notif.app || ''} ${notif.platform || ''} ${notif.title || ''} ${notif.message || ''}`.toLowerCase();
      if (raw.includes('whatsapp') || raw.includes('moeder')) {
        targetApp = 'WhatsApp';
      } else if (raw.includes('tiktok')) {
        targetApp = 'TikTok';
      } else if (raw.includes('bereal')) {
        targetApp = 'BeReal';
      } else if (raw.includes('snapchat')) {
        targetApp = 'Snapchat';
      }
      openAppFeed(targetApp, 'notif_trap');
    });

    // Herstel eventuele opgeslagen naam
    if (state.playerName) {
      const nameInput = document.getElementById('player-name-input');
      if (nameInput) nameInput.value = state.playerName;
    }

    // Socket verbindingsevents
    socket.on('connect', () => {
      console.log('Verbonden met server, socket ID:', socket.id);
      if (state.playerId && state.playerName) {
        socket.emit('player:join', {
          name: state.playerName,
          avatar: state.playerAvatar,
          existingId: state.playerId
        });
      }
    });

    socket.on('player:registered', (data) => {
      state.playerId = data.player.id;
      localStorage.setItem('doomscroll_playerId', state.playerId);
      state.score = data.player.score || 0;
      state.claimedItems = data.player.claimedItems || [];
      state.cooldowns = data.player.cooldowns || {};
      state.stats = data.player.stats || state.stats;
      state.cardOrder = getPlayerCardOrder(state.playerId);

      updatePlayerBar();
      updateScreenVisibility(data.gameState.status);
    });

    socket.on('state:sync', (data) => {
      state.gameStatus = data.status;
      state.timeRemaining = data.timeRemaining;
      state.limitedItems = data.limitedItems;
      state.generalItems = data.generalItems;

      syncItemsData(data.generalItems, data.limitedItems);

      // Zoek eigen speler in leaderboard
      const me = (data.leaderboard || []).find(p => p.id === state.playerId);
      if (me) {
        state.score = me.score;
        state.claimedItems = me.claimedItems || [];
        state.stats = me.stats || state.stats;
        updatePlayerBar();
      }

      updateScreenVisibility(data.status);

      if (data.status === 'LOBBY') {
        updateLobbyPlayerList(data.leaderboard || []);
      } else if (data.status === 'PLAYING') {
        renderMapCards();
      }
    });

    socket.on('timer:tick', (data) => {
      state.timeRemaining = data.timeRemaining;
      updateHeaderTimer(data.formattedTime);
    });

    socket.on('game:started', (data) => {
      state.gameStatus = 'PLAYING';
      state.timeRemaining = data.timeRemaining;
      closeModal();
      showScreen('gameplay');
      renderMapCards();
      window.notifications.startAmbientDistractions();
      if (window.sounds) window.sounds.playSuccess();
      showToast('🚀 Het spel is gestart! Vind de items op de kaart.', 'success');
    });

    socket.on('game:ended', (data) => {
      state.gameStatus = 'ENDED';
      window.notifications.stopAmbientDistractions();
      closeModal();
      screens.doomscrollTrap.classList.add('hidden');
      state.inDoomscroll = false;
      showGameOverScreen(data);
    });

    // Herstart / Reset naar lobby ontvangen van server
    socket.on('game:reset', (data) => {
      state.gameStatus = 'LOBBY';
      state.timeRemaining = data.timeRemaining || 900;
      state.score = 0;
      state.claimedItems = [];
      state.cooldowns = {};
      state.inDoomscroll = false;
      state.revealedLocations = {};
      localStorage.removeItem('doomscroll_revealed_locs');
      state.cardOrder = null;

      // Stop afleidingen
      if (window.notifications) window.notifications.stopAmbientDistractions();

      // Sluit eventuele openstaande modalen en traps
      closeModal();
      if (screens.doomscrollTrap) screens.doomscrollTrap.classList.add('hidden');
      if (screens.gameOver) screens.gameOver.classList.add('hidden');

      // Clear actieve cooldown intervals
      Object.keys(cooldownIntervals).forEach(k => {
        clearInterval(cooldownIntervals[k]);
        delete cooldownIntervals[k];
      });

      syncItemsData(data.generalItems, data.limitedItems);
      updatePlayerBar();
      updateLobbyPlayerList(data.leaderboard || []);
      showScreen(state.playerName ? 'lobbyWait' : 'login');
      showToast('Spel herstart naar de lobby!', 'info');
      if (window.sounds) window.sounds.playSuccess();
    });

    // Realtime update van instellingen & locaties
    socket.on('settings:updated', (data) => {
      syncItemsData(data.generalItems, data.limitedItems);
      if (state.gameStatus === 'PLAYING') {
        renderMapCards();
      }
    });

    // Realtime broadcast wanneer een ANDERE speler een limited item pakt!
    socket.on('item:limited_claimed', (data) => {
      if (window.sounds) window.sounds.playLimitedClaim();
      showToast(`🔥 ${data.toastMessage || `${data.playerName} heeft ${data.itemName} geclaimd!`}`, 'warning');
      renderMapCards();

      // Als deze speler toevallig dezelfde pop-up open had, sluit hem
      if (state.activeItemId === data.itemId && state.activeModal) {
        closeModal();
      }
    });

    socket.on('item:unlocked', (data) => {
      if (window.sounds) window.sounds.playLimitedClaim();
      showToast(data.message, 'success');
      renderMapCards();
    });

    socket.on('item:unlock_countdown_started', (data) => {
      showToast(`⏱️ ${data.message}`);
      renderMapCards();
    });

    socket.on('distraction:triggered', (data) => {
      window.notifications.triggerRandomDistraction(data.notification);
    });

    socket.on('notification:push', (data) => {
      let matchedNotif = (typeof PUSH_NOTIFICATIONS !== 'undefined' ? PUSH_NOTIFICATIONS : []).find(n => {
        const plat = (data.platform || '').toLowerCase();
        return n.app.toLowerCase() === plat || (plat === 'whatsapp' && n.title.includes('Moeder'));
      });
      if (!matchedNotif) {
        const isWa = (data.platform === 'whatsapp' || (data.message || '').includes('Moeder') || (data.title || '').includes('WhatsApp'));
        matchedNotif = {
          app: isWa ? 'WhatsApp' : data.platform === 'tiktok' ? 'TikTok' : data.platform === 'bereal' ? 'BeReal' : data.platform === 'snapchat' ? 'Snapchat' : 'Instagram',
          icon: isWa ? 'chat' : 'notifications',
          color: isWa ? '#25D366' : '#E1306C',
          title: isWa ? 'WhatsApp • Moeder' : (data.title || 'Notificatie'),
          message: data.message,
          time: 'Nu'
        };
      }
      window.notifications.show(matchedNotif);
    });

    // Herstel schermstatus bij herladen
    updateScreenVisibility(state.gameStatus);
  }

  // ==========================================
  // SCHERM ROUTING & WEERGAVE
  // ==========================================
  function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
      if (screens[key]) screens[key].classList.add('hidden');
    });

    if (screens[screenKey]) {
      screens[screenKey].classList.remove('hidden');
    }

    if (screenKey === 'gameplay') {
      setTimeout(updateAdventureTrail, 50);
      setTimeout(updateAdventureTrail, 250);
    }
  }

  function updateScreenVisibility(status) {
    if (state.inDoomscroll) {
      showScreen('doomscrollTrap');
      return;
    }

    if (status === 'LOBBY') {
      if (!state.playerName) {
        showScreen('login');
      } else {
        showScreen('lobbyWait');
      }
    } else if (status === 'PLAYING') {
      showScreen('gameplay');
      renderMapCards();
    } else if (status === 'ENDED') {
      showScreen('gameOver');
    }
  }

  // ==========================================
  // AVATAR & NAAM SETUP (LOBBY)
  // ==========================================
  function setupAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    if (!picker) return;

    const avatars = ['🎒', '🧭', '📱', '🕵️', '🚀', '⚡', '🦊', '🦉'];
    picker.innerHTML = '';

    avatars.forEach(av => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${
        state.playerAvatar === av ? 'bg-primary/20 border-2 border-primary scale-110' : 'bg-stone-100 hover:bg-stone-200'
      }`;
      btn.textContent = av;
      btn.addEventListener('click', () => {
        state.playerAvatar = av;
        localStorage.setItem('doomscroll_playerAvatar', av);
        setupAvatarPicker();
        if (window.sounds) window.sounds.playClick();
      });
      picker.appendChild(btn);
    });
  }

  function setupLoginHandler() {
    const btn = document.getElementById('btn-join-game');
    const input = document.getElementById('player-name-input');

    const handleJoin = () => {
      const name = (input.value || '').trim();
      if (!name) {
        input.focus();
        input.classList.add('shake', 'border-rose-500');
        setTimeout(() => input.classList.remove('shake'), 400);
        return;
      }

      state.playerName = name;
      localStorage.setItem('doomscroll_playerName', name);
      if (window.sounds) window.sounds.playSuccess();

      socket.emit('player:join', {
        name: state.playerName,
        avatar: state.playerAvatar,
        existingId: state.playerId
      });

      document.getElementById('wait-player-name').textContent = state.playerName;
      showScreen('lobbyWait');
    };

    btn.addEventListener('click', handleJoin);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleJoin();
    });

    const restartBtn = document.getElementById('btn-restart-player');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        screens.gameOver.classList.add('hidden');
        state.gameStatus = 'LOBBY';
        state.score = 0;
        state.claimedItems = [];
        state.cooldowns = {};
        state.inDoomscroll = false;
        closeModal();
        updatePlayerBar();
        showScreen(state.playerName ? 'lobbyWait' : 'login');
        socket.emit('player:restart_lobby');
      });
    }

    const startDirectBtn = document.getElementById('btn-lobby-start-direct');
    if (startDirectBtn) {
      startDirectBtn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        socket.emit('admin:start_game');
        showToast('🚀 Het spel wordt gestart...', 'success');
      });
    }
  }

  function updateLobbyPlayerList(players) {
    const listEl = document.getElementById('wait-players-list');
    const countEl = document.getElementById('wait-player-count');
    if (!listEl) return;

    listEl.innerHTML = '';
    const activePlayers = players || [];
    countEl.textContent = `${activePlayers.length} speler${activePlayers.length === 1 ? '' : 's'}`;

    activePlayers.forEach(p => {
      const chip = document.createElement('span');
      chip.className = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        p.id === state.playerId ? 'bg-primary text-white' : 'bg-white text-stone-800 border border-stone-200'
      }`;
      chip.innerHTML = `<span>${p.avatar}</span> <span>${p.name}</span>`;
      listEl.appendChild(chip);
    });
  }

  // ==========================================
  // STATUSBALK & TIMER
  // ==========================================
  function updatePlayerBar() {
    const nameEl = document.getElementById('bar-name');
    const scoreEl = document.getElementById('bar-score');
    const avatarEl = document.getElementById('bar-avatar');

    if (nameEl) nameEl.textContent = state.playerName || 'Speler';
    if (scoreEl) scoreEl.textContent = `${state.score} Punt${state.score === 1 ? '' : 'en'}`;
    if (avatarEl) avatarEl.textContent = state.playerAvatar;
  }

  function updateHeaderTimer(formatted) {
    const t1 = document.getElementById('bar-timer');
    const t2 = document.getElementById('footer-countdown');
    if (t1) t1.textContent = formatted;
    if (t2) {
      const parts = formatted.split(':');
      t2.textContent = `${parseInt(parts[0], 10)} minuten en ${parseInt(parts[1], 10)} seconden`;
    }
  }

  // ==========================================
  // DETERMINISTISCHE RANDOM ROUTE PER SPELER
  // ==========================================
  function getPlayerCardOrder(playerId) {
    const general = ['autosleutels', 'huissleutels', 'diploma', 'droomreis'];
    if (!playerId) {
      return [
        { id: 'date', align: 'left', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'trouwen', align: 'right', rotate: 'rotate-1', width: 'w-[184px]' },
        { id: 'autosleutels', align: 'left', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'huissleutels', align: 'right', rotate: 'rotate-2', width: 'w-[196px]' },
        { id: 'job_interview', align: 'left', rotate: '-rotate-2', width: 'w-[184px]' },
        { id: 'job_raise', align: 'right', rotate: 'rotate-1', width: 'w-[184px]' },
        { id: 'diploma', align: 'left', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'droomreis', align: 'right', rotate: 'rotate-1', width: 'w-[184px]' }
      ];
    }

    let seed = 0;
    for (let i = 0; i < playerId.length; i++) {
      seed = ((seed << 5) - seed) + playerId.charCodeAt(i);
      seed |= 0;
    }

    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed < 0 ? -seed : seed) / 233280;
    }

    // Shuffle algemene items
    const shuffledGeneral = [...general];
    for (let i = shuffledGeneral.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [shuffledGeneral[i], shuffledGeneral[j]] = [shuffledGeneral[j], shuffledGeneral[i]];
    }

    const pairA = ['job_interview', 'job_raise'];
    const pairB = ['date', 'trouwen'];
    const pickFirst = pseudoRandom() > 0.5 ? [pairA, pairB] : [pairB, pairA];

    const sequence = [
      shuffledGeneral[0],
      pickFirst[0][0],
      shuffledGeneral[1],
      pickFirst[1][0],
      shuffledGeneral[2],
      pickFirst[0][1],
      shuffledGeneral[3],
      pickFirst[1][1]
    ];

    return sequence.map((id, index) => {
      const isLeft = index % 2 === 0;
      const rot = (index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 2) * (isLeft ? -1 : 1);
      return {
        id,
        align: isLeft ? 'left' : 'right',
        rotate: rot < 0 ? `-rotate-${Math.abs(rot)}` : `rotate-${rot}`,
        width: id === 'huissleutels' ? 'w-[196px]' : 'w-[184px]'
      };
    });
  }

  // ==========================================
  // KAART RENDERING (SPEELVELD MET 8 ITEMS)
  // ==========================================
  function renderMapCards() {
    const container = document.getElementById('map-cards-container');
    if (!container) return;

    container.innerHTML = '';

    if (!state.cardOrder || state.cardOrder.length === 0) {
      state.cardOrder = getPlayerCardOrder(state.playerId);
    }

    state.cardOrder.forEach(itemConfig => {
      const item = ITEMS_DATA[itemConfig.id];
      if (!item) return;

      const isClaimedByMe = (state.claimedItems || []).includes(item.id);
      const limitedServerInfo = state.limitedItems ? state.limitedItems[item.id] : null;
      const isClaimedByOther = item.isLimited && limitedServerInfo && limitedServerInfo.claimedBy && limitedServerInfo.claimedBy !== state.playerId;
      const isLocked = (item.id === 'job_raise' || item.id === 'trouwen') && (!limitedServerInfo || limitedServerInfo.isLocked);
      const activeCooldown = (state.cooldowns || {})[item.id] || 0;

      // Exclusiviteit follow-ups:
      const intWinnerId = state.limitedItems?.job_interview?.claimedBy;
      const intWinnerName = state.limitedItems?.job_interview?.claimedByName || 'Ander';
      const isJobRaiseLockedForMe = (item.id === 'job_raise') && (
        !intWinnerId || (intWinnerId !== state.playerId) || (intWinnerId === state.playerId && isLocked)
      );

      const dateWinnerId = state.limitedItems?.date?.claimedBy;
      const dateWinnerName = state.limitedItems?.date?.claimedByName || 'Ander';
      const isTrouwenLockedForMe = (item.id === 'trouwen') && (
        !dateWinnerId || (dateWinnerId !== state.playerId) || (dateWinnerId === state.playerId && isLocked)
      );

      // Locatie onthulling check
      const isLocRevealed = !item.isLimited || !!(state.revealedLocations && state.revealedLocations[item.id]);
      const displayLocation = isLocRevealed
        ? `📍 ${item.secretLocation || item.location}`
        : '❓ Verborgen (Los Captcha op)';

      const wrap = document.createElement('div');
      wrap.className = itemConfig.align === 'left' ? 'flex justify-start pl-2' : 'flex justify-end pr-2';

      const card = document.createElement('article');
      card.className = `polaroid-card ${itemConfig.width} p-3 rounded-sm transform ${itemConfig.rotate} cursor-pointer select-none relative`;

      if (isClaimedByMe) {
        card.classList.add('polaroid-claimed');
      } else if (isClaimedByOther) {
        card.classList.add('polaroid-depleted');
      } else if (isLocked || (item.id === 'job_raise' && isJobRaiseLockedForMe) || (item.id === 'trouwen' && isTrouwenLockedForMe)) {
        card.classList.add('opacity-85');
      }

      let badgeHtml = '';
      if (isClaimedByMe) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">✓ Behaald!</span>`;
      } else if (isClaimedByOther) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">OP = OP • ${limitedServerInfo.claimedByName || 'Ander'}</span>`;
      } else if (item.id === 'job_raise' && intWinnerId && intWinnerId !== state.playerId) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">🔒 Alleen voor ${intWinnerName}</span>`;
      } else if (item.id === 'trouwen' && dateWinnerId && dateWinnerId !== state.playerId) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">🔒 Alleen voor ${dateWinnerName}</span>`;
      } else if (isLocked) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow">🔒 Vergrendeld</span>`;
      } else if (item.isLimited) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">Limited</span>`;
      }

      let innerContentHtml = '';
      if (activeCooldown > 0) {
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-rose-50 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-rose-300 text-center">
            <div class="text-xs font-bold text-stone-800 mb-0.5">${item.name}</div>
            <div class="bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[9px] text-rose-900 font-bold leading-tight">
              ⏳ Cooldown: <span class="font-mono" id="cd-display-${item.id}">${formatCooldownTime(activeCooldown)}</span>
            </div>
            <p class="text-[7px] text-rose-700 font-medium mt-1">Fout antwoord! Tik voor opties</p>
          </div>
        `;
      } else if (item.id === 'job_raise' && intWinnerId && intWinnerId !== state.playerId) {
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-stone-100 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-stone-300 text-center">
            <div class="flex items-center gap-1 text-xs font-bold text-stone-700 mb-0.5">
              <span>🔒</span> ${item.name}
            </div>
            <p class="text-[8px] text-stone-500 leading-tight">Exclusief voor ${intWinnerName}</p>
          </div>
        `;
      } else if (item.id === 'trouwen' && dateWinnerId && dateWinnerId !== state.playerId) {
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-stone-100 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-stone-300 text-center">
            <div class="flex items-center gap-1 text-xs font-bold text-stone-700 mb-0.5">
              <span>🔒</span> ${item.name}
            </div>
            <p class="text-[8px] text-stone-500 leading-tight">Exclusief voor ${dateWinnerName}</p>
          </div>
        `;
      } else if (isLocked) {
        const lockNote = item.id === 'trouwen' ? 'Ontgrendelt 1 minuut na Date' : 'Ontgrendelt 1 minuut na interview';
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-stone-100 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-stone-300 text-center">
            <div class="flex items-center gap-1 text-xs font-bold text-stone-700 mb-0.5">
              <span>🔒</span> ${item.name}
            </div>
            <p class="text-[8px] text-stone-500 leading-tight">${lockNote}</p>
          </div>
        `;
      } else {
        innerContentHtml = `
          <div class="w-full min-h-[76px] ${item.isLimited ? 'bg-amber-50/70 border-amber-200/80' : 'bg-stone-50 border-stone-200/80'} rounded-sm mb-2 p-2 flex flex-col items-center justify-center border text-center">
            <div class="flex items-center gap-1 mb-0.5">
              <span class="text-xs font-bold text-stone-900">${item.name}</span>
              ${item.isLimited ? '<span class="text-[8px] bg-amber-200 text-amber-950 font-bold px-1 rounded">1 Beschikbaar!</span>' : ''}
            </div>
            <p class="text-[10px] text-stone-600 leading-tight">${item.tag}</p>
          </div>
        `;
      }

      let clickActionText = 'Tik om te openen';
      if (isClaimedByMe) {
        clickActionText = 'Reeds behaald';
      } else if (isClaimedByOther) {
        clickActionText = 'Niet meer beschikbaar';
      } else if (item.id === 'job_raise' && intWinnerId && intWinnerId !== state.playerId) {
        clickActionText = `Alleen voor ${intWinnerName}`;
      } else if (item.id === 'trouwen' && dateWinnerId && dateWinnerId !== state.playerId) {
        clickActionText = `Alleen voor ${dateWinnerName}`;
      } else if (isLocked) {
        clickActionText = 'Timer start na vorig item';
      } else if (activeCooldown > 0) {
        clickActionText = 'Tik voor wachttijd';
      } else if (item.isLimited && !isLocRevealed) {
        clickActionText = 'Tik voor Captcha taak';
      } else {
        clickActionText = 'Tik om te openen';
      }

      card.innerHTML = `
        ${badgeHtml}
        ${innerContentHtml}
        <div class="text-center">
          <span class="text-[11px] font-semibold text-stone-700 block truncate">Locatie: ${displayLocation}</span>
          <span class="text-[9px] text-stone-500 font-medium">
            ${clickActionText}
          </span>
        </div>
      `;

      card.addEventListener('click', () => {
        handleCardClick(item);
      });

      wrap.appendChild(card);
      container.appendChild(wrap);

      if (activeCooldown > 0 && !cooldownIntervals[item.id]) {
        startLocalCooldownTimer(item.id);
      }
    });

    // Bereken het pad dat exact door alle objectives heen loopt
    setTimeout(updateAdventureTrail, 30);
    setTimeout(updateAdventureTrail, 200);
    setTimeout(updateAdventureTrail, 500);
  }

      if (activeCooldown > 0 && !cooldownIntervals[item.id]) {
        startLocalCooldownTimer(item.id);
      }
    });

    // Bereken het pad dat exact door alle objectives heen loopt
    setTimeout(updateAdventureTrail, 30);
    setTimeout(updateAdventureTrail, 200);
    setTimeout(updateAdventureTrail, 500);
  }

  // ==========================================
  // DYNAMISCH AVONTURENPAD (VERBINDT ALLE 8 OBJECTIVES)
  // ==========================================
  function updateAdventureTrail() {
    const mainEl = document.querySelector('main[data-purpose="adventure-trail-canvas"]');
    const svgEl = document.getElementById('adventure-trail-svg');
    const pathDashed = document.getElementById('trail-path-dashed');
    const pathGlow = document.getElementById('trail-path-glow');
    if (!mainEl || !svgEl || !pathDashed) return;

    const cards = document.querySelectorAll('#map-cards-container .polaroid-card');
    if (cards.length < 2) return;

    const mainRect = mainEl.getBoundingClientRect();
    if (mainRect.width === 0 || mainRect.height === 0) return;

    const points = [];
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      const cx = (r.left - mainRect.left) + r.width / 2;
      const cy = (r.top - mainRect.top) + r.height / 2;
      points.push({ x: Math.round(cx), y: Math.round(cy) });
    });

    if (points.length < 2) return;

    // Start 50px boven het eerste objective
    const p0 = points[0];
    let d = `M ${p0.x} ${Math.max(10, p0.y - 50)} L ${p0.x} ${p0.y}`;

    // Verbind elk opeenvolgend objective met een soepele S-curve door het centrum
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midY = (p1.y + p2.y) / 2;

      // Cubic bezier met controlepunten op halve hoogte
      d += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    }

    // Laat het pad nog 50px doorlopen onder het laatste objective
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y + 50}`;

    const w = Math.round(mainRect.width);
    const h = Math.round(mainRect.height);
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svgEl.style.width = w + 'px';
    svgEl.style.height = h + 'px';

    pathDashed.setAttribute('d', d);
    if (pathGlow) pathGlow.setAttribute('d', d);
  }

  function formatCooldownTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  function startLocalCooldownTimer(itemId) {
    if (cooldownIntervals[itemId]) clearInterval(cooldownIntervals[itemId]);

    cooldownIntervals[itemId] = setInterval(() => {
      // Cooldown timer staat stil tijdens doomscrollen
      if (state.inDoomscroll) return;

      if (state.cooldowns[itemId] > 0) {
        state.cooldowns[itemId]--;
        const el = document.getElementById(`cd-display-${itemId}`);
        if (el) el.textContent = formatCooldownTime(state.cooldowns[itemId]);

        const modalTimerEl = document.getElementById('modal-cooldown-timer');
        if (modalTimerEl && state.activeItemId === itemId) {
          modalTimerEl.textContent = formatCooldownTime(state.cooldowns[itemId]);
        }

        if (state.cooldowns[itemId] <= 0) {
          delete state.cooldowns[itemId];
          clearInterval(cooldownIntervals[itemId]);
          delete cooldownIntervals[itemId];
          socket.emit('player:update_cooldown', { itemId, remainingSeconds: 0 });
          renderMapCards();
          if (state.activeModal === 'COOLDOWN' && state.activeItemId === itemId) {
            closeModal();
            showToast(`Cooldown voor ${ITEMS_DATA[itemId].name} is voorbij! Je kunt het weer proberen.`, 'success');
          }
        }
      } else {
        clearInterval(cooldownIntervals[itemId]);
        delete cooldownIntervals[itemId];
      }
    }, 1000);
  }

  // ==========================================
  // KAART KLIK LOGICA
  // ==========================================
  function handleCardClick(item) {
    if (window.sounds) window.sounds.playClick();

    if ((state.claimedItems || []).includes(item.id)) {
      showToast(`Je hebt ${item.name} al verzameld!`);
      return;
    }

    const limitedInfo = state.limitedItems ? state.limitedItems[item.id] : null;
    if (item.isLimited && limitedInfo && limitedInfo.claimedBy && limitedInfo.claimedBy !== state.playerId) {
      showToast(`Helaas! ${item.name} is al gepakt door ${limitedInfo.claimedByName}. OP = OP!`, 'error');
      return;
    }

    // Exclusiviteit follow-ups:
    if (item.id === 'job_raise') {
      const intWinner = state.limitedItems?.job_interview?.claimedBy;
      const intWinnerName = state.limitedItems?.job_interview?.claimedByName || 'de winnaar van het sollicitatiegesprek';
      if (!intWinner) {
        showToast('🔒 Job Raise is vergrendeld. Er moet eerst iemand slagen voor het Job Interview!');
        return;
      }
      if (intWinner !== state.playerId) {
        showToast(`🔒 Exclusief item: alleen ${intWinnerName} (Interview winnaar) kan de Job Raise claimen!`, 'error');
        return;
      }
      if (limitedInfo && limitedInfo.isLocked) {
        showToast('⏳ Je salarisverhoging ontgrendelt zodra de aftelteller van 1 minuut klaar is!');
        return;
      }
    }

    if (item.id === 'trouwen') {
      const dateWinner = state.limitedItems?.date?.claimedBy;
      const dateWinnerName = state.limitedItems?.date?.claimedByName || 'de winnaar van de Date';
      if (!dateWinner) {
        showToast('🔒 Trouwen is vergrendeld. Er moet eerst iemand slagen voor de Date!');
        return;
      }
      if (dateWinner !== state.playerId) {
        showToast(`🔒 Exclusief item: alleen ${dateWinnerName} (Date winnaar) kan gaan Trouwen!`, 'error');
        return;
      }
      if (limitedInfo && limitedInfo.isLocked) {
        showToast('⏳ Je huwelijk ontgrendelt zodra de aftelteller van 1 minuut klaar is!');
        return;
      }
    }

    if ((item.id === 'job_raise' || item.id === 'trouwen') && (!limitedInfo || limitedInfo.isLocked)) {
      const msg = item.id === 'trouwen'
        ? '🔒 Trouwen is nog vergrendeld! Ontgrendelt 1 minuut na de Date.'
        : '🔒 Job Raise is nog vergrendeld! Ontgrendelt 1 minuut na het Job Interview.';
      showToast(msg);
      return;
    }

    if (state.cooldowns[item.id] > 0) {
      openCooldownModal(item);
      return;
    }

    // CAPTCHA Taak voor Limited Items als locatie nog verborgen is:
    if (item.isLimited && (!state.revealedLocations || !state.revealedLocations[item.id])) {
      openCaptchaLocationModal(item);
      return;
    }

    openItemDetailModal(item);
  }

  // ==========================================
  // CAPTCHA TAKEN OM VERBORGEN LOCATIES TE ONTHULLEN
  // ==========================================
  function openCaptchaLocationModal(item) {
    state.activeItemId = item.id;
    state.activeModal = 'CAPTCHA_LOCATION';

    if (item.id === 'date') {
      renderRotateCaptcha(item);
    } else if (item.id === 'job_interview') {
      renderTextCaptcha(item);
    } else if (item.id === 'job_raise') {
      renderSliderCaptcha(item);
    } else if (item.id === 'trouwen') {
      renderGridCaptcha(item);
    } else {
      renderRotateCaptcha(item);
    }

    openModal();
  }

  // CAPTCHA 1: DRAAI PUZZEL RECHTOP (DATE)
  function renderRotateCaptcha(item) {
    let currentAngle = [90, 180, 270][Math.floor(Math.random() * 3)];

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mx-auto border border-amber-300">
          <span class="material-symbols-outlined text-sm">security</span>
          <span>Menselijke Verificatie (Captcha)</span>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">Draai de afbeelding rechtop</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Draai het symbool totdat deze exact <b>rechtop (0°)</b> staat om de geheime locatie van <b>${item.name}</b> te ontgrendelen!
          </p>
        </div>

        <div class="w-36 h-36 mx-auto rounded-3xl bg-amber-50/80 border-2 border-amber-300 flex items-center justify-center shadow-inner relative overflow-hidden my-2">
          <div id="captcha-rotate-target" class="text-6xl select-none transition-transform duration-200" style="transform: rotate(${currentAngle}deg);">
            ❤️
          </div>
          <span class="absolute bottom-2 text-[10px] font-mono font-bold text-stone-500" id="captcha-angle-indicator">${currentAngle}°</span>
        </div>

        <div class="flex items-center justify-center gap-3">
          <button type="button" id="btn-rot-left" class="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 active:scale-95 transition flex items-center gap-1">
            <span class="material-symbols-outlined text-base">rotate_left</span>
            <span>-90° Links</span>
          </button>
          <button type="button" id="btn-rot-right" class="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 active:scale-95 transition flex items-center gap-1">
            <span class="material-symbols-outlined text-base">rotate_right</span>
            <span>+90° Rechts</span>
          </button>
        </div>

        <div class="pt-2 space-y-2">
          <button type="button" id="btn-verify-rotate" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Verifieer Rotatie & Onthul Locatie</span>
          </button>
          <button type="button" onclick="closeModal()" class="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-semibold">
            Annuleren
          </button>
        </div>
      </div>
    `;

    const targetEl = document.getElementById('captcha-rotate-target');
    const angleEl = document.getElementById('captcha-angle-indicator');

    document.getElementById('btn-rot-left').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      currentAngle = (currentAngle - 90 + 360) % 360;
      targetEl.style.transform = `rotate(${currentAngle}deg)`;
      angleEl.textContent = `${currentAngle}°`;
    });

    document.getElementById('btn-rot-right').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      currentAngle = (currentAngle + 90) % 360;
      targetEl.style.transform = `rotate(${currentAngle}deg)`;
      angleEl.textContent = `${currentAngle}°`;
    });

    document.getElementById('btn-verify-rotate').addEventListener('click', () => {
      if (currentAngle === 0) {
        onCaptchaSuccess(item);
      } else {
        if (window.sounds) window.sounds.playError();
        targetEl.classList.add('shake');
        setTimeout(() => targetEl.classList.remove('shake'), 400);
        showToast('Nog niet rechtop! Draai het symbool recht omhoog (0°).', 'error');
      }
    });
  }

  // CAPTCHA 2: TYPE VERVORMDE TEKST (JOB INTERVIEW)
  function renderTextCaptcha(item) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let captchaCode = '';
    for (let i = 0; i < 5; i++) {
      captchaCode += chars[Math.floor(Math.random() * chars.length)];
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mx-auto border border-blue-300">
          <span class="material-symbols-outlined text-sm">spellcheck</span>
          <span>Menselijke Verificatie (Captcha)</span>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">Typ de beveiligingscode</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Type de 5 tekens die je in de afbeelding hieronder ziet exact over om de locatie van <b>${item.name}</b> te ontgrendelen:
          </p>
        </div>

        <!-- Vervormde Captcha Graphic Box -->
        <div class="w-full h-16 bg-stone-900 rounded-2xl flex items-center justify-center font-mono text-3xl font-black text-emerald-400 select-none relative overflow-hidden border border-stone-700 shadow-inner my-2">
          <div class="absolute inset-0 opacity-25 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 0, transparent 8px);"></div>
          <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 30 Q 150 5 300 35" stroke="#10b981" stroke-width="2" fill="none"/>
            <path d="M 10 20 Q 150 45 300 20" stroke="#06b6d4" stroke-width="1.5" fill="none"/>
          </svg>
          <span class="transform -rotate-1 skew-x-6 drop-shadow-lg tracking-[8px] relative z-10">${captchaCode}</span>
        </div>

        <div class="space-y-1 text-left">
          <label class="text-[11px] font-bold text-stone-700 uppercase">Voer de 5 letters/cijfers in:</label>
          <input id="captcha-text-input" type="text" maxlength="5" placeholder="CODE..." autocomplete="off" class="w-full text-center text-xl font-mono font-black tracking-widest uppercase bg-stone-50 border-2 border-stone-300 rounded-xl py-2.5 px-3 focus:outline-none focus:border-emerald-600">
        </div>

        <div class="pt-2 space-y-2">
          <button type="button" id="btn-verify-text" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">verified</span>
            <span>Verifieer Code & Onthul Locatie</span>
          </button>
          <button type="button" onclick="closeModal()" class="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-semibold">
            Annuleren
          </button>
        </div>
      </div>
    `;

    const input = document.getElementById('captcha-text-input');
    setTimeout(() => input && input.focus(), 150);

    const verify = () => {
      const val = (input.value || '').trim().toUpperCase();
      if (val === captchaCode) {
        onCaptchaSuccess(item);
      } else {
        if (window.sounds) window.sounds.playError();
        input.classList.add('shake', 'border-rose-500');
        setTimeout(() => input.classList.remove('shake'), 400);
        showToast('Onjuiste code! Let goed op de letters en cijfers.', 'error');
      }
    };

    document.getElementById('btn-verify-text').addEventListener('click', verify);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verify();
    });
  }

  // CAPTCHA 3: SCHUIFPUZZEL NAAR DOEL (JOB RAISE)
  function renderSliderCaptcha(item) {
    const targetMin = 74;
    const targetMax = 86;

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold mx-auto border border-purple-300">
          <span class="material-symbols-outlined text-sm">extension</span>
          <span>Menselijke Verificatie (Captcha)</span>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">Schuif het puzzelstuk op zijn plek</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Schuif het stukje <b>🧩</b> precies in het groene doelvlak om de directiekamer van <b>${item.name}</b> te ontgrendelen:
          </p>
        </div>

        <!-- Slider Track Container -->
        <div class="w-full bg-stone-100 border-2 border-stone-300 rounded-2xl p-4 my-2 relative select-none">
          <div class="relative h-12 bg-stone-200 rounded-xl overflow-hidden flex items-center px-2">
            <!-- Doelvlak in het groen -->
            <div class="absolute left-[75%] top-1 bottom-1 w-10 border-2 border-dashed border-emerald-600 bg-emerald-300/40 rounded-lg flex items-center justify-center">
              <span class="text-[10px] font-bold text-emerald-800 font-mono">DOEL</span>
            </div>

            <!-- Range input slider -->
            <input id="captcha-range-slider" type="range" min="0" max="100" value="10" class="w-full h-3 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-600 z-10">
          </div>
          <div class="flex justify-between items-center text-[10px] font-bold text-stone-500 mt-2 px-1">
            <span>Start (0%)</span>
            <span id="slider-curr-val" class="font-mono text-stone-800">10%</span>
            <span>Einde (100%)</span>
          </div>
        </div>

        <div class="pt-2 space-y-2">
          <button type="button" id="btn-verify-slider" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">done_all</span>
            <span>Puzzel Vastklikken & Locatie Onthullen</span>
          </button>
          <button type="button" onclick="closeModal()" class="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-semibold">
            Annuleren
          </button>
        </div>
      </div>
    `;

    const slider = document.getElementById('captcha-range-slider');
    const valDisplay = document.getElementById('slider-curr-val');

    slider.addEventListener('input', () => {
      valDisplay.textContent = `${slider.value}%`;
    });

    document.getElementById('btn-verify-slider').addEventListener('click', () => {
      const val = parseInt(slider.value, 10);
      if (val >= targetMin && val <= targetMax) {
        onCaptchaSuccess(item);
      } else {
        if (window.sounds) window.sounds.playError();
        slider.classList.add('shake');
        setTimeout(() => slider.classList.remove('shake'), 400);
        showToast('Niet goed geplaatst! Schuif het stukje precies in het groene doelvlak (rond 80%).', 'error');
      }
    });
  }

  // CAPTCHA 4: RASTER SELECTIE (TROUWEN)
  function renderGridCaptcha(item) {
    const tiles = [
      { id: 1, icon: '💍', label: 'Trouwring', target: true },
      { id: 2, icon: '⚽', label: 'Voetbal', target: false },
      { id: 3, icon: '💐', label: 'Boeket', target: true },
      { id: 4, icon: '🍕', label: 'Pizza', target: false },
      { id: 5, icon: '🎂', label: 'Bruidstaart', target: true },
      { id: 6, icon: '🚗', label: 'Auto', target: false },
      { id: 7, icon: '🎮', label: 'Gamepad', target: false },
      { id: 8, icon: '📱', label: 'Telefoon', target: false },
      { id: 9, icon: '🎸', label: 'Gitaar', target: false }
    ];

    const selectedIds = new Set();

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold mx-auto border border-rose-300">
          <span class="material-symbols-outlined text-sm">grid_view</span>
          <span>Menselijke Verificatie (Captcha)</span>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">Selecteer alle 3 de huwelijksitems</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Tik op de <b>3 huwelijksiconen</b> (💍 Trouwring, 💐 Boeket, 🎂 Bruidstaart) om de Trouwzaal/Aula te ontgrendelen:
          </p>
        </div>

        <!-- 3x3 Raster -->
        <div class="grid grid-cols-3 gap-2 my-2 select-none" id="captcha-grid-container">
          ${tiles.map(t => `
            <button type="button" data-tile-id="${t.id}" class="captcha-tile aspect-square rounded-2xl bg-stone-100 border-2 border-stone-200 hover:bg-stone-200 flex flex-col items-center justify-center p-2 active:scale-95 transition cursor-pointer relative">
              <span class="text-3xl">${t.icon}</span>
              <span class="text-[10px] font-semibold text-stone-600 mt-1">${t.label}</span>
              <span class="captcha-check hidden absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black">✓</span>
            </button>
          `).join('')}
        </div>

        <div class="pt-2 space-y-2">
          <button type="button" id="btn-verify-grid" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Selectie Verifiëren</span>
          </button>
          <button type="button" onclick="closeModal()" class="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-semibold">
            Annuleren
          </button>
        </div>
      </div>
    `;

    const buttons = document.querySelectorAll('.captcha-tile');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        const id = parseInt(btn.dataset.tileId, 10);
        const check = btn.querySelector('.captcha-check');
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
          btn.classList.remove('border-emerald-600', 'bg-emerald-50');
          check.classList.add('hidden');
        } else {
          selectedIds.add(id);
          btn.classList.add('border-emerald-600', 'bg-emerald-50');
          check.classList.remove('hidden');
        }
      });
    });

    document.getElementById('btn-verify-grid').addEventListener('click', () => {
      const correctTargets = [1, 3, 5];
      const isCorrect = selectedIds.size === 3 && correctTargets.every(id => selectedIds.has(id));

      if (isCorrect) {
        onCaptchaSuccess(item);
      } else {
        if (window.sounds) window.sounds.playError();
        showToast('Niet juist! Tik op de Trouwring (💍), het Boeket (💐) en de Bruidstaart (🎂).', 'error');
      }
    });
  }

  // SUCCES STATUS NA OPLOSSEN CAPTCHA
  function onCaptchaSuccess(item) {
    if (window.sounds) window.sounds.playSuccess();
    if (!state.revealedLocations) state.revealedLocations = {};
    state.revealedLocations[item.id] = true;
    localStorage.setItem('doomscroll_revealed_locs', JSON.stringify(state.revealedLocations));

    const revealedLoc = item.secretLocation || item.location;
    if (ITEMS_DATA[item.id]) {
      ITEMS_DATA[item.id].location = revealedLoc;
    }

    renderMapCards();

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl p-6 text-center space-y-4 shadow-2xl border-2 border-emerald-500 animate-in zoom-in-95">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow">
          <span class="material-symbols-outlined text-4xl">verified</span>
        </div>
        <div>
          <span class="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Menselijke Verificatie Geslaagd</span>
          <h3 class="font-display text-lg font-black text-stone-900 mt-2">Geheime Vindplek Ontgrendeld!</h3>
        </div>
        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <span class="text-xs text-emerald-800 font-semibold block mb-0.5">Vindplek van ${item.name}:</span>
          <span class="text-lg font-black text-emerald-950 font-mono tracking-wide">📍 ${revealedLoc}</span>
        </div>
        <p class="text-xs text-stone-600 leading-snug">
          Ren nu snel naar <b>${revealedLoc}</b> in het gebouw, zoek de 4-cijferige fysieke code en voer hem in!
        </p>
        <div class="space-y-2 pt-2">
          <button type="button" id="btn-enter-code-now" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">pin</span>
            <span>Fysieke Code Invoeren</span>
          </button>
          <button type="button" onclick="closeModal()" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer">
            Terug naar Kaart
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-enter-code-now').addEventListener('click', () => {
      openItemDetailModal(item);
    });
  }

  // ==========================================
  // SCHERM 3: ITEM DETAIL POP-UP & 3 KNOPPEN
  // ==========================================
  function openItemDetailModal(item) {
    state.activeItemId = item.id;
    state.activeModal = 'ITEM_DETAIL';

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div class="p-6 flex flex-col items-center text-center space-y-5 bg-[#FFFDF9]">
          
          <!-- Item Badge & Naam -->
          <div class="flex flex-col items-center gap-2">
            <div class="w-14 h-14 rounded-2xl bg-[#DECDAF]/40 border border-stone-300 text-stone-800 flex items-center justify-center text-2xl shadow-xs">
              <span class="material-symbols-outlined text-[28px] text-primary" style="font-variation-settings: 'FILL' 1;">${item.icon || 'explore'}</span>
            </div>
            <div>
              <h2 class="text-lg font-bold text-stone-900">${item.name}</h2>
              <span class="text-xs text-stone-500 font-medium">Locatie: ${item.location}</span>
            </div>
          </div>

          <!-- Code Invoer Instructie -->
          <div class="w-full flex flex-col items-center space-y-2.5">
            <span class="text-xs font-bold text-stone-700">Geef de fysieke code van dit item</span>
            
            <!-- 4 Cijfers Input Boxjes -->
            <div class="flex gap-2.5 justify-center" id="code-inputs-group">
              <input type="text" maxlength="1" inputmode="numeric" class="code-digit w-12 h-14 rounded-2xl border-2 border-stone-300 bg-white text-center font-mono text-2xl font-bold text-stone-900 focus:border-primary focus:outline-none shadow-xs" data-idx="0">
              <input type="text" maxlength="1" inputmode="numeric" class="code-digit w-12 h-14 rounded-2xl border-2 border-stone-300 bg-white text-center font-mono text-2xl font-bold text-stone-900 focus:border-primary focus:outline-none shadow-xs" data-idx="1">
              <input type="text" maxlength="1" inputmode="numeric" class="code-digit w-12 h-14 rounded-2xl border-2 border-stone-300 bg-white text-center font-mono text-2xl font-bold text-stone-900 focus:border-primary focus:outline-none shadow-xs" data-idx="2">
              <input type="text" maxlength="1" inputmode="numeric" class="code-digit w-12 h-14 rounded-2xl border-2 border-stone-300 bg-white text-center font-mono text-2xl font-bold text-stone-900 focus:border-primary focus:outline-none shadow-xs" data-idx="3">
            </div>

            <!-- Snelle test-hulp knop -->
            <button type="button" onclick="window.playerApp.fillTestCode('${item.code}')" class="text-[10px] text-stone-400 hover:text-stone-700 underline font-mono">
              💡 Code testen (${item.code})
            </button>
          </div>

          <!-- DE 3 KNOPPEN UIT DE DETAILS (Alle knoppen identiek qua stijl) -->
          <div class="w-full space-y-2.5 pt-1">
            <!-- KNOP 1: Doe taak voor item -->
            <button id="btn-submit-code" type="button" onclick="window.playerApp.submitCode()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Doe taak voor item</span>
            </button>

            <!-- KNOP 2: Kijk video voor een hint -->
            <button id="btn-open-hint-video" type="button" onclick="window.playerApp.openHintVideo()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Kijk video voor een hint</span>
            </button>

            <!-- KNOP 3: Sluiten -->
            <button id="btn-close-modal" type="button" onclick="window.playerApp.closeModal()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Sluiten</span>
            </button>
          </div>

        </div>
      </div>
    `;

    openModal();
    setupDigitInputs();

    // Event listeners
    const btnSubmit = document.getElementById('btn-submit-code');
    const btnVideo = document.getElementById('btn-open-hint-video');
    const btnClose = document.getElementById('btn-close-modal');

    if (btnSubmit) btnSubmit.onclick = () => submitCode();
    if (btnVideo) btnVideo.onclick = () => openHintVideo();
    if (btnClose) btnClose.onclick = () => closeModal();
  }

  function setupDigitInputs() {
    const inputs = document.querySelectorAll('.code-digit');
    if (!inputs.length) return;

    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 1) {
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          } else {
            inputs[index].blur();
            submitCode();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        } else if (e.key === 'Enter') {
          submitCode();
        }
      });
    });

    setTimeout(() => {
      if (inputs[0]) inputs[0].focus();
    }, 100);
  }

  function fillTestCode(code) {
    const inputs = document.querySelectorAll('.code-digit');
    if (!inputs.length) return;
    const str = String(code);
    inputs.forEach((inp, idx) => {
      inp.value = str[idx] || '';
    });
    if (window.sounds) window.sounds.playClick();
  }

  function submitCode() {
    const item = ITEMS_DATA[state.activeItemId];
    if (!item) return;

    const inputs = document.querySelectorAll('.code-digit');
    let enteredCode = '';
    inputs.forEach(i => enteredCode += (i.value || ''));

    if (enteredCode.length !== 4) {
      showToast('Voer de volledige 4-cijferige code in!');
      const group = document.getElementById('code-inputs-group');
      if (group) {
        group.classList.add('shake');
        setTimeout(() => group.classList.remove('shake'), 400);
      }
      return;
    }

    socket.emit('item:verify_code', { itemId: item.id, code: enteredCode }, (res) => {
      if (res && res.success) {
        if (window.sounds) window.sounds.playSuccess();
        renderQuestionModal(item);
      } else {
        if (window.sounds) window.sounds.playError();
        showToast('Onjuiste code! Zoek de 4-cijferige code op locatie.', 'error');
        const group = document.getElementById('code-inputs-group');
        if (group) {
          group.classList.add('shake');
          setTimeout(() => group.classList.remove('shake'), 400);
        }
        inputs.forEach(i => i.value = '');
        if (inputs[0]) inputs[0].focus();
      }
    });
  }

  function openHintVideo() {
    const currentItem = state.activeItemId;
    closeModal();
    openAppFeed('TikTok', currentItem);
  }

  // ==========================================
  // SCHERM 4: VRAAG / TAAK SCHERM
  // (Regel: Geen ondertekst bij opties A-D!)
  // ==========================================
  function renderQuestionModal(item) {
    state.activeModal = 'TASK';

    let taskBodyHtml = '';
    let selectedOptionCorrect = null;

    if (item.questionType === 'amenity_filter') {
      // Huissleutels voorzieningen
      taskBodyHtml = `
        <div class="w-full space-y-3">
          <p class="text-xs font-semibold text-stone-700 text-left leading-relaxed">
            ${item.question}
          </p>
          <div class="grid grid-cols-2 gap-2" id="amenities-grid">
            ${item.amenities.map(a => `
              <button type="button" class="amenity-btn p-3 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center gap-2.5 transition active:scale-95 text-left" data-id="${a.id}" data-essential="${a.isEssential}">
                <span class="material-symbols-outlined text-primary text-xl">${a.icon || 'star'}</span>
                <span class="text-xs font-bold text-stone-800">${a.text}</span>
              </button>
            `).join('')}
          </div>
          <div class="bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 leading-tight">
            💡 <b>Instructie:</b> Tik op de overbodige luxe opties om ze door te strepen. Bewaar alleen de 4 noodzakelijke basisbehoeften!
          </div>
        </div>
      `;
    } else {
      // Meerkeuzevragen (A, B, C, D) met willekeurig geschudde volgorde ZONDER ONDERTEKST!
      const letters = ['A', 'B', 'C', 'D'];
      const shuffledOptions = [...item.options]
        .sort(() => Math.random() - 0.5)
        .map((opt, idx) => ({
          ...opt,
          letter: letters[idx] || String.fromCharCode(65 + idx)
        }));

      taskBodyHtml = `
        <div class="w-full space-y-3">
          ${item.signSvg ? `<div class="flex justify-center p-2 bg-stone-50 rounded-2xl border border-stone-200">${item.signSvg}</div>` : ''}
          ${item.imageUrl ? `
            <div class="w-full h-32 rounded-2xl overflow-hidden relative shadow-sm border border-stone-200">
              <img src="${item.imageUrl}" alt="Vraag afbeelding" class="w-full h-full object-cover">
              ${item.imageCaption ? `<span class="absolute bottom-1 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">${item.imageCaption}</span>` : ''}
            </div>
          ` : ''}
          ${item.speaker ? `<div class="text-[11px] font-bold text-primary text-left">${item.speaker}</div>` : ''}
          <p class="text-xs font-bold text-stone-800 text-left leading-snug">${item.question}</p>
          
          <div class="flex flex-col gap-2" id="quiz-options-group">
            ${shuffledOptions.map(opt => `
              <button type="button" class="quiz-option-btn w-full p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] transition flex items-center justify-between text-left" data-correct="${opt.isCorrect}">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[11px] font-bold shrink-0">${opt.letter || '•'}</span>
                  <span class="text-xs font-bold text-stone-900 leading-snug">${opt.text}</span>
                </div>
                <span class="material-symbols-outlined text-[18px] text-stone-300 status-icon">radio_button_unchecked</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        <div class="p-5 flex flex-col items-center space-y-4">
          
          <div class="flex items-center justify-between w-full border-b border-stone-200/80 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">${item.icon || 'task'}</span>
              <span class="text-sm font-bold text-stone-900">${item.name}</span>
            </div>
            ${item.isLimited ? `<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Limited</span>` : ''}
          </div>

          ${taskBodyHtml}

          <!-- Bevestig Antwoord Knoppen (Alle knoppen hetzelfde) -->
          <div class="w-full space-y-2.5 pt-2 border-t border-stone-200">
            <button id="btn-submit-task" type="button" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Antwoord Bevestigen</span>
            </button>
            <button type="button" onclick="window.playerApp.closeModal()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Annuleren</span>
            </button>
          </div>

        </div>
      </div>
    `;

    openModal();

    // Event handlers voor quiz opties
    if (item.questionType === 'amenity_filter') {
      const btns = modalContent.querySelectorAll('.amenity-btn');
      btns.forEach(b => {
        b.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          b.classList.toggle('line-through');
          b.classList.toggle('opacity-40');
          b.classList.toggle('bg-rose-50');
        });
      });
    } else {
      const optionBtns = modalContent.querySelectorAll('.quiz-option-btn');
      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          optionBtns.forEach(b => {
            b.classList.remove('border-primary', 'bg-emerald-50', 'ring-2', 'ring-primary/30');
            const icon = b.querySelector('.status-icon');
            if (icon) {
              icon.textContent = 'radio_button_unchecked';
              icon.classList.remove('text-primary');
              icon.classList.add('text-stone-300');
            }
          });

          btn.classList.add('border-primary', 'bg-emerald-50', 'ring-2', 'ring-primary/30');
          const activeIcon = btn.querySelector('.status-icon');
          if (activeIcon) {
            activeIcon.textContent = 'check_circle';
            activeIcon.classList.remove('text-stone-300');
            activeIcon.classList.add('text-primary');
          }

          selectedOptionCorrect = btn.getAttribute('data-correct') === 'true';
        });
      });
    }

    const btnSubmit = document.getElementById('btn-submit-task');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        submitTaskAnswer(item, selectedOptionCorrect);
      });
    }
  }

  function submitTaskAnswer(item, selectedOptionCorrect) {
    let isAnswerCorrect = false;

    if (item.questionType === 'amenity_filter') {
      const buttons = Array.from(document.querySelectorAll('.amenity-btn'));
      const allCorrect = buttons.every(b => {
        const isEssential = b.getAttribute('data-essential') === 'true';
        const isKept = !b.classList.contains('line-through');
        return isEssential === isKept;
      });
      isAnswerCorrect = allCorrect;
    } else {
      if (selectedOptionCorrect === null) {
        showToast('Kies eerst een antwoord!');
        return;
      }
      isAnswerCorrect = selectedOptionCorrect;
    }

    socket.emit('item:submit_task', { itemId: item.id, isCorrect: isAnswerCorrect }, (res) => {
      if (res && res.success) {
        if (window.sounds) window.sounds.playSuccess();
        closeModal();
        showToast(`🎉 Goed gedaan! "${item.name}" behaald!`, 'success');
        renderMapCards();
      } else {
        if (window.sounds) window.sounds.playError();
        closeModal();
        state.cooldowns[item.id] = 45;
        startLocalCooldownTimer(item.id);
        renderMapCards();
        openCooldownModal(item);
      }
    });
  }

  // ==========================================
  // SCHERM 5: COOLDOWN POP-UP
  // (Regel: "Je bent aan het wachten wil je op instagram")
  // ==========================================
  function openCooldownModal(item) {
    state.activeItemId = item.id;
    state.activeModal = 'COOLDOWN';

    const currentCooldown = state.cooldowns[item.id] || 45;

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 select-none">
        <div class="p-6 flex flex-col items-center text-center space-y-4 bg-[#FFFDF9]">
          
          <div class="flex justify-between items-center w-full">
            <span class="text-[11px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2.5 py-0.5 rounded-full">Straftijd / Wachten</span>
            <button type="button" onclick="window.playerApp.claimSelfControlReward()" aria-label="Sluiten" class="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-200/60 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
            </button>
          </div>

          <!-- Instagram Badge / Icoon -->
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg p-0.5">
            <div class="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <span class="text-3xl">📸</span>
            </div>
          </div>

          <div class="flex flex-col items-center space-y-1">
            <h2 class="text-lg font-black text-stone-900 leading-tight">Je bent aan het wachten...</h2>
            <p class="text-base font-extrabold text-rose-600">Wil je op Instagram?</p>
            <p class="text-[11px] text-stone-500 max-w-[270px]">Fout antwoord bij "${item.name}". Verveel je je tijdens je straftijd?</p>
          </div>

          <!-- Straftijd Klok -->
          <div class="w-full py-2.5 px-4 rounded-2xl bg-[#F2E9DA]/80 border border-stone-300 flex items-center justify-between shadow-inner">
            <span class="text-[11px] font-bold text-stone-600 uppercase tracking-wide">Resterende Wachttijd</span>
            <span id="modal-cooldown-timer" class="text-2xl font-black text-stone-900 font-mono tracking-wider">${formatCooldownTime(currentCooldown)}</span>
          </div>

          <!-- Actieknoppen (Alle knoppen identiek qua stijl, geen -15s tekst) -->
          <div class="w-full space-y-2.5 pt-1">
            <button type="button" onclick="window.playerApp.openAppFeed('Instagram')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Ja, open Instagram</span>
            </button>

            <button type="button" onclick="window.playerApp.claimSelfControlReward()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Nee, ik wacht rustig</span>
            </button>

            <button type="button" onclick="window.playerApp.claimSelfControlReward()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Sluiten</span>
            </button>
          </div>

        </div>
      </div>
    `;

    openModal();
  }

  function claimSelfControlReward() {
    const itemId = state.activeItemId;
    closeModal();
    if (!itemId) return;

    socket.emit('cooldown:reward_self_control', { itemId }, (res) => {
      if (res && res.success) {
        state.cooldowns[itemId] = res.newCooldown;
        if (window.sounds) window.sounds.playReward();
        showToast('Goed bezig! Je blijft gefocust op de speurtocht.', 'success');
        renderMapCards();
      }
    });
  }

  // ==========================================
  // SCHERM 6: SOCIAL MEDIA APPS (DOOMSCROLL TRAP)
  // (Met Gevarieerde Media, Open Source Video's & Bronvermelding)
  // ==========================================
  let igPostSeedCounter = 200;
  const igUserLikes = {};
  const igUserDislikes = {};

  function formatCount(num) {
    if (typeof num !== 'number') return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  }

  function handleGlobalLike(id, defaultLikes = 1200) {
    if (!igUserLikes[id]) igUserLikes[id] = { count: defaultLikes, liked: false };
    if (!igUserDislikes[id]) igUserDislikes[id] = { count: 35, disliked: false };

    const likeObj = igUserLikes[id];
    const disObj = igUserDislikes[id];

    if (likeObj.liked) {
      likeObj.liked = false;
      likeObj.count = Math.max(0, likeObj.count - 1);
    } else {
      likeObj.liked = true;
      likeObj.count++;
      if (window.sounds) window.sounds.playLike();

      if (disObj.disliked) {
        disObj.disliked = false;
        disObj.count = Math.max(0, disObj.count - 1);
      }
    }

    return { likeObj, disObj };
  }

  function handleGlobalDislike(id, defaultDislikes = 35) {
    if (!igUserLikes[id]) igUserLikes[id] = { count: 1200, liked: false };
    if (!igUserDislikes[id]) igUserDislikes[id] = { count: defaultDislikes, disliked: false };

    const likeObj = igUserLikes[id];
    const disObj = igUserDislikes[id];

    if (disObj.disliked) {
      disObj.disliked = false;
      disObj.count = Math.max(0, disObj.count - 1);
    } else {
      disObj.disliked = true;
      disObj.count++;
      if (window.sounds) window.sounds.playClick();

      if (likeObj.liked) {
        likeObj.liked = false;
        likeObj.count = Math.max(0, likeObj.count - 1);
      }
    }

    return { likeObj, disObj };
  }

  function toggleTikTokLike(btnEl, reelId) {
    const { likeObj, disObj } = handleGlobalLike(reelId, 18400);
    const parent = btnEl.closest('.snap-feed-item');
    if (!parent) return;

    const likeIcon = parent.querySelector('.tiktok-like-icon');
    const likeCount = parent.querySelector('.tiktok-like-count');
    const disIcon = parent.querySelector('.tiktok-dislike-icon');
    const disCount = parent.querySelector('.tiktok-dislike-count');

    if (likeIcon) {
      likeIcon.textContent = likeObj.liked ? 'favorite' : 'favorite_border';
      likeIcon.classList.toggle('text-rose-500', likeObj.liked);
      likeIcon.classList.toggle('text-white', !likeObj.liked);
      likeIcon.style.fontVariationSettings = likeObj.liked ? "'FILL' 1" : "'FILL' 0";
    }
    if (likeCount) likeCount.textContent = formatCount(likeObj.count);

    if (disIcon) {
      disIcon.classList.toggle('text-sky-400', disObj.disliked);
      disIcon.classList.toggle('text-stone-300', !disObj.disliked);
      disIcon.style.fontVariationSettings = disObj.disliked ? "'FILL' 1" : "'FILL' 0";
    }
    if (disCount) disCount.textContent = disObj.disliked ? formatCount(disObj.count) : 'Dislike';
  }

  function toggleTikTokDislike(btnEl, reelId) {
    const { likeObj, disObj } = handleGlobalDislike(reelId, 95);
    const parent = btnEl.closest('.snap-feed-item');
    if (!parent) return;

    const likeIcon = parent.querySelector('.tiktok-like-icon');
    const likeCount = parent.querySelector('.tiktok-like-count');
    const disIcon = parent.querySelector('.tiktok-dislike-icon');
    const disCount = parent.querySelector('.tiktok-dislike-count');

    if (disIcon) {
      disIcon.classList.toggle('text-sky-400', disObj.disliked);
      disIcon.classList.toggle('text-stone-300', !disObj.disliked);
      disIcon.style.fontVariationSettings = disObj.disliked ? "'FILL' 1" : "'FILL' 0";
    }
    if (disCount) disCount.textContent = disObj.disliked ? formatCount(disObj.count) : 'Dislike';

    if (likeIcon) {
      likeIcon.textContent = likeObj.liked ? 'favorite' : 'favorite_border';
      likeIcon.classList.toggle('text-rose-500', likeObj.liked);
      likeIcon.classList.toggle('text-white', !likeObj.liked);
      likeIcon.style.fontVariationSettings = likeObj.liked ? "'FILL' 1" : "'FILL' 0";
    }
    if (likeCount) likeCount.textContent = formatCount(likeObj.count);
  }

  const FEED_OPEN_VIDEOS = [
    {
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      caption: 'Time-lapse van bloeiende voorjaarsbloemen in 4K 🌸✨ Puur natuurlijk wonder! #nature #timelapse #bloemen #lente',
      user: 'botanical.shots',
      avatar: 'https://i.pravatar.cc/150?img=33',
      loc: 'Keukenhof, Lisse',
      likes: 18400,
      credits: 'Bron: Mozilla Developer Network (MDN) • Licentie: CC0 Public Domain'
    },
    {
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
      caption: 'De golven tijdens een gouden zonsondergang op vrijdagavond... 🌅🌊 Zet je geluid even aan! #sunset #ocean #relax #chill',
      user: 'sunset_vibes_nl',
      avatar: 'https://i.pravatar.cc/150?img=11',
      loc: 'Scheveningen Strand',
      likes: 42100,
      credits: 'Bron: Mozilla Open Web Media Archive • Licentie: CC0 Public Domain'
    },
    {
      url: 'https://vjs.zencdn.net/v/oceans.mp4',
      caption: 'Duik mee in de diepblauwe oceaan tussen de dolfijnen en koraalriffen 🐬🌊 Onwerkelijk mooi! #oceanlife #marinelife #deepblue',
      user: 'ocean.explorer',
      avatar: 'https://i.pravatar.cc/150?img=47',
      loc: 'Caribisch Nederland',
      likes: 56900,
      credits: 'Bron: VideoJS Oceans Open Project (Disney Nature / VideoJS) • Licentie: Open Media'
    },
    {
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'De legendarische Big Buck Bunny ontwaakt in het bos! 🐰🌳 100% gemaakt met open source 3D software! #blender3d #animation #openmovie',
      user: 'blender_open_anim',
      avatar: 'https://i.pravatar.cc/150?img=20',
      loc: 'Amsterdam 3D Studio',
      likes: 89300,
      credits: 'Bron: Blender Foundation (Big Buck Bunny) • Licentie: Creative Commons Attribution 3.0 (CC-BY 3.0)'
    },
    {
      url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      caption: 'Sintel: epische zoektocht van een dappere heldin door de besneeuwde bergen ⚔️🐉 Prachtige cinematische animatie! #sintel #openmovie #cgi',
      user: 'open_cinema_nl',
      avatar: 'https://i.pravatar.cc/150?img=53',
      loc: 'Open Media Hub',
      likes: 67400,
      credits: 'Bron: W3C / Blender Open Movie (Sintel) • Licentie: Creative Commons Attribution 3.0 (CC-BY 3.0)'
    },
    {
      url: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
      caption: 'De officiële teaser trailer van Big Buck Bunny in volle glorie! 🐰✨ Blijft een absolute klassieker. #animation #funny #nostalgia',
      user: 'bunny_animation_nl',
      avatar: 'https://i.pravatar.cc/150?img=65',
      loc: 'Utrecht Animatie',
      likes: 31200,
      credits: 'Bron: W3C HTML5 Video Test Suite • Licentie: Creative Commons Attribution (CC-BY)'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'Explosieve kleuren en vurige actie in 60fps! 🔥✨ Kijk hoe vloeiend dit loopt. #hype #visuals #action #satisfying',
      user: 'blaze_visuals',
      avatar: 'https://i.pravatar.cc/150?img=22',
      loc: 'Rotterdam Studios',
      likes: 104200,
      credits: 'Bron: Google Open Media Sample (Blazes) • Licentie: CC-BY 3.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      caption: 'Adem in, adem uit... Ultieme rust en natuurbeleving 🌿🏔️ Geluid aan voor de beste ervaring! #escape #zen #nature #soundon',
      user: 'escape_reality_nl',
      avatar: 'https://i.pravatar.cc/150?img=41',
      loc: 'Alpen Natuurgebied',
      likes: 142300,
      credits: 'Bron: Google Open Media Sample (Escapes) • Licentie: CC0 Public Domain'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      caption: 'Dit is puur genieten! 🎢🎉 Tag iemand die dit ook moet proberen! #fun #energy #viral #weekend',
      user: 'extreme_fun_nl',
      avatar: 'https://i.pravatar.cc/150?img=17',
      loc: 'Pretpark Nederland',
      likes: 98400,
      credits: 'Bron: Google Media Open Bucket • Licentie: CC-BY 2.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      caption: 'Kleurrijk vuurwerk en spectaculaire lichteffecten in de nacht 🎆✨ Pure magie! #fireworks #lights #party #festival',
      user: 'night_vibes_live',
      avatar: 'https://i.pravatar.cc/150?img=36',
      loc: 'Festivalterrein Breda',
      likes: 175600,
      credits: 'Bron: Google Open Media Sample • Licentie: CC-BY 4.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      caption: 'Wanneer je hersenen smelten van verbazing 🤯🧊 Wat gebeurt hier nou precies?! #mindblown #physics #satisfying #weird',
      user: 'science_tricks_nl',
      avatar: 'https://i.pravatar.cc/150?img=28',
      loc: 'Science Lab Delft',
      likes: 210500,
      credits: 'Bron: Google Open Media Sample • Licentie: CC0 Public Domain'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      caption: 'Sci-fi actie van wereldklasse opgenomen in het hart van Amsterdam! 🤖💥 100% Open Source film! #tearsOfSteel #blender #vfx',
      user: 'scifi_amsterdam',
      avatar: 'https://i.pravatar.cc/150?img=59',
      loc: 'Amsterdam Zuidas',
      likes: 312000,
      credits: 'Bron: Blender Foundation Open Movie Project • Licentie: CC-BY 3.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      caption: 'Vol gas over de snelweg! 🏎️💨 Luister naar dat rauwe motorgeluid met je koptelefoon op! #supercars #bullrun #soundon #adrenaline',
      user: 'speed_demons_nl',
      avatar: 'https://i.pravatar.cc/150?img=68',
      loc: 'Circuit Zandvoort',
      likes: 189400,
      credits: 'Bron: Google Open Media Sample (Bullrun) • Licentie: CC-BY 3.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      caption: 'Wat voor budgetauto koop je anno nu voor een prikkie?! 🚗💸 Je gelooft je ogen niet! #autotips #budget #challenge #funny',
      user: 'auto_experts_nl',
      avatar: 'https://i.pravatar.cc/150?img=14',
      loc: 'Automarkt Utrecht',
      likes: 122800,
      credits: 'Bron: Google Open Media Sample • Licentie: CC-BY 3.0'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      caption: 'Een bizarre reis door een reusachtige mechanische droomwereld 🐘⚙️ Eerste open movie ter wereld! #retro3d #classic #animation',
      user: 'retro_animatie_nl',
      avatar: 'https://i.pravatar.cc/150?img=49',
      loc: 'Digitale Kunstacademie',
      likes: 84300,
      credits: 'Bron: Blender Foundation (Elephants Dream) • Licentie: CC-BY 2.5'
    }
  ];

  const FAKE_DUTCH_COMMENTS = [
    { id: 'c1', user: 'lisa.kramer', avatar: 'https://i.pravatar.cc/150?img=1', text: 'Hahaha dit meen je niet 😂💀', time: '3u', likes: 24, liked: false },
    { id: 'c2', user: 'daan_vd', avatar: 'https://i.pravatar.cc/150?img=12', text: 'Waar is dit opgenomen?? Moeten we echt eens heen met z’n allen!', time: '5u', likes: 14, liked: false },
    { id: 'c3', user: 'sophie.99', avatar: 'https://i.pravatar.cc/150?img=5', text: 'Wauw, echt geweldige kwaliteit beelden 😍✨', time: '1d', likes: 38, liked: false },
    { id: 'c4', user: 'bram.student', avatar: 'https://i.pravatar.cc/150?img=8', text: 'Iemand al bij de aula geweest voor de code? 👀', time: '42m', likes: 9, liked: false },
    { id: 'c5', user: 'lars.visser', avatar: 'https://i.pravatar.cc/150?img=15', text: 'Volgende week gaan we hier ook heen gasten 🔥', time: '2u', likes: 17, liked: false }
  ];

  let activeCommentsList = [...FAKE_DUTCH_COMMENTS];

  function getRandomPicsumUrl(w = 600, h = 600) {
    igPostSeedCounter++;
    return `https://picsum.photos/seed/escape_seed_${igPostSeedCounter}/${w}/${h}`;
  }

  function getRandomAvatarUrl() {
    const avatarNum = Math.floor(Math.random() * 70) + 1;
    return `https://i.pravatar.cc/150?img=${avatarNum}`;
  }

  function openAppFeed(appName = 'Instagram', originItemId = null) {
    state.inDoomscroll = true;
    state.currentApp = appName;
    state.trapStartTime = state.trapStartTime || Date.now();

    socket.emit('player:enter_doomscroll', { itemId: originItemId, app: appName });
    if (window.sounds) window.sounds.playError();

    // Update real-time klok op het telefoonscherm
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const timeEl = document.getElementById('trap-phone-time');
    if (timeEl) timeEl.textContent = timeStr;

    showScreen('doomscrollTrap');

    const appContainer = document.getElementById('app-view-container');
    if (!appContainer) return;

    const norm = (appName || 'Instagram').toLowerCase();
    if (norm.includes('whatsapp') || norm.includes('moeder')) {
      renderWhatsAppApp(appContainer);
    } else if (norm.includes('tiktok')) {
      renderTikTokApp(appContainer);
    } else if (norm.includes('bereal')) {
      renderBeRealApp(appContainer);
    } else if (norm.includes('snapchat')) {
      renderSnapchatApp(appContainer);
    } else {
      renderInstagramApp(appContainer);
    }
  }

  // ==========================================
  // INSTAGRAM FAKE COMMENTS BOTTOM-SHEET PANEL
  // ==========================================
  function openInstagramComments(postTitle = 'Bericht', postUser = 'instagram') {
    let sheet = document.getElementById('ig-comments-bottom-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'ig-comments-bottom-sheet';
      sheet.className = 'fixed inset-x-0 bottom-0 max-w-md mx-auto z-40 bg-[#121212] text-white rounded-t-3xl shadow-2xl border-t border-stone-800 flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300';
      const container = document.getElementById('app-view-container');
      if (container) container.appendChild(sheet);
    } else {
      sheet.classList.remove('hidden');
    }

    renderCommentsContent(sheet, postTitle, postUser);
  }

  function closeInstagramComments() {
    const sheet = document.getElementById('ig-comments-bottom-sheet');
    if (sheet) {
      sheet.classList.add('hidden');
    }
  }

  function renderCommentsContent(sheet, postTitle, postUser) {
    sheet.innerHTML = `
      <!-- Drag Handle & Header -->
      <div class="pt-3 pb-2 px-4 border-b border-stone-800 flex flex-col items-center relative">
        <div class="w-10 h-1 rounded-full bg-stone-700 mb-2"></div>
        <div class="w-full flex items-center justify-between">
          <span class="w-6"></span>
          <h3 class="text-sm font-bold text-white tracking-wide">Reacties</h3>
          <button type="button" onclick="window.playerApp.closeInstagramComments()" class="text-stone-400 hover:text-white p-1">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      <!-- Reacties Lijst -->
      <div id="ig-comments-list" class="flex-1 overflow-y-auto p-4 space-y-4 text-left divide-y divide-stone-900/60">
        ${activeCommentsList.map(c => `
          <div class="pt-3 first:pt-0 flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <img src="${c.avatar}" class="w-8 h-8 rounded-full object-cover border border-stone-700 shrink-0" alt="${c.user}">
              <div class="text-xs space-y-0.5 min-w-0">
                <span class="font-bold text-white mr-1.5">${c.user}</span>
                <span class="text-stone-300 leading-snug break-words">${c.text}</span>
                <div class="flex items-center gap-3 text-[10px] text-stone-500 pt-0.5">
                  <span>${c.time}</span>
                  <span class="font-semibold">${c.likes} vind-ik-leuks</span>
                  <button type="button" class="font-semibold hover:text-white" onclick="document.getElementById('ig-comment-input').focus()">Beantwoorden</button>
                </div>
              </div>
            </div>
            <button type="button" onclick="window.playerApp.toggleCommentLike('${c.id}')" class="text-stone-400 hover:text-rose-500 pt-1 shrink-0">
              <span class="material-symbols-outlined text-[16px] ${c.liked ? 'text-rose-500' : ''}" style="${c.liked ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Reactie Invoer Balk Onderaan -->
      <div class="p-3 border-t border-stone-800 bg-[#121212] flex items-center gap-2">
        <span class="text-xl shrink-0">${state.playerAvatar || '🎒'}</span>
        <div class="flex-1 relative">
          <input id="ig-comment-input" type="text" placeholder="Plaats een reactie als @${(state.playerName || 'speler').toLowerCase().replace(/\s+/g, '_')}..." class="w-full bg-stone-900 border border-stone-800 rounded-full py-2 pl-3.5 pr-20 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-stone-600">
          <button id="ig-comment-submit" type="button" class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-40 transition">
            Plaatsen
          </button>
        </div>
      </div>
    `;

    const input = sheet.querySelector('#ig-comment-input');
    const submitBtn = sheet.querySelector('#ig-comment-submit');

    const handleSendComment = () => {
      const val = (input.value || '').trim();
      if (!val) return;

      activeCommentsList.push({
        id: 'c_' + Date.now(),
        user: (state.playerName || 'speler').toLowerCase().replace(/\s+/g, '_'),
        avatar: getRandomAvatarUrl(),
        text: val,
        time: 'Zojuist',
        likes: 0,
        liked: false
      });

      if (window.sounds) window.sounds.playSuccess();
      renderCommentsContent(sheet, postTitle, postUser);
      const listEl = document.getElementById('ig-comments-list');
      if (listEl) listEl.scrollTop = listEl.scrollHeight;
    };

    submitBtn.onclick = handleSendComment;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') handleSendComment();
    };
  }

  function toggleCommentLike(commentId) {
    const c = activeCommentsList.find(x => x.id === commentId);
    if (!c) return;
    c.liked = !c.liked;
    c.likes += c.liked ? 1 : -1;
    if (window.sounds) window.sounds.playLike();
    const sheet = document.getElementById('ig-comments-bottom-sheet');
    if (sheet) renderCommentsContent(sheet, 'Bericht', 'instagram');
  }

  // ==========================================
  // 1. INSTAGRAM TELEFOON INTERFACE
  // ==========================================
  function renderInstagramApp(container, tab = 'feed') {
    closeInstagramComments();

    if (tab === 'dm') {
      renderInstagramDM(container);
      return;
    }
    if (tab === 'explore') {
      renderInstagramExplore(container);
      return;
    }
    if (tab === 'activity') {
      renderInstagramActivity(container);
      return;
    }
    if (tab === 'profile') {
      renderInstagramProfile(container);
      return;
    }

    const stories = [
      { name: 'Je verhaal', isMe: true, img: getRandomAvatarUrl() },
      { name: 'lisa.kramer', img: getRandomAvatarUrl() },
      { name: 'daan_vd', img: getRandomAvatarUrl() },
      { name: 'sophie.99', img: getRandomAvatarUrl() },
      { name: 'travel_nl', img: getRandomAvatarUrl() },
      { name: 'fitlife_020', img: getRandomAvatarUrl() },
      { name: 'memes.daily', img: getRandomAvatarUrl() }
    ];

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <!-- Instagram Header -->
        <div class="pt-12 px-3 pb-2.5 flex items-center justify-between border-b border-stone-800 bg-black/95 sticky top-0 z-20">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow active:scale-95 transition cursor-pointer" title="Terug naar speurtocht">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>✕ Speurtocht</span>
            </button>
            <span class="font-instagram text-2xl tracking-wide text-white">Instagram</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'activity')" class="text-white hover:text-rose-500 transition" title="Meldingen">
              <span class="material-symbols-outlined text-[22px]">favorite</span>
            </button>
            <div class="relative cursor-pointer" onclick="window.playerApp.renderInstagramDM(document.getElementById('app-view-container'))" title="Direct Berichten">
              <span class="material-symbols-outlined text-[22px]">send</span>
              <span class="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">1</span>
            </div>
          </div>
        </div>

        <!-- Stories Tray (Blijft binnen Instagram!) -->
        <div class="px-3 py-3 border-b border-stone-900 flex gap-3.5 overflow-x-auto overflow-y-hidden shrink-0 no-scrollbar">
          ${stories.map((s, i) => `
            <div class="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onclick="window.playerApp.renderInstagramStory(document.getElementById('app-view-container'), '${s.name}', '${s.img}')">
              <div class="w-16 h-16 rounded-full p-0.5 ${s.isMe ? 'bg-stone-700' : 'story-ring-gradient'} flex items-center justify-center">
                <div class="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
                  <img src="${s.img}" class="w-full h-full object-cover rounded-full" alt="${s.name}">
                </div>
              </div>
              <span class="text-[10px] text-stone-300 font-medium truncate max-w-[64px]">${s.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Instagram Feed (Oneindig scrollen met video's en unieke foto's) -->
        <div id="instagram-feed-scroll" class="flex-1 overflow-y-auto divide-y divide-stone-900 pb-20">
          <!-- Dynamisch gevuld -->
        </div>

        <!-- Instagram Bottom Navigatiebalk (Geen externe apps!) -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-12 bg-black/95 backdrop-blur-md border-t border-stone-800 flex items-center justify-around z-20 px-2">
          <button type="button" class="text-white" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" title="Feed"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramExplore(document.getElementById('app-view-container'))" title="Zoeken"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(0), 'feed')" title="Reels"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramActivity(document.getElementById('app-view-container'))" title="Activiteit"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 hover:border-white cursor-pointer" onclick="window.playerApp.renderInstagramProfile(document.getElementById('app-view-container'))" title="Profiel">
            <img src="${getRandomAvatarUrl()}" class="w-full h-full object-cover" alt="Profile">
          </button>
        </div>

      </div>
    `;

    const feed = container.querySelector('#instagram-feed-scroll');
    appendInstagramPosts(feed, 4);

    feed.addEventListener('scroll', () => {
      if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 600) {
        appendInstagramPosts(feed, 3);
      }
    });
  }

  function appendInstagramPosts(feedEl, count = 3) {
    if (!feedEl) return;

    const captions = [
      'Zoveel zin in het weekend! Wie gaat er vanavond mee de stad in? 🌴✨ #vibe #weekend #explore #amsterdam',
      'Dit uitzicht verveelt echt nooit... Wat een zonsondergang vandaag! 🌅📸 #photography #wanderlust #nature',
      'Even een welverdiende koffiepauze vandaag ☕ Wat doen jullie nu? #chill #coffee #vibes',
      'Nieuwe hotspot ontdekt in de stad! Eten was echt een 10/10 🤤🍕 #foodie #lekker #lunch',
      'Geniet van de kleine momenten vandaag. Blijf gefocust en geniet! 🌸💫 #mindfulness #goodvibes'
    ];

    const users = ['sarah_v', 'lars.visser', 'emma_schutte', 'max_020', 'travel_dromen', 'nature.shots', 'bram.nl'];
    const locations = ['Amsterdam, Nederland', 'Utrecht Centraal', 'Zandvoort aan Zee', 'Rotterdam Blaak', 'Vondelpark', 'Deventer'];

    for (let i = 0; i < count; i++) {
      const postId = 'post_' + (igPostSeedCounter++);
      const isVideo = (igPostSeedCounter % 2 === 0);
      const videoData = FEED_OPEN_VIDEOS[(igPostSeedCounter) % FEED_OPEN_VIDEOS.length];

      const u = isVideo ? videoData.user : users[Math.floor(Math.random() * users.length)];
      const loc = isVideo ? videoData.loc : locations[Math.floor(Math.random() * locations.length)];
      const cap = isVideo ? videoData.caption : captions[Math.floor(Math.random() * captions.length)];
      const initialLikes = isVideo ? videoData.likes : Math.floor(Math.random() * 4500) + 120;
      const initialDislikes = Math.floor(Math.random() * 40) + 5;
      const commentsCount = Math.floor(Math.random() * 85) + 12;
      const credits = isVideo ? videoData.credits : `Bron: Picsum Photos (Seed #${igPostSeedCounter}) • Licentie: CC0 Public Domain`;
      const photoUrl = `https://picsum.photos/seed/escape_${igPostSeedCounter}/600/600`;
      const avatarUrl = isVideo ? videoData.avatar : getRandomAvatarUrl();

      igUserLikes[postId] = { count: initialLikes, liked: false };
      igUserDislikes[postId] = { count: initialDislikes, disliked: false };

      const postEl = document.createElement('article');
      postEl.className = 'w-full py-3 flex flex-col bg-black';
      postEl.id = `el-${postId}`;

      postEl.innerHTML = `
        <!-- Post Header -->
        <div class="px-3 pb-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <img src="${avatarUrl}" class="w-8 h-8 rounded-full object-cover border border-stone-700" alt="Avatar">
            <div class="flex flex-col text-left">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-white leading-none">${u}</span>
                <span class="text-stone-500 text-[10px]">•</span>
                <button type="button" class="text-[10px] font-bold text-primary hover:text-white transition cursor-pointer" onclick="window.playerApp.toggleFollowUser(this, '${u}')">Volgen</button>
              </div>
              <span class="text-[10px] text-stone-400 leading-none mt-0.5">${loc}</span>
            </div>
          </div>
          <button type="button" class="text-stone-400 hover:text-white"><span class="material-symbols-outlined text-[18px]">more_vert</span></button>
        </div>

        <!-- Post Media: Video of Unieke Foto met Double Tap -->
        <div class="relative w-full aspect-square bg-stone-950 overflow-hidden cursor-pointer photo-container">
          ${isVideo ? `
            <video src="${videoData.url}" class="w-full h-full object-cover" autoplay loop muted playsinline></video>
            <div class="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">videocam</span> Video
            </div>
          ` : `
            <img src="${photoUrl}" class="w-full h-full object-cover select-none" alt="Instagram Foto" loading="lazy">
          `}
          <div class="heart-overlay absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
            <span class="material-symbols-outlined text-8xl text-white drop-shadow-2xl" style="font-variation-settings: 'FILL' 1;">favorite</span>
          </div>
        </div>

        <!-- Interactie Knoppen: Like, Dislike, Comment, Share -->
        <div class="px-3 pt-2.5 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- LIKE KNOP -->
            <button type="button" class="ig-like-btn active:scale-125 transition text-white hover:text-rose-500 flex items-center gap-1" title="Vind ik leuk">
              <span class="material-symbols-outlined text-[24px] ig-like-icon">favorite_border</span>
            </button>
            <!-- DISLIKE KNOP -->
            <button type="button" class="ig-dislike-btn active:scale-125 transition text-stone-400 hover:text-white flex items-center gap-1" title="Vind ik niet leuk">
              <span class="material-symbols-outlined text-[24px] ig-dislike-icon">thumb_down</span>
            </button>
            <!-- COMMENT KNOP -->
            <button type="button" class="text-white hover:text-stone-300 ig-comment-btn" title="Reageer">
              <span class="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
            </button>
            <!-- SHARE KNOP -->
            <button type="button" class="text-white hover:text-stone-300 ig-share-btn" title="Delen">
              <span class="material-symbols-outlined text-[24px]">send</span>
            </button>
          </div>
          <button type="button" class="text-white hover:text-stone-300"><span class="material-symbols-outlined text-[24px]">bookmark_border</span></button>
        </div>

        <!-- Likes, Dislikes & Caption -->
        <div class="px-3 pt-1.5 text-left space-y-1">
          <div class="flex items-center gap-3 text-xs font-extrabold text-white">
            <span><span class="like-number">${initialLikes}</span> vind-ik-leuks</span>
            <span class="text-stone-500 font-normal">•</span>
            <span class="text-stone-400 font-semibold text-[11px]"><span class="dislike-number">${initialDislikes}</span> dislikes</span>
          </div>
          <p class="text-xs text-stone-200 leading-snug">
            <span class="font-bold text-white mr-1">${u}</span>${cap}
          </p>
          <span class="text-[11px] text-stone-400 block cursor-pointer hover:underline ig-view-comments-btn">Bekijk alle ${commentsCount} reacties</span>
          
          <!-- Duidelijke Bronvermelding Pill -->
          <div class="pt-1">
            <span class="text-[9px] text-stone-400 bg-stone-900/90 border border-stone-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              ℹ️ ${credits}
            </span>
          </div>
        </div>
      `;

      // Event Listeners voor dit bericht
      const photoContainer = postEl.querySelector('.photo-container');
      const heartOverlay = postEl.querySelector('.heart-overlay');
      const likeBtn = postEl.querySelector('.ig-like-btn');
      const likeIcon = postEl.querySelector('.ig-like-icon');
      const likeNum = postEl.querySelector('.like-number');
      const dislikeBtn = postEl.querySelector('.ig-dislike-btn');
      const dislikeIcon = postEl.querySelector('.ig-dislike-icon');
      const dislikeNum = postEl.querySelector('.dislike-number');
      const commentBtn = postEl.querySelector('.ig-comment-btn');
      const viewCommentsBtn = postEl.querySelector('.ig-view-comments-btn');
      const shareBtn = postEl.querySelector('.ig-share-btn');

      // Double tap op afbeelding/video
      let lastTap = 0;
      photoContainer.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTap < 350) {
          triggerLike();
          heartOverlay.classList.remove('opacity-0');
          heartOverlay.classList.add('animate-heart-pop');
          setTimeout(() => {
            heartOverlay.classList.remove('animate-heart-pop');
            heartOverlay.classList.add('opacity-0');
          }, 850);
        }
        lastTap = now;
      });

      function updatePostUI(likeObj, disObj) {
        likeIcon.textContent = likeObj.liked ? 'favorite' : 'favorite_border';
        likeIcon.classList.toggle('text-rose-500', likeObj.liked);
        likeIcon.classList.toggle('text-white', !likeObj.liked);
        likeIcon.style.fontVariationSettings = likeObj.liked ? "'FILL' 1" : "'FILL' 0";
        likeNum.textContent = formatCount(likeObj.count);

        dislikeIcon.classList.toggle('text-sky-400', disObj.disliked);
        dislikeIcon.classList.toggle('text-stone-400', !disObj.disliked);
        dislikeIcon.style.fontVariationSettings = disObj.disliked ? "'FILL' 1" : "'FILL' 0";
        dislikeNum.textContent = formatCount(disObj.count);
      }

      function triggerLike() {
        if (!igUserLikes[postId]) igUserLikes[postId] = { count: initialLikes, liked: false };
        if (!igUserLikes[postId].liked) {
          const { likeObj, disObj } = handleGlobalLike(postId, initialLikes);
          updatePostUI(likeObj, disObj);
        }
      }

      likeBtn.onclick = () => {
        const { likeObj, disObj } = handleGlobalLike(postId, initialLikes);
        updatePostUI(likeObj, disObj);
      };

      dislikeBtn.onclick = () => {
        const { likeObj, disObj } = handleGlobalDislike(postId, initialDislikes);
        updatePostUI(likeObj, disObj);
      };

      commentBtn.addEventListener('click', () => openInstagramComments(cap, u));
      viewCommentsBtn.addEventListener('click', () => openInstagramComments(cap, u));
      shareBtn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        showToast('Link gekopieerd naar klembord! 📋');
      });

      feedEl.appendChild(postEl);
    }
  }

  // DIRECT MESSAGES (OVERZICHT MET MOEDER, SARAH EN LARS)
  function renderInstagramDM(container, activeChat = 'inbox') {
    closeInstagramComments();

    if (activeChat === 'moeder') {
      renderInstagramChatMoeder(container);
      return;
    }
    if (activeChat === 'sarah') {
      renderInstagramChatSarah(container);
      return;
    }

    // INBOX OVERZICHT MET ALLE BERICHTEN (INCLUSIEF BERICHT VAN MOEDER)
    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        
        <!-- DM Inbox Header met Terugknop naar Feed -->
        <div class="pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300 p-1 flex items-center gap-1 font-bold text-sm cursor-pointer" title="Terug naar feed">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <span class="font-bold text-sm">@${(state.playerName || 'speler').toLowerCase().replace(/\s+/g, '_')}</span>
            <span class="material-symbols-outlined text-xs text-stone-400">expand_more</span>
          </div>
          <div class="flex items-center gap-3 text-stone-300">
            <span class="material-symbols-outlined text-[22px]">video_call</span>
            <span class="material-symbols-outlined text-[22px]">edit_square</span>
          </div>
        </div>

        <!-- Zoekbalk -->
        <div class="p-3 bg-stone-950 border-b border-stone-900">
          <div class="flex items-center gap-2 bg-stone-900 rounded-xl px-3 py-1.5 border border-stone-800">
            <span class="material-symbols-outlined text-stone-500 text-base">search</span>
            <input type="text" placeholder="Zoeken" class="bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none w-full">
          </div>
        </div>

        <!-- DM Berichten Lijst -->
        <div class="flex-1 overflow-y-auto divide-y divide-stone-900/60 text-left">
          
          <!-- BERICHT VAN MOEDER (Bovenaan & Ongelezen) -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group bg-stone-950" onclick="window.playerApp.renderInstagramChatMoeder(document.getElementById('app-view-container'))">
            <div class="relative w-13 h-13 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-0.5 shrink-0">
              <div class="w-full h-full rounded-full bg-emerald-800 flex items-center justify-center text-2xl shadow">👩</div>
              <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white group-hover:text-rose-400 transition truncate">Moeder ❤️</span>
                <span class="text-[10px] text-blue-400 font-semibold">Zojuist</span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p class="text-xs text-white font-medium truncate pr-2">Vergeet je fietssleutels straks niet mee te nemen! ❤️</p>
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              </div>
            </div>
          </div>

          <!-- BERICHT VAN SARAH VAN DIJK (Met Reel) -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group" onclick="window.playerApp.renderInstagramChatSarah(document.getElementById('app-view-container'))">
            <div class="relative w-13 h-13 rounded-full bg-stone-700 p-0.5 shrink-0">
              <img src="https://i.pravatar.cc/150?img=49" class="w-full h-full rounded-full object-cover" alt="Sarah">
              <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white group-hover:text-rose-400 transition truncate">Sarah van Dijk</span>
                <span class="text-[10px] text-stone-400">2 min</span>
              </div>
              <p class="text-xs text-stone-400 truncate mt-0.5">🎬 Heeft een video gedeeld • Funny Bunny 🐰</p>
            </div>
          </div>

          <!-- BERICHT VAN LARS VISSER -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group opacity-85" onclick="window.playerApp.renderInstagramChatMoeder(document.getElementById('app-view-container'))">
            <div class="w-13 h-13 rounded-full bg-stone-800 p-0.5 shrink-0">
              <img src="https://i.pravatar.cc/150?img=15" class="w-full h-full rounded-full object-cover" alt="Lars">
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white group-hover:text-rose-400 transition truncate">Lars Visser</span>
                <span class="text-[10px] text-stone-400">10 min</span>
              </div>
              <p class="text-xs text-stone-400 truncate mt-0.5">Ben jij nu ook in de kantine?? Ik zag je net lopen!</p>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // CHAT MET MOEDER (MET DUIDELIJKE TERUGKNOP NAAR INBOX & SPEURTOCHT)
  function renderInstagramChatMoeder(container) {
    closeInstagramComments();
    const sharedPhoto = getRandomPicsumUrl(500, 400);

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        
        <!-- Chat Header met Terugknop naar Inbox & Snelle terugkeer naar Speurtocht -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.renderInstagramDM(document.getElementById('app-view-container'), 'inbox')" class="text-white hover:text-stone-300 p-1 flex items-center gap-1 font-bold text-sm cursor-pointer" title="Terug naar berichten">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-lg shadow">👩</div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Moeder ❤️</span>
              <span class="text-[10px] text-emerald-400 font-semibold">● Nu actief</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold shadow active:scale-95 transition flex items-center gap-1 cursor-pointer">
              <span>✕ Speurtocht</span>
            </button>
          </div>
        </div>

        <!-- Chat Berichten -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800 shadow">
            Vergeet je fietssleutels straks niet mee te nemen! En hoe gaat de speurtocht? ❤️
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:30</span>
          </div>

          <!-- KLIKBARE REEL / FOTO VAN OMA MET TERUGKEER NAAR DEZE CHAT -->
          <div class="max-w-[85%] rounded-2xl rounded-tl-none bg-stone-900 border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-emerald-400 transition transform active:scale-95 group" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(2), 'moeder')">
            <div class="relative w-full h-44 bg-black overflow-hidden">
              <img src="${sharedPhoto}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="Foto van Oma">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-black/75 border border-white/50 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition">
                  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
              <span class="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                🎬 Reel van Oma • 0:15
              </span>
              <span class="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <span>Tik om Reel te kijken</span>
                <span class="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
            <div class="p-2.5 text-xs text-stone-200">
              <p class="font-medium">Kijk deze foto die oma net stuurde! 😂</p>
              <span class="text-[9px] text-stone-500 block text-right mt-1">12:32</span>
            </div>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800 shadow">
            Doe je best lieverd! Geen TikTok kijken tijdens de speurtocht hè 😉
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:33</span>
          </div>
        </div>

        <!-- DM Antwoord Input -->
        <div class="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
          <input type="text" placeholder="Bericht sturen aan Moeder..." class="flex-1 bg-stone-900 border border-stone-800 rounded-full py-2.5 px-4 text-xs text-white placeholder-stone-500 focus:outline-none">
          <button type="button" class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold" onclick="if(window.sounds) window.sounds.playClick()">
            <span class="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>

      </div>
    `;
  }

  // CHAT MET SARAH (MET DE REEL EN TERUGKNOP NAAR INBOX & SPEURTOCHT)
  function renderInstagramChatSarah(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        
        <!-- DM Header met Terugknop naar Inbox & Speurtocht -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.renderInstagramDM(document.getElementById('app-view-container'), 'inbox')" class="text-white hover:text-stone-300 p-1 flex items-center gap-1 font-bold text-sm cursor-pointer" title="Terug naar berichten">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-0.5 flex items-center justify-center">
              <img src="https://i.pravatar.cc/150?img=49" class="w-full h-full rounded-full object-cover" alt="Sarah">
            </div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Sarah van Dijk</span>
              <span class="text-[10px] text-emerald-400 font-semibold">● Nu actief</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold shadow active:scale-95 transition flex items-center gap-1 cursor-pointer">
              <span>✕ Speurtocht</span>
            </button>
          </div>
        </div>

        <!-- Chat Berichten -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800">
            Hey! Ben je nu met die speurtocht bezig? 😂
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:31</span>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800">
            Kijk deze reel die ik net zag! Je gaat echt stuk 😂👇
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:32</span>
          </div>

          <!-- GEDEELDE REEL KAART (KLIKBAAR MET TERUGMOGELIJKHEID NAAR DEZE CHAT!) -->
          <div class="max-w-[85%] rounded-2xl bg-stone-900/90 border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-white transition transform active:scale-95 group" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(3), 'dm')">
            <div class="relative w-full aspect-video bg-black overflow-hidden">
              <img src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover group-hover:scale-105 transition" alt="Reel poster">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white shadow-lg">
                  <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
              <span class="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                🎬 Reel • 0:15
              </span>
            </div>
            <div class="p-3 text-left space-y-1">
              <div class="text-xs font-bold text-white leading-tight">Blender Open Animation • Funny Bunny 🐰</div>
              <div class="text-[10px] text-stone-400">@blender_open_anim • 89.3K vind-ik-leuks</div>
              <div class="text-[10px] text-blue-400 font-bold pt-1 flex items-center gap-1">
                <span>Tik om video te bekijken</span>
                <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
              </div>
            </div>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800">
            Kijk hem af voor je verder zoekt naar de codes haha!
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:33</span>
          </div>
        </div>

        <!-- DM Antwoord Input -->
        <div class="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
          <input type="text" placeholder="Bericht sturen..." class="flex-1 bg-stone-900 border border-stone-800 rounded-full py-2.5 px-4 text-xs text-white placeholder-stone-500 focus:outline-none">
          <button type="button" class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold" onclick="if(window.sounds) window.sounds.playClick()">
            <span class="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>

      </div>
    `;
  }

  // REELS WEERGAVE MET TERUGKNOP NAAR DM OF FEED & VOLLEDIGE VIDEO MET GELUID
  function renderInstagramReel(container, reelData, returnView = 'dm') {
    closeInstagramComments();
    const reel = reelData || FEED_OPEN_VIDEOS[3];
    const reelId = 'reel_' + (reel.user || 'video');

    if (!igUserLikes[reelId]) igUserLikes[reelId] = { count: reel.likes || 45200, liked: false };
    if (!igUserDislikes[reelId]) igUserDislikes[reelId] = { count: 320, disliked: false };

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none overflow-hidden">
        
        <!-- Video Achtergrond Loop -->
        <div class="absolute inset-0 z-0 bg-black">
          <video id="active-reel-video" src="${reel.url}" class="w-full h-full object-cover" autoplay loop playsinline></video>
          <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>
        </div>

        <!-- Header Bovenin met Duidelijke TERUGKNOPPEN & VOLGENDE KNOP! -->
        <div class="relative z-20 pt-12 px-3 pb-2 flex items-center justify-between gap-2">
          <button type="button" id="reel-back-btn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:bg-black/80 active:scale-95 transition">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar ${returnView === 'whatsapp' ? 'WhatsApp' : returnView === 'feed' ? 'Feed' : 'Chat'}</span>
          </button>

          <button type="button" onclick="window.playerApp.exitTrap()" class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:bg-rose-700 active:scale-95 transition" title="Terug naar de speurtocht">
            <span>✕ Speurtocht</span>
          </button>
          
          <button type="button" id="reel-next-btn" onclick="window.playerApp.nextInstagramReel(document.getElementById('app-view-container'), '${returnView}')" class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:bg-black/80 active:scale-95 transition cursor-pointer" title="Volgende reel bekijken">
            <span>Volgende</span>
            <span class="material-symbols-outlined text-sm">skip_next</span>
          </button>

          <button type="button" id="reel-mute-btn" class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20" title="Geluid aan/uitzetten">
            <span class="material-symbols-outlined text-[18px]" id="reel-mute-icon">volume_up</span>
          </button>
        </div>

        <div class="flex-1"></div>

        <!-- Video Info & Actieknoppen Onderin -->
        <div class="relative z-20 pb-16 px-4 flex items-end justify-between">
          <div class="max-w-[75%] space-y-2 text-left">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white drop-shadow">${reel.user || '@blender_open_anim'}</span>
              <button type="button" id="reel-follow-btn" class="border border-white/70 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white hover:bg-white hover:text-black transition cursor-pointer" onclick="window.playerApp.toggleFollowUser(this, '${reel.user || '@blender_open_anim'}')">
                ${isUserFollowed(reel.user || '@blender_open_anim') ? '✓ Volgend' : 'Volgen'}
              </button>
            </div>
            <p class="text-xs text-white drop-shadow-md leading-snug">${reel.caption}</p>
            
            <div class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-stone-200">
              <span class="material-symbols-outlined text-[13px] text-emerald-400">music_note</span>
              <span class="truncate">Origineel geluid - Open Source Audio</span>
            </div>

            <!-- Bronvermelding Pill -->
            <div class="pt-0.5">
              <span class="text-[9px] text-stone-300 bg-black/75 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                ℹ️ ${reel.credits}
              </span>
            </div>
          </div>

          <!-- Actieknoppen Rechts: Like, Dislike, Comment, Deel -->
          <div class="flex flex-col items-center gap-3">
            <!-- LIKE -->
            <button type="button" id="btn-reel-like" class="flex flex-col items-center active:scale-125 transition text-white">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl ${igUserLikes[reelId].liked ? 'text-rose-500' : 'text-white'}" id="reel-like-icon" style="${igUserLikes[reelId].liked ? "font-variation-settings: 'FILL' 1;" : "font-variation-settings: 'FILL' 0;"}">${igUserLikes[reelId].liked ? 'favorite' : 'favorite_border'}</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow" id="reel-like-count">${formatCount(igUserLikes[reelId].count)}</span>
            </button>

            <!-- DISLIKE -->
            <button type="button" id="btn-reel-dislike" class="flex flex-col items-center active:scale-125 transition text-white">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl ${igUserDislikes[reelId].disliked ? 'text-sky-400' : 'text-stone-300'}" id="reel-dislike-icon" style="${igUserDislikes[reelId].disliked ? "font-variation-settings: 'FILL' 1;" : "font-variation-settings: 'FILL' 0;"}">thumb_down</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow" id="reel-dislike-count">${igUserDislikes[reelId].disliked ? formatCount(igUserDislikes[reelId].count) : 'Dislike'}</span>
            </button>

            <!-- COMMENT -->
            <button type="button" id="btn-reel-comment" class="flex flex-col items-center active:scale-125 transition text-white">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">chat_bubble</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow">1.4K</span>
            </button>

            <!-- SHARE -->
            <button type="button" id="btn-reel-share" class="flex flex-col items-center active:scale-125 transition text-white">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">share</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow">Deel</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // Event Listeners voor Reel
    const backBtn = document.getElementById('reel-back-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        if (returnView === 'moeder') {
          renderInstagramChatMoeder(container);
        } else if (returnView === 'whatsapp') {
          renderWhatsAppApp(container);
        } else if (returnView === 'explore') {
          renderInstagramExplore(container);
        } else if (returnView === 'dm') {
          renderInstagramChatSarah(container);
        } else {
          renderInstagramApp(container, 'feed');
        }
      };
    }

    const vid = document.getElementById('active-reel-video');
    const muteBtn = document.getElementById('reel-mute-btn');
    const muteIcon = document.getElementById('reel-mute-icon');
    let muted = false;

    if (vid) {
      vid.muted = false;
      vid.volume = 0.85;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          muted = true;
          if (muteIcon) muteIcon.textContent = 'volume_off';
        });
      }
    }

    if (muteBtn && vid) {
      muteBtn.onclick = () => {
        muted = !muted;
        vid.muted = muted;
        if (!muted) {
          vid.volume = 0.85;
          vid.play().catch(() => {});
        }
        if (muteIcon) muteIcon.textContent = muted ? 'volume_off' : 'volume_up';
      };
    }

    const likeBtn = document.getElementById('btn-reel-like');
    const likeIcon = document.getElementById('reel-like-icon');
    const likeCount = document.getElementById('reel-like-count');
    const dislikeBtn = document.getElementById('btn-reel-dislike');
    const dislikeIcon = document.getElementById('reel-dislike-icon');
    const dislikeCount = document.getElementById('reel-dislike-count');

    function updateReelActionUI() {
      const lObj = igUserLikes[reelId];
      const dObj = igUserDislikes[reelId];
      if (likeIcon) {
        likeIcon.textContent = lObj.liked ? 'favorite' : 'favorite_border';
        likeIcon.classList.toggle('text-rose-500', lObj.liked);
        likeIcon.classList.toggle('text-white', !lObj.liked);
        likeIcon.style.fontVariationSettings = lObj.liked ? "'FILL' 1" : "'FILL' 0";
      }
      if (likeCount) likeCount.textContent = formatCount(lObj.count);

      if (dislikeIcon) {
        dislikeIcon.classList.toggle('text-sky-400', dObj.disliked);
        dislikeIcon.classList.toggle('text-stone-300', !dObj.disliked);
        dislikeIcon.style.fontVariationSettings = dObj.disliked ? "'FILL' 1" : "'FILL' 0";
      }
      if (dislikeCount) dislikeCount.textContent = dObj.disliked ? formatCount(dObj.count) : 'Dislike';
    }

    if (likeBtn) {
      likeBtn.onclick = () => {
        handleGlobalLike(reelId, reel.likes || 45200);
        updateReelActionUI();
      };
    }

    if (dislikeBtn) {
      dislikeBtn.onclick = () => {
        handleGlobalDislike(reelId, 320);
        updateReelActionUI();
      };
    }

    const commentBtn = document.getElementById('btn-reel-comment');
    if (commentBtn) commentBtn.onclick = () => openInstagramComments(reel.caption, reel.user);

    const shareBtn = document.getElementById('btn-reel-share');
    if (shareBtn) {
      shareBtn.onclick = () => {
        if (window.sounds) window.sounds.playClick();
        showToast('Reel link gekopieerd! 📋');
      };
    }
  }

  // INSTAGRAM STORY VIEWER (BLIJFT BINNEN INSTAGRAM!)
  function renderInstagramStory(container, storyUser, storyAvatar) {
    closeInstagramComments();
    const storyImg = getRandomPicsumUrl(600, 900);

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <!-- Story Foto -->
        <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${storyImg}')">
          <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
        </div>

        <!-- Story Top Bar met Progress & User -->
        <div class="relative z-20 pt-12 px-4 space-y-2">
          <div class="w-full h-1 bg-white/30 rounded-full overflow-hidden">
            <div class="h-full bg-white animate-story-progress" style="animation: storyTimer 5s linear forwards;"></div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img src="${storyAvatar}" class="w-8 h-8 rounded-full border border-white" alt="Avatar">
              <span class="text-xs font-bold text-white drop-shadow">${storyUser}</span>
              <span class="text-[10px] text-stone-300">2u</span>
            </div>
            <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300 p-1">
              <span class="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        <div class="flex-1"></div>

        <!-- Story Onderkant -->
        <div class="relative z-20 pb-8 px-4 flex items-center gap-3">
          <div class="flex-1 py-2.5 px-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs text-stone-300 text-left">
            Reageer op ${storyUser}...
          </div>
          <button type="button" onclick="if(window.sounds) window.sounds.playLike()" class="text-white hover:text-rose-500">
            <span class="material-symbols-outlined text-2xl">favorite</span>
          </button>
          <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300">
            <span class="material-symbols-outlined text-2xl">send</span>
          </button>
        </div>

      </div>
    `;
  }

  // INSTAGRAM EXPLORE TAB
  function renderInstagramExplore(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        <!-- Explore Search Bar met Terugknop -->
        <div class="pt-12 px-4 pb-2.5 bg-black/95 sticky top-0 z-20 border-b border-stone-800 flex items-center gap-2">
          <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300 p-1 flex items-center justify-center cursor-pointer" title="Terug naar feed">
            <span class="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div class="flex-1 flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <span class="material-symbols-outlined text-stone-400 text-lg">search</span>
            <input type="text" placeholder="Zoeken naar mensen, reels, audio..." class="bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none w-full">
          </div>
        </div>

        <!-- Explore Grid van Foto's en Video's -->
        <div class="flex-1 overflow-y-auto grid grid-cols-3 gap-0.5 pb-20">
          ${Array.from({ length: 15 }).map((_, idx) => `
            <div class="aspect-square bg-stone-900 overflow-hidden relative cursor-pointer hover:opacity-90" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(${idx}), 'explore')">
              <img src="${getRandomPicsumUrl(300, 300)}" class="w-full h-full object-cover" alt="Explore">
              ${idx % 3 === 0 ? `<span class="material-symbols-outlined absolute top-1.5 right-1.5 text-white text-sm drop-shadow">movie</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Bottom Nav -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-12 bg-black/95 backdrop-blur-md border-t border-stone-800 flex items-center justify-around z-20 px-2">
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-white"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(0), 'feed')"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramActivity(document.getElementById('app-view-container'))"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 cursor-pointer" onclick="window.playerApp.renderInstagramProfile(document.getElementById('app-view-container'))">
            <img src="${getRandomAvatarUrl()}" class="w-full h-full object-cover" alt="Profile">
          </button>
        </div>
      </div>
    `;
  }

  // INSTAGRAM ACTIVITEIT TAB
  function renderInstagramActivity(container) {
    closeInstagramComments();

    const notifications = [
      { user: 'lisa.kramer', action: 'heeft je foto geliket.', time: '2u', avatar: 'https://i.pravatar.cc/150?img=1' },
      { user: 'daan_vd', action: 'heeft gereageerd: "Echt ziek!"', time: '4u', avatar: 'https://i.pravatar.cc/150?img=12' },
      { user: 'sophie.99', action: 'is je gaan volgen.', time: '1d', avatar: 'https://i.pravatar.cc/150?img=5' },
      { user: 'bram.student', action: 'heeft je getagd in een bericht.', time: '1d', avatar: 'https://i.pravatar.cc/150?img=8' },
      { user: 'lars.visser', action: 'heeft je foto geliket.', time: '2d', avatar: 'https://i.pravatar.cc/150?img=15' }
    ];

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        <div class="pt-12 px-4 pb-3 border-b border-stone-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300 p-1 flex items-center justify-center cursor-pointer" title="Terug naar feed">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h2 class="text-lg font-bold text-white">Meldingen</h2>
          </div>
          <span class="text-xs text-stone-400 font-semibold">Filter</span>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4 text-left divide-y divide-stone-900 pb-20">
          <div class="text-xs font-bold text-stone-400 uppercase tracking-wider">Vandaag & Eerder</div>
          ${notifications.map(n => `
            <div class="pt-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img src="${n.avatar}" class="w-10 h-10 rounded-full object-cover" alt="${n.user}">
                <div class="text-xs text-left">
                  <span class="font-bold text-white">${n.user}</span>
                  <span class="text-stone-300"> ${n.action}</span>
                  <span class="text-[10px] text-stone-500 block">${n.time}</span>
                </div>
              </div>
              <button type="button" class="px-3 py-1 bg-stone-800 rounded-lg text-xs font-bold text-white hover:bg-stone-700">Bekijken</button>
            </div>
          `).join('')}
        </div>

        <!-- Bottom Nav -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-12 bg-black/95 backdrop-blur-md border-t border-stone-800 flex items-center justify-around z-20 px-2">
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramExplore(document.getElementById('app-view-container'))"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(0), 'feed')"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-white"><span class="material-symbols-outlined text-2xl">favorite</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 cursor-pointer" onclick="window.playerApp.renderInstagramProfile(document.getElementById('app-view-container'))">
            <img src="${getRandomAvatarUrl()}" class="w-full h-full object-cover" alt="Profile">
          </button>
        </div>
      </div>
    `;
  }

  // INSTAGRAM PROFIEL TAB (MET VERPLICHTE TERUGKNOP NAAR FEED & SPEURTOCHT)
  function renderInstagramProfile(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-black border-b border-stone-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')" class="text-white hover:text-stone-300 p-1 flex items-center gap-1 font-bold text-sm cursor-pointer" title="Terug naar feed">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <span class="font-bold text-sm">@${(state.playerName || 'speler').toLowerCase().replace(/\s+/g, '_')}</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold shadow active:scale-95 transition flex items-center gap-1 cursor-pointer">
              <span>✕ Speurtocht</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pb-20">
          <div class="p-4 flex items-center justify-between">
            <div class="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5">
              <div class="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl">
                ${state.playerAvatar || '🎒'}
              </div>
            </div>
            <div class="flex items-center gap-6 text-center">
              <div><span class="font-bold text-sm block">12</span><span class="text-[10px] text-stone-400">Berichten</span></div>
              <div class="cursor-pointer" onclick="window.playerApp.openFollowingListModal()"><span class="font-bold text-sm block">642</span><span class="text-[10px] text-stone-400 hover:text-white">Volgers</span></div>
              <div class="cursor-pointer" onclick="window.playerApp.openFollowingListModal()"><span class="font-bold text-sm block" id="profile-following-count">489</span><span class="text-[10px] text-emerald-400 font-bold hover:text-emerald-300">Volgend</span></div>
            </div>
          </div>

          <div class="px-4 text-left space-y-1">
            <div class="font-bold text-xs">${state.playerName || 'Speler'}</div>
            <div class="text-[11px] text-stone-300">Deelnemer aan Speurtocht voor de Toekomst 🚀</div>
          </div>

          <!-- Profiel Grid -->
          <div class="mt-4 border-t border-stone-800 grid grid-cols-3 gap-0.5">
            ${Array.from({ length: 9 }).map(() => `
              <div class="aspect-square bg-stone-900 overflow-hidden">
                <img src="${getRandomPicsumUrl(300, 300)}" class="w-full h-full object-cover" alt="Post">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bottom Nav -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-12 bg-black/95 backdrop-blur-md border-t border-stone-800 flex items-center justify-around z-20 px-2">
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramApp(document.getElementById('app-view-container'), 'feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramExplore(document.getElementById('app-view-container'))"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(0), 'feed')"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.renderInstagramActivity(document.getElementById('app-view-container'))"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border-2 border-white cursor-pointer">
            <img src="${getRandomAvatarUrl()}" class="w-full h-full object-cover" alt="Profile">
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // FOLLOW SYSTEM & VOLGEND / VOOR JOU BEHEER
  // ==========================================
  const followedUsers = new Set(['@sarah_vd', '@lars.visser', '@moeder_official', '@nature_timelapse']);

  function isUserFollowed(username) {
    if (!username) return false;
    const clean = username.trim().toLowerCase();
    for (const u of followedUsers) {
      if (u.toLowerCase() === clean || clean.includes(u.toLowerCase().replace('@', ''))) return true;
    }
    return false;
  }

  function toggleFollowUser(btnEl, username) {
    if (!username) return;
    const isNow = isUserFollowed(username);

    if (isNow) {
      // Ontvolgen
      followedUsers.delete(username);
      for (const u of followedUsers) {
        if (u.toLowerCase() === username.toLowerCase()) followedUsers.delete(u);
      }
      if (btnEl) {
        btnEl.textContent = btnEl.classList.contains('tiktok-follow-btn') ? '+ Volgen' : 'Volgen';
        btnEl.classList.remove('bg-stone-800', 'text-stone-200', 'border-stone-600');
        if (btnEl.classList.contains('tiktok-follow-btn')) {
          btnEl.classList.add('bg-rose-600', 'text-white');
        } else {
          btnEl.classList.add('border-white/70', 'text-white');
        }
      }
      if (window.sounds) window.sounds.playClick();
      showToast(`Je volgt ${username} niet meer.`);
    } else {
      // Volgen
      followedUsers.add(username);
      if (btnEl) {
        btnEl.textContent = '✓ Volgend';
        btnEl.classList.remove('bg-rose-600', 'hover:bg-rose-700');
        btnEl.classList.add('bg-stone-800', 'text-stone-200', 'border', 'border-stone-600');
      }
      if (window.sounds) window.sounds.playReward();
      showToast(`Je volgt nu ${username}!`, 'success');
    }

    const profCount = document.getElementById('profile-following-count');
    if (profCount) profCount.textContent = 485 + followedUsers.size;
  }

  let currentReelIndex = 0;
  function nextInstagramReel(container, returnView = 'dm') {
    currentReelIndex = (currentReelIndex + 1) % FEED_OPEN_VIDEOS.length;
    renderInstagramReel(container, FEED_OPEN_VIDEOS[currentReelIndex], returnView);
    if (window.sounds) window.sounds.playClick();
  }

  function scrollToNextTikTokReel() {
    const feed = document.getElementById('tiktok-feed-scroll');
    if (!feed) return;
    feed.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    if (window.sounds) window.sounds.playClick();
  }

  // 2. TIKTOK REELS INTERFACE (MET WERKEND VOLGEND / VOOR JOU TABBLAD & 100% OPEN SOURCE VIDEO'S)
  let currentTikTokTab = 'foryou';

  function renderTikTokApp(container, activeTab = 'foryou') {
    currentTikTokTab = activeTab;
    const isFollowingTab = (activeTab === 'following');

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <!-- TikTok Tabs Bovenin (Volgend & Voor jou interactief + Terugknop naar Speurtocht) -->
        <div class="pt-12 pb-2 px-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 to-transparent sticky top-0">
          <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg active:scale-95 transition cursor-pointer" title="Terug naar speurtocht">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>✕ Speurtocht</span>
          </button>
          
          <div class="flex items-center gap-6 text-sm font-bold">
            <button type="button" id="tab-tiktok-following" onclick="window.playerApp.renderTikTokApp(document.getElementById('app-view-container'), 'following')" class="${isFollowingTab ? 'text-white border-b-2 border-white pb-0.5' : 'text-stone-400 hover:text-white'} transition cursor-pointer">
              Volgend
            </button>
            <button type="button" id="tab-tiktok-foryou" onclick="window.playerApp.renderTikTokApp(document.getElementById('app-view-container'), 'foryou')" class="${!isFollowingTab ? 'text-white border-b-2 border-white pb-0.5' : 'text-stone-400 hover:text-white'} transition cursor-pointer">
              Voor jou
            </button>
          </div>

          <button type="button" onclick="window.playerApp.toggleTikTokAudio(this)" class="w-8 h-8 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition" title="Geluid aan/uitzetten">
            <span class="material-symbols-outlined text-[18px] tiktok-audio-top-icon ${state.reelsMuted ? 'text-stone-400' : 'text-amber-400'}">${state.reelsMuted ? 'volume_off' : 'volume_up'}</span>
          </button>
        </div>

        ${isFollowingTab ? `
          <div class="px-4 py-1.5 bg-stone-900/90 border-b border-stone-800 text-[11px] text-stone-300 text-center flex items-center justify-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Video's & updates van accounts die je volgt</span>
          </div>
        ` : ''}

        <!-- Verticale Scroll Feed (Oneindig door te scrollen) -->
        <div id="tiktok-feed-scroll" class="flex-1 overflow-y-scroll snap-y snap-mandatory select-none">
          <!-- Dynamisch gevuld met 100% video's -->
        </div>

        <!-- Handige 'Volgende video' zwevende knop voor snelle navigatie -->
        <button type="button" onclick="window.playerApp.scrollToNextTikTokReel()" class="fixed bottom-4 right-4 z-30 px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xl hover:bg-black active:scale-95 transition cursor-pointer">
          <span>Volgende video</span>
          <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
        </button>

      </div>
    `;

    const feed = container.querySelector('#tiktok-feed-scroll');
    appendTikTokReels(feed, 4, isFollowingTab);

    feed.addEventListener('scroll', () => {
      if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 600) {
        appendTikTokReels(feed, 3, isFollowingTab);
      }
    });
  }

  function toggleTikTokAudio(btn) {
    state.reelsMuted = !state.reelsMuted;
    const vids = document.querySelectorAll('.tiktok-video-el, #active-reel-video');
    vids.forEach(v => {
      v.muted = state.reelsMuted;
      if (!state.reelsMuted) {
        v.volume = 0.85;
        v.play().catch(() => {});
      }
    });

    // Update alle audio icons op scherm
    document.querySelectorAll('.tiktok-audio-icon, .tiktok-audio-top-icon, #reel-mute-icon').forEach(ic => {
      ic.textContent = state.reelsMuted ? 'volume_off' : 'volume_up';
      if (ic.classList.contains('tiktok-audio-icon')) {
        ic.className = `material-symbols-outlined text-2xl tiktok-audio-icon ${state.reelsMuted ? 'text-stone-400' : 'text-amber-400'}`;
      }
      if (ic.classList.contains('tiktok-audio-top-icon')) {
        ic.className = `material-symbols-outlined text-[18px] tiktok-audio-top-icon ${state.reelsMuted ? 'text-stone-400' : 'text-amber-400'}`;
      }
    });

    document.querySelectorAll('.tiktok-audio-text').forEach(t => {
      t.textContent = state.reelsMuted ? 'Dempen' : 'Geluid';
    });

    showToast(state.reelsMuted ? '🔇 Video geluid gedempt' : '🔊 Video geluid aangezet!', 'info');
  }

  function appendTikTokReels(feedEl, count = 3, isFollowingTab = false) {
    if (!feedEl) return;
    
    // Gecombineerde catalogus van 100% werkende open-source video's met geluid
    const allReelMedia = [
      ...OPENSOURCE_MEDIA_CATALOG.filter(m => !!m.videoUrl),
      ...FEED_OPEN_VIDEOS.map((f, idx) => ({
        id: 'feed_vid_' + idx,
        creator: '@' + f.user,
        caption: f.caption,
        sound: 'Origineel Geluid - Open Media Audio',
        videoUrl: f.url,
        credits: f.credits,
        comments: '2.4K'
      }))
    ];

    for (let i = 0; i < count; i++) {
      const media = allReelMedia[Math.floor(Math.random() * allReelMedia.length)];
      const creator = isFollowingTab ? (i % 2 === 0 ? '@sarah_vd' : media.creator) : media.creator;
      const isFollowed = isUserFollowed(creator) || isFollowingTab;
      const reelEl = document.createElement('div');
      reelEl.className = 'snap-feed-item relative w-full h-screen shrink-0 flex flex-col justify-between overflow-hidden bg-black select-none';

      // Unieke id en startwaardes voor like & dislike
      const reelId = 'tiktok_' + (media.id || i) + '_' + Math.random().toString(36).substring(2, 7);
      const defaultLikes = Math.floor(Math.random() * 30000 + 5000);
      const defaultDislikes = Math.floor(Math.random() * 80 + 15);
      if (!igUserLikes[reelId]) igUserLikes[reelId] = { count: defaultLikes, liked: false };
      if (!igUserDislikes[reelId]) igUserDislikes[reelId] = { count: defaultDislikes, disliked: false };

      const videoUrl = media.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

      reelEl.innerHTML = `
        <div class="absolute inset-0 bg-black">
          <video src="${videoUrl}" class="tiktok-video-el w-full h-full object-cover" autoplay loop ${state.reelsMuted ? 'muted' : ''} playsinline></video>
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>
        </div>

        <div class="h-20"></div>

        <div class="relative z-20 pb-16 px-4 flex items-end justify-between">
          <div class="max-w-[75%] space-y-2 text-left">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white drop-shadow">${creator}</span>
              <button type="button" class="tiktok-follow-btn text-[10px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer ${isFollowed ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'bg-rose-600 hover:bg-rose-700 text-white'}" onclick="window.playerApp.toggleFollowUser(this, '${creator}')">
                ${isFollowed ? '✓ Volgend' : '+ Volgen'}
              </button>
            </div>
            <p class="text-xs text-white drop-shadow leading-snug">${media.caption}</p>
            <div class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-stone-200">
              <span class="material-symbols-outlined text-[13px] text-emerald-400">music_note</span>
              <span class="truncate">${media.sound}</span>
            </div>

            <!-- Bronvermelding -->
            <div class="pt-0.5">
              <span class="text-[9px] text-stone-300 bg-black/75 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                ℹ️ ${media.credits}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-center gap-3.5">
            <!-- LIKE -->
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.toggleTikTokLike(this, '${reelId}')">
              <div class="w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl tiktok-like-icon text-white" style="font-variation-settings: 'FILL' 0;">favorite_border</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow tiktok-like-count">${formatCount(igUserLikes[reelId].count)}</span>
            </button>

            <!-- DISLIKE -->
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.toggleTikTokDislike(this, '${reelId}')">
              <div class="w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl tiktok-dislike-icon text-stone-300" style="font-variation-settings: 'FILL' 0;">thumb_down</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow tiktok-dislike-count">Dislike</span>
            </button>

            <!-- GELUID AAN/UIT -->
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.toggleTikTokAudio(this)" title="Geluid aan/uitzetten">
              <div class="w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl tiktok-audio-icon ${state.reelsMuted ? 'text-stone-400' : 'text-amber-400'}">${state.reelsMuted ? 'volume_off' : 'volume_up'}</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow tiktok-audio-text">${state.reelsMuted ? 'Dempen' : 'Geluid'}</span>
            </button>

            <!-- COMMENT -->
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.openInstagramComments('${media.caption.replace(/'/g, "\\'")}', '${creator}')">
              <div class="w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">chat_bubble</span>
              </div>
              <span class="text-[10px] font-bold mt-1">${media.comments}</span>
            </button>

            <!-- SHARE -->
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.showShareMock()">
              <div class="w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">share</span>
              </div>
              <span class="text-[10px] font-bold mt-1">Deel</span>
            </button>
          </div>
        </div>
      `;

      feedEl.appendChild(reelEl);

      // Start video playback met geluid
      const vid = reelEl.querySelector('.tiktok-video-el');
      if (vid) {
        vid.muted = state.reelsMuted;
        vid.volume = 0.85;
        const p = vid.play();
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay vereist interactie op mobiel -> val terug op muted
            vid.muted = true;
          });
        }
      }
    }
  }

  // OVERZICHT VAN VOLGEND LIJST IN INSTAGRAM PROFIEL
  function openFollowingListModal() {
    let sheet = document.getElementById('following-list-modal');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'following-list-modal';
      sheet.className = 'fixed inset-x-0 bottom-0 max-w-md mx-auto z-40 bg-[#121212] text-white rounded-t-3xl shadow-2xl border-t border-stone-800 flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300 select-none';
      const container = document.getElementById('app-view-container');
      if (container) container.appendChild(sheet);
    } else {
      sheet.classList.remove('hidden');
    }

    const accounts = [
      { u: '@sarah_vd', n: 'Sarah van Dijk', desc: 'Goede vriendin ✨' },
      { u: '@lars.visser', n: 'Lars Visser', desc: 'Teamgenoot ⚽' },
      { u: '@moeder_official', n: 'Moeder ❤️', desc: 'Familie' },
      { u: '@nature_timelapse', n: 'Botanical Bloom NL', desc: 'Natuur & time-lapse' },
      { u: '@beach_vibes_nl', n: 'Sunset Ocean Beats', desc: 'Muziek & video' },
      { u: '@blender_simulations', n: 'Fluid 3D Studios', desc: 'Open Source CGI' }
    ];

    sheet.innerHTML = `
      <div class="pt-3 pb-2 px-4 border-b border-stone-800 flex items-center justify-between">
        <span class="w-6"></span>
        <h3 class="text-sm font-bold text-white">Volgend (${accounts.length})</h3>
        <button type="button" onclick="document.getElementById('following-list-modal').classList.add('hidden')" class="text-stone-400 hover:text-white p-1">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-900">
        ${accounts.map(acc => {
          const isF = isUserFollowed(acc.u);
          return `
            <div class="pt-2.5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center font-bold text-sm">
                  ${acc.u.slice(1, 3).toUpperCase()}
                </div>
                <div class="text-left text-xs">
                  <div class="font-bold text-white">${acc.u}</div>
                  <div class="text-[11px] text-stone-400">${acc.n} • ${acc.desc}</div>
                </div>
              </div>
              <button type="button" class="px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${isF ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'bg-rose-600 text-white'}" onclick="window.playerApp.toggleFollowUser(this, '${acc.u}')">
                ${isF ? '✓ Volgend' : 'Volgen'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 3. BEREAL APP INTERFACE
  function renderBeRealApp(container) {
    const mainPhoto = getRandomPicsumUrl(600, 800);
    const selfiePhoto = getRandomPicsumUrl(300, 400);

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto overflow-y-auto select-none">
        
        <!-- BeReal Header met Terugknop naar Speurtocht -->
        <div class="sticky top-0 z-30 pt-12 px-3 pb-2.5 bg-black/95 backdrop-blur-md flex items-center justify-between border-b border-stone-800">
          <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer active:scale-95 transition" title="Terug naar speurtocht">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>✕ Speurtocht</span>
          </button>
          
          <div class="flex flex-col items-center">
            <span class="font-extrabold text-xl tracking-tighter text-white">BeReal.</span>
            <span class="text-[10px] text-amber-400 font-bold">⚠️ 2 min te laat</span>
          </div>

          <div class="w-16"></div>
        </div>

        <div class="p-4 flex-1">
          <!-- Dual Camera Beeld -->
          <div class="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-900 mb-4">
            <!-- Grote Achtercamera Foto -->
            <img src="${mainPhoto}" class="w-full h-full object-cover" alt="Main Photo">

            <!-- Kleine Voorkant Selfie Foto Linksboven -->
            <div class="absolute top-4 left-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-black shadow-2xl bg-black">
              <img src="${selfiePhoto}" class="w-full h-full object-cover" alt="Selfie">
            </div>

            <div class="absolute bottom-3 left-4 text-left">
              <span class="text-xs font-bold text-white block">@lisa.kramer</span>
              <span class="text-[10px] text-stone-300">Buiten in het park • 2m te laat 🌿</span>
            </div>
          </div>

          <!-- RealMojis Reactiebalk -->
          <div class="flex items-center justify-around py-3 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 mb-6">
            <button type="button" class="text-2xl active:scale-125 transition" onclick="if(window.sounds) window.sounds.playLike()">👍</button>
            <button type="button" class="text-2xl active:scale-125 transition" onclick="if(window.sounds) window.sounds.playLike()">😂</button>
            <button type="button" class="text-2xl active:scale-125 transition" onclick="if(window.sounds) window.sounds.playLike()">😲</button>
            <button type="button" class="text-2xl active:scale-125 transition" onclick="if(window.sounds) window.sounds.playLike()">😍</button>
            <button type="button" class="text-2xl active:scale-125 transition" onclick="if(window.sounds) window.sounds.playCameraShutter()">⚡</button>
          </div>

          <button type="button" onclick="window.playerApp.openAppFeed('Instagram')" class="w-full py-3 bg-stone-800 rounded-xl text-xs font-bold text-white">
            Wissel naar Instagram Feed 📸
          </button>
        </div>

      </div>
    `;
  }

  // 4. SNAPCHAT INTERFACE
  function renderSnapchatApp(container) {
    const snapPhoto = getRandomPicsumUrl(600, 900);

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <div class="absolute top-12 left-0 right-0 z-20 px-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pb-4">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer active:scale-95 transition" title="Terug naar speurtocht">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>✕ Speurtocht</span>
            </button>
            <div class="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs">👻</div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white leading-tight">Daan van Dijk</span>
              <span class="text-[9px] text-amber-300 font-bold">🔥 56 Dagen Streak!</span>
            </div>
          </div>
          <span class="text-xs font-mono text-stone-300">Nu</span>
        </div>

        <div class="relative w-full h-full flex-1">
          <img src="${snapPhoto}" class="w-full h-full object-cover" alt="Snap">
          <!-- Karakteristieke zwarte Snapchat tekstbalk -->
          <div class="absolute top-1/2 left-0 right-0 bg-black/60 py-2.5 px-4 text-center">
            <p class="text-xs font-bold text-white tracking-wide">Speurtocht is bezig, wie heeft autosleutels gevonden?? 😂</p>
          </div>
        </div>

        <div class="absolute bottom-6 left-4 right-4 z-20 flex items-center gap-2">
          <div class="flex-1 py-2.5 px-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs text-stone-300 text-left">
            Stuur een chat...
          </div>
          <button type="button" class="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold" onclick="if(window.sounds) window.sounds.playCameraShutter()">
            📷
          </button>
        </div>

      </div>
    `;
  }

  // 5. WHATSAPP CHAT INTERFACE (MET BERICHT VAN MOEDER EN DUIDELIJKE TERUGKNOP)
  function renderWhatsAppApp(container) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-[#0b141a] text-white max-w-md mx-auto select-none">
        
        <!-- WhatsApp Header met Terugknop naar Chats & Speurtocht -->
        <div class="sticky top-0 z-30 pt-12 px-3 pb-3 bg-[#202c33] flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-2 min-w-0">
            <button type="button" onclick="window.playerApp.renderWhatsAppChats(document.getElementById('app-view-container'))" class="text-white hover:text-stone-300 p-1.5 -ml-1 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer transition shrink-0" title="Terug naar chats">
              <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-lg font-bold shadow shrink-0">👩</div>
            <div class="flex flex-col text-left min-w-0">
              <span class="text-xs font-bold text-white truncate">Moeder ❤️</span>
              <span class="text-[10px] text-emerald-400 font-medium">online</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer active:scale-95 transition" title="Terug naar speurtocht">
              <span>✕ Speurtocht</span>
            </button>
          </div>
        </div>

        <!-- Chat Berichten van Moeder -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-[#202c33] text-xs text-stone-100 shadow">
            Vergeet je fietssleutels straks niet mee te nemen! En hoe gaat de speurtocht? ❤️
            <span class="text-[9px] text-stone-400 block text-right mt-1">12:30</span>
          </div>

          <!-- KLIKBARE REEL / VIDEO VAN OMA MET TERUGKEER NAAR WHATSAPP -->
          <div class="max-w-[85%] rounded-2xl rounded-tl-none bg-[#202c33] border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-[#00a884] transition transform active:scale-95 group" onclick="window.playerApp.renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(2), 'whatsapp')">
            <div class="relative w-full h-44 bg-black overflow-hidden">
              <video src="${FEED_OPEN_VIDEOS[2].url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" autoplay loop muted playsinline></video>
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-black/75 border border-white/50 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition">
                  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
              <span class="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                🎬 Open Source Video
              </span>
              <span class="absolute bottom-2 right-2 bg-[#00a884] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <span>Bekijk video</span>
                <span class="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
            <div class="p-2.5 text-xs text-stone-100">
              <p class="font-medium">Kijk deze video die oma net stuurde! 😂</p>
              <span class="text-[9px] text-stone-400 block text-right mt-1">12:32</span>
            </div>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-[#202c33] text-xs text-stone-100 shadow">
            Doe je best lieverd! Geen TikTok kijken tijdens het speuren hoor 😉
            <span class="text-[9px] text-stone-400 block text-right mt-1">12:33</span>
          </div>
        </div>

        <!-- Input balk -->
        <div class="p-3 bg-[#202c33] flex items-center gap-2">
          <input type="text" placeholder="Typ een bericht aan Moeder..." class="flex-1 bg-[#2a3942] border border-transparent rounded-full py-2 px-3 text-xs text-white placeholder-stone-400 focus:outline-none">
          <div class="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white cursor-pointer" onclick="if(window.sounds) window.sounds.playClick()">
            <span class="material-symbols-outlined text-[18px]">send</span>
          </div>
        </div>

      </div>
    `;
  }

  // WHATSAPP CHATS OVERZICHT (INBOX) MET TERUGKNOP NAAR SPEL
  function renderWhatsAppChats(container) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-[#0b141a] text-white max-w-md mx-auto select-none">
        
        <!-- WhatsApp Inbox Header met Terugknop naar Speurtocht -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-[#202c33] flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.exitTrap()" class="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer active:scale-95 transition" title="Sluit WhatsApp">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>✕ Speurtocht</span>
            </button>
            <span class="text-base font-bold text-white ml-2">WhatsApp</span>
          </div>
          <div class="flex items-center gap-3 text-stone-300">
            <span class="material-symbols-outlined text-[20px]">photo_camera</span>
            <span class="material-symbols-outlined text-[20px]">search</span>
            <span class="material-symbols-outlined text-[20px]">more_vert</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-[#202c33] px-4 flex items-center border-b border-stone-800 text-xs font-bold">
          <div class="flex-1 py-2.5 text-center text-[#00a884] border-b-2 border-[#00a884]">CHATS (1)</div>
          <div class="flex-1 py-2.5 text-center text-stone-400">STATUS</div>
          <div class="flex-1 py-2.5 text-center text-stone-400">OPROEPEN</div>
        </div>

        <!-- Chats Lijst -->
        <div class="flex-1 overflow-y-auto divide-y divide-stone-800/60 text-left">
          
          <!-- Chat 1: Moeder (Nieuw bericht!) -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-[#202c33]/50 cursor-pointer transition active:scale-[0.99]" onclick="window.playerApp.renderWhatsAppApp(document.getElementById('app-view-container'))">
            <div class="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-2xl shadow shrink-0">👩</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Moeder ❤️</span>
                <span class="text-[10px] text-[#00a884] font-semibold">12:32</span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p class="text-xs text-stone-300 truncate pr-2">Kijk deze video die oma net stuurde! 😂</p>
                <span class="w-5 h-5 rounded-full bg-[#00a884] text-black text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              </div>
            </div>
          </div>

          <!-- Chat 2: Familie App -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-[#202c33]/50 cursor-pointer transition active:scale-[0.99]" onclick="window.playerApp.renderWhatsAppApp(document.getElementById('app-view-container'))">
            <div class="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-2xl shadow shrink-0">👨‍👩‍👧‍👦</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Familie App ❤️</span>
                <span class="text-[10px] text-stone-400 font-semibold">11:45</span>
              </div>
              <p class="text-xs text-stone-400 truncate mt-0.5">Oma: "Veel succes vandaag schat! 🍀"</p>
            </div>
          </div>

          <!-- Chat 3: Groepsapp -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-[#202c33]/50 cursor-pointer transition opacity-70">
            <div class="w-12 h-12 rounded-full bg-sky-700 flex items-center justify-center text-2xl shadow shrink-0">⚡</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Speurtocht Groepsapp</span>
                <span class="text-[10px] text-stone-400 font-semibold">10:15</span>
              </div>
              <p class="text-xs text-stone-400 truncate mt-0.5">Daan: "Denk aan de klok, blijf gefocust!"</p>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  function exitTrap() {
    const secondsSpent = Math.round((Date.now() - (state.trapStartTime || Date.now())) / 1000);
    state.inDoomscroll = false;
    socket.emit('player:exit_doomscroll', { secondsSpent });
    screens.doomscrollTrap.classList.add('hidden');
    showScreen('gameplay');
    if (window.sounds) window.sounds.playClick();
  }

  function setupTrapExitHandler() {
    const exitBtn = document.getElementById('trap-exit-btn');
    if (!exitBtn) return;

    exitBtn.addEventListener('click', () => {
      const secondsSpent = Math.round((Date.now() - (state.trapStartTime || Date.now())) / 1000);
      state.inDoomscroll = false;
      socket.emit('player:exit_doomscroll', { secondsSpent });
      screens.doomscrollTrap.classList.add('hidden');
      showScreen('gameplay');
      if (window.sounds) window.sounds.playClick();
    });
  }

  // ==========================================
  // VOLLEDIG SCHERM & INGEZOOMD OP MOBIEL
  // ==========================================
  let isZoomedActive = false;

  function isCurrentlyFullscreen() {
    return isZoomedActive || !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.body.classList.contains('zoom-mode'));
  }

  function updateFullscreenIcons() {
    const isFs = isCurrentlyFullscreen();
    const icons = document.querySelectorAll('.fullscreen-icon-elem');
    icons.forEach(icon => {
      icon.textContent = isFs ? 'zoom_out' : 'zoom_in';
    });

    const fsText = document.getElementById('fullscreen-text');
    if (fsText) fsText.textContent = isFs ? 'Klein' : 'Groot';

    const loginText = document.getElementById('login-fullscreen-text');
    if (loginText) loginText.textContent = isFs ? 'Normaal' : 'Groot scherm';

    const lobbyText = document.getElementById('lobby-fullscreen-text');
    if (lobbyText) lobbyText.textContent = isFs ? 'Normaal' : 'Groot scherm';
  }

  function toggleFullScreen() {
    isZoomedActive = !isZoomedActive;
    const docEl = document.documentElement;

    // 1. Visuele zoom modus (vergroot de kaarten en inhoud tot rand van de telefoon)
    if (isZoomedActive) {
      document.body.classList.add('zoom-mode');
      document.body.classList.add('app-fullscreen');
    } else {
      document.body.classList.remove('zoom-mode');
      document.body.classList.remove('app-fullscreen');
    }

    // 2. Hardware / Browser Native Fullscreen (voor Android Chrome, tablet en desktop)
    try {
      const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      if (isZoomedActive && !isNativeFs) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (document.body.webkitRequestFullscreen) {
          document.body.webkitRequestFullscreen();
        }
      } else if (!isZoomedActive && isNativeFs) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Native Fullscreen API niet ondersteund door browser:', e);
    }

    // 3. Update alle knoppen en teksten
    updateFullscreenIcons();

    // 4. Feedback voor de gebruiker (met tip voor iOS Safari)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isZoomedActive) {
      if (isIOS && !window.navigator.standalone) {
        showToast('🔍 Ingezoomd! (Tip: Safari Deel ➔ Zet op beginscherm)');
      } else {
        showToast('🔍 Groot scherm & Ingezoomd!');
      }
    } else {
      showToast('🔎 Normaal schermformaat');
    }

    // 5. Herbereken de stippellijn direct voor de nieuwe afmetingen
    setTimeout(updateAdventureTrail, 60);
    setTimeout(updateAdventureTrail, 200);
    setTimeout(updateAdventureTrail, 500);
  }

  function setupFullscreenHandler() {
    const fsBtns = [
      document.getElementById('btn-fullscreen-toggle'),
      document.getElementById('btn-login-fullscreen'),
      document.getElementById('btn-lobby-fullscreen')
    ];

    fsBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.sounds) window.sounds.playClick();
          toggleFullScreen();
        });
      }
    });

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, () => {
        const nativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (nativeFs) {
          isZoomedActive = true;
          document.body.classList.add('zoom-mode');
          document.body.classList.add('app-fullscreen');
        } else {
          // Als de gebruiker hardwarematig fullscreen verlaat
          isZoomedActive = false;
          document.body.classList.remove('zoom-mode');
          document.body.classList.remove('app-fullscreen');
        }
        updateFullscreenIcons();
        setTimeout(updateAdventureTrail, 80);
        setTimeout(updateAdventureTrail, 300);
      });
    });
  }

  // ==========================================
  // SPELREGELS & MODALS
  // ==========================================
  function setupRulesHandler() {
    const rulesBtn = document.getElementById('btn-open-rules');
    if (rulesBtn) {
      rulesBtn.addEventListener('click', () => {
        state.activeModal = 'RULES';
        modalContent.innerHTML = `
          <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 p-6 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div class="flex items-center justify-between border-b border-stone-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">📜</span>
                <h3 class="font-display text-base font-bold text-stone-900">Spelregels & Uitleg</h3>
              </div>
              <button onclick="window.playerApp.closeModal()" class="text-stone-400 hover:text-stone-800 p-1">✕</button>
            </div>

            <div class="space-y-3 text-xs text-stone-700 leading-relaxed">
              <p><b>1. Doel van het spel:</b> Verzamel zo veel mogelijk items voor de 15 minuten voorbij zijn!</p>
              <p><b>2. Algemene Items:</b> Iedereen kan deze behalen.</p>
              <p><b>3. Limited Items:</b> Slechts gelimiteerd beschikbaar.</p>
              <p><b>4. Vervolgitems:</b> "Job Raise" ontgrendelt na het Job Interview. "Trouwen" ontgrendelt na de Date!</p>
              <p><b>5. Focus:</b> Blijf gefocust zonder je te laten afleiden door social media.</p>
            </div>

            <button type="button" onclick="window.playerApp.closeModal()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Begrepen, terug naar kaart</span>
            </button>
          </div>
        `;
        openModal();
      });
    }

    const locsBtn = document.getElementById('btn-mobile-view-locations');
    if (locsBtn) {
      locsBtn.addEventListener('click', () => {
        state.activeModal = 'LOCATIONS';
        const items = Object.values(ITEMS_DATA);
        modalContent.innerHTML = `
          <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 p-6 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div class="flex items-center justify-between border-b border-stone-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-xl">pin_drop</span>
                <h3 class="font-display text-base font-bold text-stone-900">Fysieke Vindplekken</h3>
              </div>
              <button onclick="window.playerApp.closeModal()" class="text-stone-400 hover:text-stone-800 p-1">✕</button>
            </div>

            <p class="text-xs text-stone-600">Ga fysiek naar deze locaties in het gebouw om de codes te vinden:</p>

            <div class="space-y-2">
              ${items.map(item => `
                <div class="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined text-primary text-base">${item.icon || 'explore'}</span>
                    <span class="text-xs font-bold text-stone-900 truncate">${item.name}</span>
                  </div>
                  <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    📍 ${item.location}
                  </span>
                </div>
              `).join('')}
            </div>

            <button type="button" onclick="window.playerApp.closeModal()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Sluiten</span>
            </button>
          </div>
        `;
        openModal();
      });
    }
  }

  function setupBackdropDismiss() {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        handleModalDismiss();
      }
    });
  }

  function handleModalDismiss() {
    if (state.activeModal === 'COOLDOWN') {
      claimSelfControlReward();
    } else {
      closeModal();
    }
  }

  function openModal() {
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    state.activeModal = null;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const borderCol = type === 'error' ? 'border-rose-500' : type === 'success' ? 'border-emerald-500' : type === 'warning' ? 'border-amber-500' : 'border-stone-700';
    toast.className = `fixed bottom-16 left-4 right-4 z-50 p-3.5 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border ${borderCol} flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto select-none`;
    toast.innerHTML = `
      <span class="flex-1 mr-2">${message}</span>
      <button type="button" class="text-stone-400 hover:text-white p-1">✕</button>
    `;
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  function showGameOverScreen(data) {
    document.getElementById('game-over-reason').textContent = data.reason;
    document.getElementById('final-player-score').textContent = `${state.score} pt`;
    document.getElementById('final-player-items').textContent = `${(state.claimedItems || []).length} / 8`;
    document.getElementById('final-self-control').textContent = `${state.stats.selfControlRewards || 0}x`;
    document.getElementById('final-doomscroll-time').textContent = `${state.stats.doomscrollSeconds || 0}s`;

    showScreen('gameOver');
  }

  // ==========================================
  // GLOBALE EXPORT VOOR INLINE HANDLERS
  // ==========================================
  window.playerApp = {
    submitCode,
    openHintVideo,
    closeModal,
    openAppFeed,
    claimSelfControlReward,
    fillTestCode,
    openInstagramComments,
    closeInstagramComments,
    toggleCommentLike,
    renderInstagramApp,
    renderInstagramDM,
    renderInstagramChatMoeder,
    renderInstagramChatSarah,
    renderInstagramReel,
    renderInstagramStory,
    renderInstagramExplore,
    renderInstagramActivity,
    renderInstagramProfile,
    renderWhatsAppApp,
    renderWhatsAppChats,
    renderTikTokApp,
    toggleFollowUser,
    isUserFollowed,
    nextInstagramReel,
    scrollToNextTikTokReel,
    openFollowingListModal,
    exitTrap,
    getFeedVideo: (idx) => FEED_OPEN_VIDEOS[idx % FEED_OPEN_VIDEOS.length],
    toggleTikTokLike,
    toggleTikTokDislike,
    toggleTikTokAudio,
    updateAdventureTrail,
    toggleFullScreen,
    showCommentMock: () => openInstagramComments('Bericht', 'instagram'),
    showShareMock: () => {
      if (window.sounds) window.sounds.playClick();
      showToast('🔗 Deellink gekopieerd naar klembord!');
    }
  };

  // Start initialisatie wanneer DOM gereed is
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
