// Player App State & Controller voor Doomscroll Escape (v5)
(function () {
  let socket = null;
  try {
    if (typeof io !== 'undefined') {
      socket = io();
    }
  } catch (e) {
    console.warn('Socket.IO initialisatiefout:', e);
  }

  // Veilige fallback zodat UI en knoppen ALTIJD blijven werken
  if (!socket) {
    socket = {
      on: () => { },
      emit: () => { },
      data: {}
    };
  }

  // Lokale toestand
  const state = {
    playerId: localStorage.getItem('doomscroll_playerId') || null,
    playerName: localStorage.getItem('doomscroll_playerName') || '',
    playerAvatar: localStorage.getItem('doomscroll_playerAvatar') || '🎒',
    score: 0,
    claimedItems: [],
    cooldowns: {}, // itemId -> remainingSeconds
    revealedLocations: JSON.parse(localStorage.getItem('doomscroll_revealed_locs') || '{}'),
    revealedHints: JSON.parse(localStorage.getItem('doomscroll_revealed_hints') || '{}'),
    locationCaptchaSequence: null,
    itemTaskSequence: null,
    hintCaptchaSequence: null,
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
        if (ITEMS_DATA[id].isLimited) {
          if (state.revealedLocations && state.revealedLocations[id]) {
            ITEMS_DATA[id].location = all[id].secretLocation || all[id].location;
          } else {
            ITEMS_DATA[id].location = all[id].location || '❓ Verborgen (Los taak op)';
          }
        } else if (all[id].location) {
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
      updateScreenVisibility(data.gameState.status, data.leaderboard || data.gameState.leaderboard);
    });

    socket.on('state:sync', (data) => {
      state.gameStatus = data.status;
      state.timeRemaining = data.timeRemaining;
      state.limitedItems = data.limitedItems;
      state.generalItems = data.generalItems;
      state.limitedItemsMaxClaims = data.limitedItemsMaxClaims || data.gameState?.limitedItemsMaxClaims || 1;

      // Update lobby wait badge als voorraad wijzigt
      const waitStockBadge = document.getElementById('wait-limited-stock-badge');
      if (waitStockBadge) {
        waitStockBadge.textContent = `${state.limitedItemsMaxClaims}x per item`;
      }

      syncItemsData(data.generalItems, data.limitedItems);

      // Zoek eigen speler in leaderboard
      const me = (data.leaderboard || []).find(p => p.id === state.playerId);
      if (me) {
        state.score = me.score;
        state.claimedItems = me.claimedItems || [];
        state.stats = me.stats || state.stats;
        updatePlayerBar();
      }

      updateScreenVisibility(data.status, data.leaderboard);

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
      state.revealedHints = {};
      localStorage.removeItem('doomscroll_revealed_hints');
      state.locationCaptchaSequence = null;
      state.itemTaskSequence = null;
      state.hintCaptchaSequence = null;
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

    // Verwijderd uit lobby (door spelleider of zelf verlaten)
    socket.on('player:kicked', (data) => {
      handlePlayerKicked(data?.reason || 'Je bent verwijderd uit de lobby.');
    });

    // Herstel schermstatus bij herladen
    updateScreenVisibility(state.gameStatus);
  }

  function handlePlayerKicked(reason) {
    state.playerId = null;
    state.playerName = null;
    localStorage.removeItem('doomscroll_playerId');
    localStorage.removeItem('doomscroll_playerName');
    const input = document.getElementById('player-name-input');
    if (input) input.value = '';
    closeModal();
    if (screens.doomscrollTrap) screens.doomscrollTrap.classList.add('hidden');
    showScreen('login');
    if (reason) showToast(reason, 'info');
    if (window.sounds) window.sounds.playError();
  }

  function leaveLobby() {
    if (window.sounds) window.sounds.playClick();
    socket.emit('player:leave_lobby', { playerId: state.playerId });
    handlePlayerKicked('Je hebt de lobby verlaten.');
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

  function updateScreenVisibility(status, leaderboard) {
    if (state.inDoomscroll) {
      showScreen('doomscrollTrap');
      return;
    }

    if (status === 'LOBBY') {
      if (window.notifications) window.notifications.stopAmbientDistractions();
      if (!state.playerName) {
        showScreen('login');
      } else {
        showScreen('lobbyWait');
      }
    } else if (status === 'PLAYING') {
      showScreen('gameplay');
      renderMapCards();
      if (window.notifications) window.notifications.startAmbientDistractions();
    } else if (status === 'ENDED') {
      if (window.notifications) window.notifications.stopAmbientDistractions();
      if (leaderboard) state.lastLeaderboard = leaderboard;
      // Podium-animatie maar één keer starten (state:sync komt herhaaldelijk binnen)
      if (!state.podiumShown) {
        state.podiumShown = true;
        renderMobilePodium(state.lastLeaderboard || []);
      }
      showScreen('gameOver');
    } else {
      state.podiumShown = false;
    }
  }

  // ==========================================
  // AVATAR & NAAM SETUP (LOBBY)
  // ==========================================
  function selectAvatar(av) {
    state.playerAvatar = av;
    localStorage.setItem('doomscroll_playerAvatar', av);
    setupAvatarPicker();
    if (window.sounds) window.sounds.playClick();
  }

  function setupAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    if (!picker) return;

    const avatars = ['🎒', '🦊', '⚡', '🚀', '🎯', '🧭'];
    picker.innerHTML = '';

    avatars.forEach(av => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = state.playerAvatar === av;
      btn.className = `avatar-opt w-10 h-10 rounded-lg text-xl flex items-center justify-center transition cursor-pointer ${isSelected ? 'bg-white shadow-sm ring-2 ring-primary scale-105' : 'hover:bg-white/80'
        }`;
      btn.textContent = av;
      btn.onclick = (e) => {
        e.preventDefault();
        selectAvatar(av);
      };
      picker.appendChild(btn);
    });
  }

  function joinGame() {
    const input = document.getElementById('player-name-input');
    const name = (input ? input.value : state.playerName || '').trim();
    if (!name) {
      if (input) {
        input.focus();
        input.classList.add('shake', 'border-rose-500');
        setTimeout(() => input.classList.remove('shake'), 400);
      }
      showToast('⚠️ Vul eerst je naam in om mee te doen!', 'warning');
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

    const waitNameEl = document.getElementById('wait-player-name');
    if (waitNameEl) waitNameEl.textContent = state.playerName;
    showScreen('lobbyWait');
  }

  function setupLoginHandler() {
    const btn = document.getElementById('btn-join-game');
    const input = document.getElementById('player-name-input');

    if (btn) {
      btn.onclick = (e) => {
        e.preventDefault();
        joinGame();
      };
    }

    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') joinGame();
      };
    }

    const leaveLobbyBtn = document.getElementById('btn-leave-lobby');
    if (leaveLobbyBtn) {
      leaveLobbyBtn.addEventListener('click', () => {
        leaveLobby();
      });
    }

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
      if (p.id === state.playerId) {
        chip.className = 'inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-xs';
        chip.innerHTML = `
          <span>${p.avatar}</span>
          <span>${p.name} (jij)</span>
          <button type="button" class="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-[10px] text-white cursor-pointer" title="Lobby verlaten" onclick="event.stopPropagation(); window.playerApp.leaveLobby();">✕</button>
        `;
      } else {
        chip.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-stone-800 border border-stone-200';
        chip.innerHTML = `<span>${p.avatar}</span> <span>${p.name}</span>`;
      }
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
  // Willekeurige route, maar:
  // - 'date' en 'trouwen' moeten direct onder elkaar (dezelfde kolom/uitlijning).
  // - 'job_interview' en 'job_raise' moeten direct onder elkaar (dezelfde kolom/uitlijning).
  function getPlayerCardOrder(playerId) {
    const general = ['autosleutels', 'huissleutels', 'diploma', 'droomreis'];
    if (!playerId) {
      return [
        { id: 'autosleutels', align: 'left', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'huissleutels', align: 'right', rotate: 'rotate-2', width: 'w-[196px]' },
        { id: 'date', align: 'left', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'trouwen', align: 'left', rotate: 'rotate-1', width: 'w-[184px]' },
        { id: 'diploma', align: 'right', rotate: '-rotate-1', width: 'w-[184px]' },
        { id: 'job_interview', align: 'right', rotate: '-rotate-2', width: 'w-[184px]' },
        { id: 'job_raise', align: 'right', rotate: 'rotate-1', width: 'w-[184px]' },
        { id: 'droomreis', align: 'left', rotate: 'rotate-1', width: 'w-[184px]' }
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

    // 6 eenheden: 4 losse algemene items + 2 vaste paren
    const units = [
      { type: 'single', id: shuffledGeneral[0] },
      { type: 'single', id: shuffledGeneral[1] },
      { type: 'single', id: shuffledGeneral[2] },
      { type: 'single', id: shuffledGeneral[3] },
      { type: 'pair', items: ['date', 'trouwen'] },
      { type: 'pair', items: ['job_interview', 'job_raise'] }
    ];

    // Willekeurig schudden van de 6 blokken
    for (let i = units.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [units[i], units[j]] = [units[j], units[i]];
    }

    // Flatten naar kaartvolgorde waarbij paren dezelfde 'align' delen (strikt onder elkaar)
    const cardOrder = [];
    let currentAlign = pseudoRandom() > 0.5 ? 'left' : 'right';
    let rotIndex = 0;

    units.forEach(unit => {
      if (unit.type === 'single') {
        const rot = (rotIndex % 3 === 0 ? 1 : rotIndex % 3 === 1 ? -1 : 2) * (currentAlign === 'left' ? -1 : 1);
        rotIndex++;
        cardOrder.push({
          id: unit.id,
          align: currentAlign,
          rotate: rot < 0 ? `-rotate-${Math.abs(rot)}` : `rotate-${rot}`,
          width: unit.id === 'huissleutels' ? 'w-[196px]' : 'w-[184px]'
        });
        currentAlign = currentAlign === 'left' ? 'right' : 'left';
      } else {
        // Beide items in het paar krijgen PRECIES dezelfde uitlijning (strikt onder elkaar)
        unit.items.forEach((id, pIdx) => {
          const rot = (pIdx === 0 ? -1 : 1) * (currentAlign === 'left' ? 1 : -1);
          cardOrder.push({
            id,
            align: currentAlign,
            rotate: rot < 0 ? `-rotate-${Math.abs(rot)}` : `rotate-${rot}`,
            width: id === 'huissleutels' ? 'w-[196px]' : 'w-[184px]'
          });
        });
        currentAlign = currentAlign === 'left' ? 'right' : 'left';
      }
    });

    return cardOrder;
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
      const maxClaims = limitedServerInfo?.maxClaims || state.limitedItemsMaxClaims || 1;
      const claimsList = Array.isArray(limitedServerInfo?.claims)
        ? limitedServerInfo.claims
        : (limitedServerInfo?.claimedBy ? [{ playerId: limitedServerInfo.claimedBy, playerName: limitedServerInfo.claimedByName }] : []);
      const isDepleted = item.isLimited && claimsList.length >= maxClaims && !claimsList.some(c => c.playerId === state.playerId);
      const isClaimedByOther = isDepleted;
      const isLocked = (item.id === 'job_raise' || item.id === 'trouwen') && (!limitedServerInfo || limitedServerInfo.isLocked);
      const activeCooldown = (state.cooldowns || {})[item.id] || 0;

      // Exclusiviteit follow-ups (geschikt voor 1x of meerdere claims per limited item):
      const intEligible = Array.isArray(state.limitedItems?.job_interview?.eligiblePlayerIds)
        ? state.limitedItems.job_interview.eligiblePlayerIds
        : (state.limitedItems?.job_interview?.claims ? state.limitedItems.job_interview.claims.map(c => c.playerId) : (state.limitedItems?.job_interview?.claimedBy ? [state.limitedItems.job_interview.claimedBy] : []));
      const intWinnerNames = Array.isArray(state.limitedItems?.job_interview?.claims)
        ? state.limitedItems.job_interview.claims.map(c => c.playerName).filter(Boolean).join(', ')
        : (state.limitedItems?.job_interview?.claimedByName || 'Interview-winnaar');
      const isJobRaiseLockedForMe = (item.id === 'job_raise') && (
        intEligible.length === 0 || !intEligible.includes(state.playerId) || (intEligible.includes(state.playerId) && isLocked)
      );

      const dateEligible = Array.isArray(state.limitedItems?.date?.eligiblePlayerIds)
        ? state.limitedItems.date.eligiblePlayerIds
        : (state.limitedItems?.date?.claims ? state.limitedItems.date.claims.map(c => c.playerId) : (state.limitedItems?.date?.claimedBy ? [state.limitedItems.date.claimedBy] : []));
      const dateWinnerNames = Array.isArray(state.limitedItems?.date?.claims)
        ? state.limitedItems.date.claims.map(c => c.playerName).filter(Boolean).join(', ')
        : (state.limitedItems?.date?.claimedByName || 'Date-winnaar');
      const isTrouwenLockedForMe = (item.id === 'trouwen') && (
        dateEligible.length === 0 || !dateEligible.includes(state.playerId) || (dateEligible.includes(state.playerId) && isLocked)
      );

      // Locatie onthulling check (geen Captcha tekst!)
      const isLocRevealed = !item.isLimited || !!(state.revealedLocations && state.revealedLocations[item.id]);
      const displayLocation = isLocRevealed
        ? `📍 ${item.secretLocation || item.location}`
        : '❓ Verborgen (Tik om te onthullen)';

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
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">OP = OP (${claimsList.length}/${maxClaims})</span>`;
      } else if (item.id === 'job_raise' && intEligible.length > 0 && !intEligible.includes(state.playerId)) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">🔒 Alleen voor ${intWinnerNames}</span>`;
      } else if (item.id === 'trouwen' && dateEligible.length > 0 && !dateEligible.includes(state.playerId)) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">🔒 Alleen voor ${dateWinnerNames}</span>`;
      } else if (isLocked) {
        badgeHtml = `<span class="absolute -top-2 -right-2 bg-stone-700 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow">🔒 Vergrendeld</span>`;
      } else if (item.isLimited) {
        const remainingClaims = Math.max(0, maxClaims - claimsList.length);
        if (claimsList.length > 0 && remainingClaims > 0) {
          badgeHtml = `<span class="absolute -top-2 -right-2 bg-amber-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">Nog ${remainingClaims} over!</span>`;
        } else {
          badgeHtml = `<span class="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">Limited (${maxClaims}x)</span>`;
        }
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
      } else if (item.id === 'job_raise' && intEligible.length > 0 && !intEligible.includes(state.playerId)) {
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-stone-100 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-stone-300 text-center">
            <div class="flex items-center gap-1 text-xs font-bold text-stone-700 mb-0.5">
              <span>🔒</span> ${item.name}
            </div>
            <p class="text-[8px] text-stone-500 leading-tight">Exclusief voor ${intWinnerNames}</p>
          </div>
        `;
      } else if (item.id === 'trouwen' && dateEligible.length > 0 && !dateEligible.includes(state.playerId)) {
        innerContentHtml = `
          <div class="w-full min-h-[76px] bg-stone-100 rounded-sm mb-2 p-2 flex flex-col items-center justify-center border border-stone-300 text-center">
            <div class="flex items-center gap-1 text-xs font-bold text-stone-700 mb-0.5">
              <span>🔒</span> ${item.name}
            </div>
            <p class="text-[8px] text-stone-500 leading-tight">Exclusief voor ${dateWinnerNames}</p>
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
        const stockLabel = maxClaims > 1 ? `${maxClaims} Beschikbaar!` : '1 Beschikbaar!';
        innerContentHtml = `
          <div class="w-full min-h-[76px] ${item.isLimited ? 'bg-amber-50/70 border-amber-200/80' : 'bg-stone-50 border-stone-200/80'} rounded-sm mb-2 p-2 flex flex-col items-center justify-center border text-center">
            <div class="flex items-center gap-1 mb-0.5">
              <span class="text-xs font-bold text-stone-900">${item.name}</span>
              ${item.isLimited ? `<span class="text-[8px] bg-amber-200 text-amber-950 font-bold px-1 rounded">${stockLabel}</span>` : ''}
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
      } else if (item.id === 'job_raise' && intEligible.length > 0 && !intEligible.includes(state.playerId)) {
        clickActionText = `Alleen voor ${intWinnerNames}`;
      } else if (item.id === 'trouwen' && dateEligible.length > 0 && !dateEligible.includes(state.playerId)) {
        clickActionText = `Alleen voor ${dateWinnerNames}`;
      } else if (isLocked) {
        clickActionText = 'Timer start na vorig item';
      } else if (activeCooldown > 0) {
        clickActionText = 'Tik voor wachttijd';
      } else if (item.isLimited && !isLocRevealed) {
        clickActionText = 'Tik om locatie te onthullen';
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
    const maxClaims = limitedInfo?.maxClaims || state.limitedItemsMaxClaims || 1;
    const claimsList = Array.isArray(limitedInfo?.claims)
      ? limitedInfo.claims
      : (limitedInfo?.claimedBy ? [{ playerId: limitedInfo.claimedBy, playerName: limitedInfo.claimedByName }] : []);

    if (item.isLimited && claimsList.length >= maxClaims && !claimsList.some(c => c.playerId === state.playerId)) {
      showToast(`Helaas! ${item.name} is al gepakt (${claimsList.length}/${maxClaims}). OP = OP!`, 'error');
      return;
    }

    // Exclusiviteit follow-ups (geschikt voor 1x of meerdere claims per limited item):
    if (item.id === 'job_raise') {
      const intEligible = Array.isArray(state.limitedItems?.job_interview?.eligiblePlayerIds)
        ? state.limitedItems.job_interview.eligiblePlayerIds
        : (state.limitedItems?.job_interview?.claims ? state.limitedItems.job_interview.claims.map(c => c.playerId) : (state.limitedItems?.job_interview?.claimedBy ? [state.limitedItems.job_interview.claimedBy] : []));
      if (intEligible.length === 0) {
        showToast('🔒 Job Raise is vergrendeld. Er moet eerst iemand slagen voor het Job Interview!');
        return;
      }
      if (!intEligible.includes(state.playerId)) {
        showToast(`🔒 Exclusief item: alleen de winnaars van het Job Interview kunnen de Job Raise claimen!`, 'error');
        return;
      }
      if (limitedInfo && limitedInfo.isLocked) {
        showToast('⏳ Je salarisverhoging ontgrendelt zodra de aftelteller van 1 minuut klaar is!');
        return;
      }
    }

    if (item.id === 'trouwen') {
      const dateEligible = Array.isArray(state.limitedItems?.date?.eligiblePlayerIds)
        ? state.limitedItems.date.eligiblePlayerIds
        : (state.limitedItems?.date?.claims ? state.limitedItems.date.claims.map(c => c.playerId) : (state.limitedItems?.date?.claimedBy ? [state.limitedItems.date.claimedBy] : []));
      if (dateEligible.length === 0) {
        showToast('🔒 Trouwen is vergrendeld. Er moet eerst iemand slagen voor de Date!');
        return;
      }
      if (!dateEligible.includes(state.playerId)) {
        showToast(`🔒 Exclusief item: alleen de winnaars van de Date kunnen gaan Trouwen!`, 'error');
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
  // 8 CAPTCHAS OM VERBORGEN LOCATIES TE ONTHULLEN
  // (OF: Korte video om te skippen -> Doomscroll feed!)
  // ==========================================

  function openCaptchaLocationModal(item) {
    if (!item && state.activeItemId) item = ITEMS_DATA[state.activeItemId];
    if (!item) return;
    state.activeItemId = item.id;
    state.activeModal = 'CAPTCHA_LOCATION';

    if (!state.locationCaptchaSequence || state.locationCaptchaSequence.itemId !== item.id) {
      state.locationCaptchaSequence = null;
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl">lock</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Limited Item</span>
          <h3 class="font-display text-xl font-black text-stone-900 mt-1">${item.name}</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            De vindplek van dit item is verborgen. Hoe wil je de geheime locatie onthullen?
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <!-- KEUZE 1: 8 CAPTCHAS OPLOSSEN (EERLIJKE WEG) -->
          <button type="button" id="btn-start-location-captchas" class="w-full p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-emerald-200 group-hover:scale-110 transition">password</span>
              <div>
                <div class="text-sm font-black">Los 8 Captcha's op</div>
                <div class="text-[11px] text-emerald-100 font-normal">Los 8 snelle beveiligingscodes achter elkaar op om de geheime locatie vrij te spelen.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-emerald-200 text-lg">chevron_right</span>
          </button>

          <!-- KEUZE 2: SKIP MET KORTE VIDEO -->
          <button type="button" id="btn-skip-location-video" class="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold shadow-sm active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-amber-600 group-hover:scale-110 transition">play_circle</span>
              <div>
                <div class="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <span>Korte video kijken om te skippen</span>
                  <span class="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Snel</span>
                </div>
                <div class="text-[11px] text-amber-800 font-normal">Geen zin in captchas? Sla over met een korte video.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-amber-600 text-lg">arrow_forward</span>
          </button>

          <button type="button" id="btn-location-choice-cancel" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1 mt-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar campuskaart</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-start-location-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      openConfirmLocationCaptchaModal(item);
    });

    document.getElementById('btn-skip-location-video').addEventListener('click', () => {
      skipLocationCaptchaWithVideo(item);
    });

    document.getElementById('btn-location-choice-cancel').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      closeModal();
    });

    openModal();
  }

  function openConfirmLocationCaptchaModal(item) {
    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl text-amber-600">help</span>
        </div>
        <div>
          <h3 class="font-display text-xl font-black text-stone-900">Weet je het zeker?</h3>
          <p class="text-xs text-stone-600 mt-2 leading-relaxed">
            Je staat op het punt om <strong>8 beveiligings-captchas</strong> achter elkaar op te lossen om de geheime locatie van <strong>${item.name}</strong> te ontgrendelen.
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <button type="button" id="btn-confirm-start-location-captchas" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Ja, start de 8 captchas</span>
          </button>

          <button type="button" id="btn-cancel-start-location-captchas" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Nee, ga terug</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-confirm-start-location-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      startLocationCaptchaSequence(item);
    });

    document.getElementById('btn-cancel-start-location-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      openCaptchaLocationModal(item);
    });
  }

  function skipLocationCaptchaWithVideo(item) {
    if (window.sounds) window.sounds.playError();
    state.locationCaptchaSequence = null;
    state.previousModalState = {
      type: 'CAPTCHA_LOCATION',
      itemId: item.id
    };
    closeModal();
    openAppFeed('TikTok', item.id);
  }

  function startLocationCaptchaSequence(item) {
    state.locationCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8,
      challenges: generateUniqueCaptchaSequence(8)
    };
    renderCurrentLocationCaptchaStep(item);
  }

  // ==========================================
  // DYNAMISCHE RANDOM CAPTCHA GENERATOR
  // ==========================================
    // ==========================================
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
        subTitle: `Gebruik de pijltjes om de dobbelstenen op te tellen tot ${targetSum}:`,
        targetSum: targetSum,
        configs: configs,
        currentIndex: (winIdx + 2) % configs.length,
        winningIndex: winIdx
      };
    }

    // SHADOW MATCH: Vervangt het onduidelijke doolhof met de populaire schaduw-puzzel!
    if (type === 'shadow_match') {
      // Elk thema: één vorm (inner SVG met currentColor). Het origineel wordt in kleur getoond,
      // de opties zijn schaduwen van exact dezelfde tekening + duidelijk afwijkende varianten.
      // Alle transforms zitten op een <g> binnen een ruime viewBox, zodat niets buiten beeld schuift.
      const SHAPES = [
        {
          name: 'Raceauto', w: 100, h: 46, color: '#dc2626', asym: true,
          shape: '<path d="M5 34 L5 24 L13 24 L15 18 L21 18 L25 26 L42 26 L49 15 L58 15 L63 26 L86 28 L95 34 Z"/><circle cx="22" cy="36" r="8"/><circle cx="77" cy="36" r="8"/>',
          alt: '<path d="M6 34 L8 24 L24 22 L34 12 L64 12 L76 22 L92 25 L94 34 Z"/><circle cx="26" cy="36" r="7"/><circle cx="74" cy="36" r="7"/>'
        },
        {
          name: 'Ruimteraket', w: 60, h: 80, color: '#2563eb', asym: false,
          shape: '<path d="M30 3 Q46 26 45 58 L56 72 L41 68 L30 77 L19 68 L4 72 L15 58 Q14 26 30 3 Z"/>',
          alt: '<path d="M30 3 Q48 30 48 64 L12 64 Q12 30 30 3 Z"/><rect x="24" y="64" width="12" height="10"/>'
        },
        {
          name: 'Dolfijn', w: 90, h: 60, color: '#0891b2', asym: true,
          shape: '<path d="M12 40 Q25 15 55 18 Q72 20 85 28 Q70 32 60 42 Q50 48 35 45 Q22 48 12 52 Q18 45 12 40 Z M48 18 Q45 6 40 10 Q42 16 48 18 Z"/>',
          alt: '<path d="M10 34 Q30 20 55 24 Q75 26 86 34 Q75 40 55 42 Q30 44 10 34 Z M2 26 L14 34 L2 42 Z"/>'
        },
        {
          name: 'Kat', w: 80, h: 70, color: '#ea580c', asym: true,
          shape: '<path d="M14 64 Q8 40 22 30 L20 12 L30 22 L40 22 L46 12 L46 30 Q60 38 60 64 Z M58 62 Q76 60 72 40 Q70 34 66 38 Q70 52 56 56 Z"/>',
          alt: '<path d="M16 64 Q12 44 26 36 L26 18 L34 28 L44 28 L52 18 L52 36 Q64 44 62 64 Z"/>'
        }
      ];
      const sel = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const pad = 14;
      const vb = `${-pad} ${-pad} ${sel.w + pad * 2} ${sel.h + pad * 2}`;
      const cx = sel.w / 2, cy = sel.h / 2;
      const mk = (inner, tf, fill) => `<svg viewBox="${vb}" width="100%" height="100%" class="w-full h-full block" preserveAspectRatio="xMidYMid meet" style="color:${fill}"><g fill="currentColor"${tf ? ` transform="${tf}"` : ''}>${inner}</g></svg>`;
      const SH = '#0f172a';
      const variants = [
        sel.asym
          ? mk(sel.shape, `translate(${sel.w},0) scale(-1,1)`, SH)   // gespiegeld
          : mk(sel.shape, `rotate(180, ${cx}, ${cy})`, SH),          // ondersteboven (symmetrische vorm)
        mk(sel.alt, '', SH),                                           // andere vorm
        mk(sel.shape, `rotate(${sel.asym ? 30 : 90}, ${cx}, ${cy}) translate(${cx * 0.3},${cy * 0.3}) scale(0.7)`, SH) // gedraaid (verkleind zodat hij binnen beeld blijft)
      ];
      const options = [
        { id: 'correct', svg: mk(sel.shape, '', SH), isCorrect: true },
        { id: 'd1', svg: variants[0], isCorrect: false },
        { id: 'd2', svg: variants[1], isCorrect: false },
        { id: 'd3', svg: variants[2], isCorrect: false }
      ].sort(() => Math.random() - 0.5);

      return {
        uiType: 'shadow_match',
        title: 'Schaduw Match',
        subTitle: `Kies de schaduw die exact overeenkomt met de ${sel.name.toLowerCase()} (niet gespiegeld, niet gedraaid):`,
        theme: { name: sel.name, previewSvg: mk(sel.shape, '', sel.color) },
        options: options,
        selectedOptionId: null
      };
    }

    if (type === '__legacy_shadow_match') {
      const shadowThemes = [
        {
          name: 'Raceauto',
          icon: '🏎️',
          silhouetteSvg: `<svg viewBox="0 0 100 60" class="w-full h-full"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>`,
          distractor1: `<svg viewBox="0 0 100 60" class="w-full h-full" transform="scale(-1, 1) translate(-100, 0)"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>`,
          distractor2: `<svg viewBox="0 0 100 60" class="w-full h-full"><path d="M 15 35 L 30 35 L 40 25 L 60 25 L 75 35 L 85 35 L 85 42 L 15 42 Z M 25 42 A 5 5 0 0 1 35 42 Z M 65 42 A 5 5 0 0 1 75 42 Z" fill="#0f172a"/></svg>`,
          distractor3: `<svg viewBox="0 0 100 60" class="w-full h-full" transform="rotate(18, 50, 30)"><path d="M 10 32 L 25 32 L 35 20 L 65 20 L 80 28 L 92 32 L 95 38 L 88 40 L 10 40 Z M 22 40 A 6 6 0 0 1 34 40 Z M 68 40 A 6 6 0 0 1 80 40 Z" fill="#0f172a"/></svg>`
        },
        {
          name: 'Ruimteraket',
          icon: '🚀',
          silhouetteSvg: `<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 5 Q 45 30 45 60 L 55 70 L 40 68 L 30 75 L 20 68 L 5 70 L 15 60 Q 15 30 30 5 Z" fill="#0f172a"/></svg>`,
          distractor1: `<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 10 Q 40 35 40 65 L 50 72 L 38 68 L 30 72 L 22 68 L 10 72 L 20 65 Q 20 35 30 10 Z" fill="#0f172a"/></svg>`,
          distractor2: `<svg viewBox="0 0 60 80" class="w-full h-full" transform="rotate(35, 30, 40)"><path d="M 30 5 Q 45 30 45 60 L 55 70 L 40 68 L 30 75 L 20 68 L 5 70 L 15 60 Q 15 30 30 5 Z" fill="#0f172a"/></svg>`,
          distractor3: `<svg viewBox="0 0 60 80" class="w-full h-full"><path d="M 30 5 Q 48 35 48 65 L 30 65 L 12 65 Q 12 35 30 5 Z" fill="#0f172a"/></svg>`
        },
        {
          name: 'Dolfijn',
          icon: '🐬',
          silhouetteSvg: `<svg viewBox="0 0 90 60" class="w-full h-full"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>`,
          distractor1: `<svg viewBox="0 0 90 60" class="w-full h-full" transform="scale(-1, 1) translate(-90, 0)"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>`,
          distractor2: `<svg viewBox="0 0 90 60" class="w-full h-full" transform="rotate(25, 45, 30)"><path d="M 12 40 Q 25 15 55 18 Q 72 20 85 28 Q 70 32 60 42 Q 50 48 35 45 Q 22 48 12 52 Q 18 45 12 40 Z M 48 18 Q 45 6 40 10 Q 42 16 48 18 Z" fill="#0f172a"/></svg>`,
          distractor3: `<svg viewBox="0 0 90 60" class="w-full h-full"><path d="M 15 35 Q 30 18 55 22 Q 70 24 82 32 Q 68 35 58 42 Q 48 45 35 42 Q 22 45 15 48 Z" fill="#0f172a"/></svg>`
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
        subTitle: `Kies de schaduw die exact overeenkomt met ${sel.name}:`,
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
        ? `${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 9) + 1}`
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

  function diceFaceHtml(v) {
    const P = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]],
      4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
      6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]] }[v] || [];
    return `<div class="w-10 h-10 rounded-lg bg-stone-100 border border-stone-300 shadow-sm"><svg viewBox="0 0 100 100" class="w-full h-full">${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#1c1917"/>`).join('')}</svg></div>`;
  }

  function getCardinalDirLabel(deg) {
    const norm = (deg % 360 + 360) % 360;
    if (norm === 0) return 'RECHTS (→)';
    if (norm === 90) return 'BENEDEN (↓)';
    if (norm === 180) return 'LINKS (←)';
    if (norm === 270) return 'BOVEN (↑)';
    return `${norm}°`;
  }

  function renderCaptchaWidgetHtml(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const targetDeg = challenge.targetAngle;
      const curDeg = challenge.currentAngle;
      const targetLabel = challenge.targetLabel || getCardinalDirLabel(targetDeg);
      const curLabel = getCardinalDirLabel(curDeg);

      return `
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-2 gap-3 items-center">
            <!-- Doel Oriëntatie -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Doel Richting</span>
              <div class="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center border border-stone-700 shadow-inner">
                <div style="transform: rotate(${targetDeg}deg); transition: transform 0.3s ease;">
                  <span class="text-4xl leading-none">👉</span>
                </div>
              </div>
              <span class="mt-2 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[10px] font-black tracking-wide">${targetLabel}</span>
            </div>

            <!-- Draaibare Top-Down Raceauto (0° neus wijst naar RECHTS) -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Raceauto</span>
              <div class="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shadow-inner overflow-hidden">
                <div id="${prefix}-dir-target-icon" class="w-12 h-12 flex items-center justify-center transition-transform duration-300" style="transform: rotate(${curDeg}deg);">
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
              <span id="${prefix}-dir-current-label" class="mt-2 px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-mono text-[10px] font-black tracking-wide">Stand: ${curLabel}</span>
            </div>
          </div>

          <!-- Draaiknoppen (90 graden per klik) -->
          <div class="flex justify-center gap-2.5 mt-3">
            <button type="button" id="${prefix}-btn-rot-left" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span class="material-symbols-outlined text-sm">rotate_left</span>
              <span>Draai links (90°)</span>
            </button>
            <button type="button" id="${prefix}-btn-rot-right" class="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-700 shadow-sm">
              <span>Draai rechts (90°)</span>
              <span class="material-symbols-outlined text-sm">rotate_right</span>
            </button>
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'slider_puzzle') {
      const tgt = challenge.targetPercent;
      return `
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="relative w-full h-24 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 border border-emerald-800/50 overflow-hidden shadow-inner flex items-center mb-3">
            <!-- Doel Uitsparing -->
            <div class="absolute top-2.5 bottom-2.5 w-12 rounded-lg border-2 border-dashed border-amber-400/90 bg-amber-400/10 flex items-center justify-center pointer-events-none" style="left: calc(${tgt}% - ${tgt * 0.48}px);">
              <span class="text-xs font-bold text-amber-300/80">Hier</span>
            </div>
            <!-- Verschuifbaar Puzzelstukje -->
            <div id="${prefix}-puzzle-piece" class="absolute top-2.5 bottom-2.5 w-12 rounded-lg bg-emerald-500 border-2 border-emerald-300 shadow-lg flex items-center justify-center text-xl transition-all duration-75 pointer-events-none" style="left: 0%;">
              🧩
            </div>
          </div>
          <div class="px-2">
            <input type="range" id="${prefix}-slider-input" min="0" max="100" value="0" class="w-full accent-emerald-500 cursor-pointer h-2 bg-stone-700 rounded-lg">
            <div class="flex justify-between text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-wider">
              <span>Start</span>
              <span class="text-amber-400 flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">arrow_forward</span> Sleep naar uitsparing</span>
              <span>Eind</span>
            </div>
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'dice_match') {
      const curConfig = challenge.configs[challenge.currentIndex];
      const pipMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };
      return `
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center">
          <div class="grid grid-cols-5 gap-2 items-center">
            <!-- Doel Som -->
            <div class="col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800">
              <span class="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Match dit getal:</span>
              <span class="text-4xl font-black font-mono text-amber-400">${challenge.targetSum}</span>
            </div>

            <!-- Dobbelstenen Groep -->
            <div class="col-span-3 flex flex-col items-center justify-center p-2 rounded-xl bg-stone-950/80 border border-stone-800">
              <div id="${prefix}-dice-display" class="grid grid-cols-2 gap-1.5 p-1">
                ${curConfig.dice.map(v => diceFaceHtml(v)).join('')}
              </div>
            </div>
          </div>

          <!-- Wissel Pijlen -->
          <div class="flex items-center justify-between mt-3 px-2">
            <button type="button" id="${prefix}-btn-dice-prev" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div class="flex items-center gap-1.5" id="${prefix}-dice-dots">
              ${challenge.configs.map((_, i) => `
                <div class="w-2 h-2 rounded-full transition-all ${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
              `).join('')}
            </div>
            <button type="button" id="${prefix}-btn-dice-next" class="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center transition cursor-pointer border border-stone-700">
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'shadow_match') {
      return `
        <div class="p-3 bg-stone-50 rounded-2xl border-2 border-stone-200 my-2 select-none text-center space-y-2.5">
          <!-- Te matchen object in kleur -->
          <div class="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl bg-stone-100 border border-stone-200 max-w-[220px] mx-auto shadow-inner">
            <div class="w-28 h-16 pointer-events-none">${challenge.theme.previewSvg || ''}</div>
            <span class="text-xs font-black text-stone-800">${challenge.theme.name}</span>
          </div>

          <!-- 4 Schaduw Opties (2x2 Grid) -->
          <div class="grid grid-cols-2 gap-2" id="${prefix}-shadow-grid">
            ${challenge.options.map((opt, idx) => `
              <button type="button" class="shadow-opt-btn p-3 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-100 active:scale-95 transition flex flex-col items-center justify-center h-24 cursor-pointer shadow-xs relative overflow-hidden" data-id="${opt.id}">
                <div class="w-24 h-16 flex items-center justify-center pointer-events-none">
                  ${opt.svg}
                </div>
                <span class="absolute top-1 left-2 text-[10px] font-bold text-stone-400">${String.fromCharCode(65 + idx)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'odd_one_out') {
      return `
        <div class="p-3 bg-stone-50 rounded-2xl border-2 border-stone-200 my-2 select-none text-center">
          <div class="grid grid-cols-3 gap-2" id="${prefix}-odd-grid">
            ${challenge.items.map(item => `
              <button type="button" class="odd-item-btn p-3 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-100 active:scale-95 transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs" data-id="${item.id}">
                <span class="text-3xl">${item.icon}</span>
                <span class="text-[10px] font-bold text-stone-700">${item.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'audio_captcha') {
      return `
        <div class="p-3 bg-stone-900 rounded-2xl border border-stone-800 my-2 select-none text-center space-y-3">
          <div class="flex items-center justify-center gap-3">
            <button type="button" id="${prefix}-btn-play-audio" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md">
              <span class="material-symbols-outlined text-xl">volume_up</span>
              <span>Speel audio af</span>
            </button>
            <div class="flex items-center gap-1 text-emerald-400 text-xs font-mono animate-pulse">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>

          <div class="pt-1">
            <input type="text" id="${prefix}-audio-input" maxlength="8" placeholder="TYP CODE..." class="w-full bg-stone-950 border-2 border-stone-700 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 uppercase placeholder:text-stone-600">
          </div>
        </div>
      `;
    }

    if (challenge.uiType === 'distorted_word') {
      const letters = challenge.code.split('');
      const charOffsets = letters.map((ch, idx) => {
        const y = 38 + Math.sin(idx * 1.3) * 8;
        const rot = (idx % 2 === 0 ? 1 : -1) * (8 + (idx * 3) % 12);
        return { ch, x: 25 + idx * 30, y, rot };
      });

      return `
        <div class="space-y-3 my-2 select-none">
          <div class="relative w-full h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 overflow-hidden flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 240 70" class="w-full h-full">
              <!-- Ruis lijnen -->
              <path d="M 10 35 Q 60 10 120 40 T 230 35" fill="none" stroke="#059669" stroke-width="2.5" opacity="0.6"/>
              <path d="M 10 50 Q 80 65 150 20 T 230 45" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.5"/>
              <path d="M 20 20 Q 110 5 180 55 T 235 25" fill="none" stroke="#d97706" stroke-width="1.5" opacity="0.4"/>
              <!-- Vervormde Letters -->
              ${charOffsets.map(o => `
                <text x="${o.x}" y="${o.y}" transform="rotate(${o.rot}, ${o.x}, ${o.y})" font-family="serif" font-weight="900" font-size="28" fill="#34d399" text-anchor="middle" letter-spacing="4">
                  ${o.ch}
                </text>
              `).join('')}
            </svg>
            <button type="button" id="${prefix}-btn-reload-word" class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center hover:bg-stone-700 transition cursor-pointer" title="Nieuw woord">
              <span class="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          <div>
            <input type="text" id="${prefix}-distorted-input" maxlength="12" placeholder="TYP WOORD..." class="w-full bg-stone-50 border-2 border-stone-300 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-stone-900 focus:outline-none focus:border-emerald-600 uppercase placeholder:text-stone-400">
          </div>
        </div>
      `;
    }

    // distorted_code
    const chars = challenge.code.split('');
    const charOffsets = chars.map((ch, idx) => {
      const y = 38 + Math.sin(idx * 1.5) * 8;
      const rot = (idx % 2 === 0 ? 1 : -1) * (10 + (idx * 4) % 15);
      return { ch, x: 35 + idx * 45, y, rot };
    });

    return `
      <div class="space-y-3 my-2 select-none">
        <div class="relative w-full h-24 rounded-2xl bg-stone-900 border-2 border-stone-700 overflow-hidden flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 240 70" class="w-full h-full">
            <!-- Ruis lijnen en raster -->
            <path d="M 10 35 Q 70 15 130 45 T 230 35" fill="none" stroke="#10b981" stroke-width="2.5" opacity="0.6"/>
            <path d="M 10 55 Q 90 65 160 25 T 230 45" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.5"/>
            <!-- 4 Alfanumerieke tekens -->
            ${charOffsets.map(o => `
              <text x="${o.x}" y="${o.y}" transform="rotate(${o.rot}, ${o.x}, ${o.y})" font-family="monospace" font-weight="900" font-size="32" fill="#6ee7b7" text-anchor="middle">
                ${o.ch}
              </text>
            `).join('')}
          </svg>
          <button type="button" id="${prefix}-btn-reload-code" class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center hover:bg-stone-700 transition cursor-pointer" title="Nieuwe code">
            <span class="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        <div>
          <input type="text" id="${prefix}-distorted-input" maxlength="6" placeholder="CODE . . ." class="w-full bg-stone-50 border-2 border-stone-300 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-stone-900 focus:outline-none focus:border-emerald-600 uppercase placeholder:text-stone-400">
        </div>
      </div>
    `;
  }

  function bindCaptchaWidgetEvents(challenge, prefix) {
    if (challenge.uiType === 'direction_match') {
      const icon = document.getElementById(`${prefix}-dir-target-icon`);
      const label = document.getElementById(`${prefix}-dir-current-label`);
      const btnLeft = document.getElementById(`${prefix}-btn-rot-left`);
      const btnRight = document.getElementById(`${prefix}-btn-rot-right`);

      if (btnLeft) {
        btnLeft.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle - 90 + 360) % 360;
          if (icon) icon.style.transform = `rotate(${challenge.currentAngle}deg)`;
          if (label) label.textContent = `Stand: ${getCardinalDirLabel(challenge.currentAngle)}`;
        };
      }
      if (btnRight) {
        btnRight.onclick = () => {
          if (window.sounds) window.sounds.playClick();
          challenge.currentAngle = (challenge.currentAngle + 90) % 360;
          if (icon) icon.style.transform = `rotate(${challenge.currentAngle}deg)`;
          if (label) label.textContent = `Stand: ${getCardinalDirLabel(challenge.currentAngle)}`;
        };
      }
    } else if (challenge.uiType === 'slider_puzzle') {
      const piece = document.getElementById(`${prefix}-puzzle-piece`);
      const slider = document.getElementById(`${prefix}-slider-input`);
      if (slider) {
        slider.oninput = () => {
          const val = parseInt(slider.value, 10);
          challenge.currentPercent = val;
          if (piece) piece.style.left = `calc(${val}% - ${val * 0.48}px)`;
        };
      }
    } else if (challenge.uiType === 'dice_match') {
      const btnPrev = document.getElementById(`${prefix}-btn-dice-prev`);
      const btnNext = document.getElementById(`${prefix}-btn-dice-next`);
      const display = document.getElementById(`${prefix}-dice-display`);
      const dots = document.getElementById(`${prefix}-dice-dots`);
      const pipMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

      const updateDiceView = () => {
        const cur = challenge.configs[challenge.currentIndex];
        if (display) {
          display.innerHTML = cur.dice.map(v => diceFaceHtml(v)).join('');
        }
        if (dots) {
          dots.innerHTML = challenge.configs.map((_, i) => `
            <div class="w-2 h-2 rounded-full transition-all ${i === challenge.currentIndex ? 'bg-amber-400 scale-125' : 'bg-stone-700'}"></div>
          `).join('');
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
      const shadowBtns = document.querySelectorAll(`#${prefix}-shadow-grid .shadow-opt-btn`);
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
      const oddBtns = document.querySelectorAll(`#${prefix}-odd-grid .odd-item-btn`);
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
      const btnPlay = document.getElementById(`${prefix}-btn-play-audio`);
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
            showToast(`Audio niet ondersteund. Code is: ${challenge.code}`);
          }
        };
      }
    } else if (challenge.uiType === 'distorted_word') {
      const btnReload = document.getElementById(`${prefix}-btn-reload-word`);
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
      const btnReload = document.getElementById(`${prefix}-btn-reload-code`);
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
      const input = document.getElementById(`${prefix}-audio-input`);
      const val = (input?.value || '').replace(/[\s.\-]/g, '').toUpperCase();
      if (!val) return 'select_none';
      return val === challenge.code.toUpperCase();
    }
    if (challenge.uiType === 'distorted_word' || challenge.uiType === 'distorted_code') {
      const input = document.getElementById(`${prefix}-distorted-input`);
      const val = (input?.value || '').trim().toUpperCase();
      if (!val) return 'select_none';
      return val === challenge.code.toUpperCase();
    }
    return true;
  }

  function renderCurrentLocationCaptchaStep(item) {
    if (!state.locationCaptchaSequence) {
      startLocationCaptchaSequence(item);
      return;
    }

    state.activeModal = 'CAPTCHA_LOCATION';
    const currentStep = state.locationCaptchaSequence.currentStep;
    const totalSteps = state.locationCaptchaSequence.totalSteps || 8;

    // Genereer elke stap een willekeurige, gevarieerde captcha uitdaging uit de 8 typen
    if (!state.locationCaptchaSequence.challenges || !state.locationCaptchaSequence.challenges.length) {
      state.locationCaptchaSequence.challenges = generateUniqueCaptchaSequence(totalSteps);
    }
    const challenge = state.locationCaptchaSequence.challenges[currentStep - 1];
    state.locationCaptchaSequence.currentChallenge = challenge;

    // 8 Voortgangsbolletjes om te zien hoe ver de speler is (zonder cijfertekst)
    const progressDotsHtml = [1, 2, 3, 4, 5, 6, 7, 8].map(s => `
      <div class="w-2.5 h-2.5 rounded-full transition-all ${
        s < currentStep
          ? 'bg-emerald-600'
          : (s === currentStep ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-125' : 'bg-stone-300')
      }"></div>
    `).join('');

    const widgetHtml = renderCaptchaWidgetHtml(challenge, 'loc');

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto" id="loc-captcha-container">
        
        <!-- Header met 8 voortgangsbollen (zonder cijfertekst) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-base">password</span>
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-800 uppercase tracking-wide block">Beveiligings-Captcha</span>
              <span class="text-[10px] font-bold text-emerald-700 block">${item.name}</span>
            </div>
          </div>
          <!-- 8 Voortgangsbolletjes -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 border border-stone-200/80">
            ${progressDotsHtml}
          </div>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">${challenge.title}</h3>
          <p class="text-xs text-stone-600 mt-0.5 leading-snug">
            ${challenge.subTitle}
          </p>
        </div>

        <!-- Dynamische Captcha Widget (1 van de 8 types) -->
        ${widgetHtml}

        <!-- Knoppen & Skip (ZONDER valstrik!) -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-verify-location-captcha" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>${currentStep === totalSteps ? 'Verifieer & Onthul Geheime Locatie' : 'Volgende Captcha'}</span>
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
    `;

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

  // ==========================================
  // STAP 1: CONFIRMATIE- & KEUZESCHERM VOOR DE 4 THEMA-TAKEN
  // ==========================================
  function openItemTaskConfirmationModal(item) {
    if (!item) item = ITEMS_DATA[state.activeItemId];
    if (!item) return;

    state.activeItemId = item.id;
    state.activeModal = 'ITEM_TASK_CONFIRM';

    if (!state.itemTaskSequence || state.itemTaskSequence.itemId !== item.id) {
      state.itemTaskSequence = null;
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl">verified</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">Code Goedgekeurd</span>
          <h3 class="font-display text-xl font-black text-stone-900 mt-1">${item.name}</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Code klopt! Om dit item definitief te claimen en je punt te verdienen, moet je <b>4 uitdagende thema-taken</b> voltooien.
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <!-- KEUZE 1: 4 TAKEN VOOR ITEM -->
          <button type="button" id="btn-start-item-tasks" class="w-full p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-emerald-200 group-hover:scale-110 transition">task_alt</span>
              <div>
                <div class="text-sm font-black">Doe 4 Taken voor ${item.name}</div>
                <div class="text-[11px] text-emerald-100 font-normal">Voltooi alle 4 diepgaande thema-situaties achter elkaar om je punt te claimen.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-emerald-200 text-lg">chevron_right</span>
          </button>

          <!-- KEUZE 2: SKIP MET KORTE VIDEO -->
          <button type="button" id="btn-skip-item-tasks-video" class="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold shadow-sm active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-amber-600 group-hover:scale-110 transition">play_circle</span>
              <div>
                <div class="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <span>Korte video kijken om te skippen</span>
                  <span class="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Snel</span>
                </div>
                <div class="text-[11px] text-amber-800 font-normal">Geen zin in taken? Sla over met een korte video.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-amber-600 text-lg">arrow_forward</span>
          </button>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" id="btn-confirm-back-to-item" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Terug naar item</span>
            </button>
            <button type="button" id="btn-confirm-back-to-map" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">map</span>
              <span>Terug naar campuskaart</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-item-tasks').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      startItemTaskSequence(item);
    });

    document.getElementById('btn-skip-item-tasks-video').addEventListener('click', () => {
      skipItemTasksWithVideo(item);
    });

    document.getElementById('btn-confirm-back-to-item').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      const targetItem = ITEMS_DATA[item.id] || item;
      openItemDetailModal(targetItem);
    });

    document.getElementById('btn-confirm-back-to-map').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      closeModal();
    });

    openModal();
  }

  function skipItemTasksWithVideo(item) {
    if (window.sounds) window.sounds.playError();
    state.itemTaskSequence = null;
    state.previousModalState = {
      type: 'ITEM_DETAIL',
      itemId: item.id
    };
    closeModal();
    openAppFeed('TikTok', item.id);
  }

  function startItemTaskSequence(item) {
    const fullItem = ITEMS_DATA[item.id] || item;
    const taskCount = (fullItem.tasks && fullItem.tasks.length) || 4;
    const taskOrder = Array.from({ length: taskCount }, (_, i) => i).sort(() => Math.random() - 0.5);
    state.itemTaskSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: taskCount,
      taskOrder: taskOrder
    };
    renderCurrentItemTaskStep(item);
  }

  function renderCurrentItemTaskStep(item) {
    if (!state.itemTaskSequence) {
      startItemTaskSequence(item);
      return;
    }

    state.activeModal = 'ITEM_TASK';
    const currentStep = state.itemTaskSequence.currentStep;
    const totalSteps = state.itemTaskSequence.totalSteps || 4;

    const fullItem = ITEMS_DATA[item.id] || item;
    const taskList = (fullItem && fullItem.tasks) || [];
    const taskOrder = state.itemTaskSequence.taskOrder || [0, 1, 2, 3];
    const taskIdx = (taskOrder[currentStep - 1] !== undefined) ? taskOrder[currentStep - 1] : (currentStep - 1);
    const currentTask = taskList[taskIdx] || {
      tag: fullItem.tag || 'Thema Taak',
      scenario: fullItem.question || 'Lees de situatie nauwkeurig door:',
      question: fullItem.question,
      type: 'single_choice',
      options: fullItem.options || []
    };

    const taskType = currentTask.type || 'single_choice';
    let selectedOptionCorrect = null;

    // 4 Voortgangsbolletjes om te zien hoe ver de speler is (zonder cijfertekst)
    const progressDotsHtml = [1, 2, 3, 4].map(s => `
      <div class="w-3 h-3 rounded-full transition-all ${
        s < currentStep
          ? 'bg-emerald-600'
          : (s === currentStep ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-125' : 'bg-stone-300')
      }"></div>
    `).join('');

    // Shuffled opties met A, B, C, D badges voor single_choice
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const shuffledOptions = [...(currentTask.options || [])]
      .sort(() => Math.random() - 0.5)
      .map((opt, idx) => ({
        ...opt,
        letter: letters[idx] || String.fromCharCode(65 + idx)
      }));

    // Genereer de juiste options HTML afhankelijk van het type taak
    let optionsHtml = '';
    if (taskType === 'eliminate') {
      optionsHtml = `
        <div class="w-full p-2.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-left flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-amber-700 text-base shrink-0">delete_sweep</span>
          <span class="text-[11px] font-semibold text-amber-950 leading-snug">Klik op de items die <b>NIET</b> nodig of geschikt zijn om ze weg te strepen (✕).</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-left" id="eliminate-options-group">
          ${shuffledOptions.map(opt => `
            <button type="button" class="eliminate-chip-btn p-3 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-50 active:scale-95 transition flex items-center justify-between gap-1.5 cursor-pointer shadow-xs text-left group" data-id="${opt.id}" data-eliminate="${opt.isEliminateTarget === true}">
              <span class="text-xs font-bold text-stone-900 chip-text">${opt.text}</span>
              <span class="material-symbols-outlined text-base text-stone-400 group-hover:text-rose-500 chip-icon shrink-0">close</span>
            </button>
          `).join('')}
        </div>
      `;
    } else if (taskType === 'multi_select') {
      optionsHtml = `
        <div class="w-full p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-left flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-emerald-700 text-base shrink-0">checklist</span>
          <span class="text-[11px] font-semibold text-emerald-950 leading-snug">Klik op <b>alle juiste antwoorden</b> om ze aan te vinken.</span>
        </div>
        <div class="flex flex-col gap-2 text-left" id="multiselect-options-group">
          ${shuffledOptions.map(opt => `
            <button type="button" class="multiselect-chip-btn w-full p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] transition flex items-center justify-between text-left cursor-pointer group" data-id="${opt.id}" data-correct="${opt.isCorrect === true}">
              <span class="text-xs font-medium text-stone-900 leading-snug">${opt.text}</span>
              <span class="material-symbols-outlined text-[18px] text-stone-300 multiselect-icon shrink-0">check_box_outline_blank</span>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      // Standard single_choice
      optionsHtml = `
        <div class="flex flex-col gap-2 text-left" id="quiz-options-group">
          ${shuffledOptions.map(opt => `
            <button type="button" class="task-quiz-btn w-full p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] transition flex items-center justify-between text-left cursor-pointer group" data-correct="${opt.isCorrect}">
              <div class="flex items-start gap-2.5 min-w-0 pr-2">
                <span class="w-6 h-6 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 group-hover:bg-primary/20 transition">${opt.letter}</span>
                <span class="text-xs font-medium text-stone-900 leading-snug">${opt.text}</span>
              </div>
              <span class="material-symbols-outlined text-[18px] text-stone-300 status-icon shrink-0">radio_button_unchecked</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto">
        
        <!-- Header met 4 voortgangsbollen (zonder cijfertekst zoals 3/4) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-base">quiz</span>
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-900 block leading-tight">${currentTask.tag || 'Kennisvraag'}</span>
              <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">${fullItem.name}</span>
            </div>
          </div>
          <!-- 4 Voortgangsbolletjes -->
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/80">
            ${progressDotsHtml}
          </div>
        </div>

        <!-- Visuele Illustratie (Indien aanwezig) -->
        ${currentTask.svgIllustration ? `
          <div class="w-full h-32 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center my-2 border border-stone-200/80 bg-stone-900">
            ${currentTask.svgIllustration}
          </div>
        ` : ''}

        <!-- Situatieschets -->
        ${currentTask.scenario ? `
          <div class="w-full bg-stone-50 rounded-2xl p-3.5 border border-stone-200/90 text-left space-y-1 shadow-inner">
            <div class="flex items-center gap-1.5 text-[10px] font-black uppercase text-stone-500 tracking-wider">
              <span class="material-symbols-outlined text-xs text-primary">info</span>
              <span>Situatieschets</span>
            </div>
            <p class="text-xs text-stone-800 leading-relaxed font-medium">${currentTask.scenario}</p>
          </div>
        ` : ''}

        <!-- Vraagstelling -->
        <div class="text-left pt-0.5">
          <h4 class="text-xs font-extrabold text-stone-900 leading-snug">${currentTask.question}</h4>
        </div>

        <!-- Inhoud keuzes / interactie -->
        ${optionsHtml}

        <!-- Actieknoppen & Verleiding (ZONDER valstrik!) -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-submit-task-step" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>${currentStep === totalSteps ? 'Antwoord Bevestigen & Claim Item' : 'Volgende Taak'}</span>
          </button>
          <button type="button" id="btn-step-skip-video" class="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
            <span class="material-symbols-outlined text-base text-amber-700">play_circle</span>
            <span>Te saai? Kijk video om te skippen</span>
          </button>
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <button type="button" id="btn-step-cancel" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Terug naar item</span>
            </button>
            <button type="button" id="btn-step-to-map" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">map</span>
              <span>Naar campuskaart</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // Interactiviteit koppelen per type
    if (taskType === 'eliminate') {
      const chipBtns = modalContent.querySelectorAll('.eliminate-chip-btn');
      chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          const isElim = btn.classList.toggle('eliminated');
          const icon = btn.querySelector('.chip-icon');
          const text = btn.querySelector('.chip-text');
          if (isElim) {
            btn.classList.add('bg-rose-50', 'border-rose-400', 'ring-2', 'ring-rose-200');
            btn.classList.remove('bg-white', 'border-stone-200');
            if (icon) {
              icon.textContent = 'delete_forever';
              icon.classList.remove('text-stone-400');
              icon.classList.add('text-rose-600');
            }
            if (text) {
              text.classList.add('line-through', 'text-rose-800', 'opacity-60');
              text.classList.remove('text-stone-900');
            }
          } else {
            btn.classList.remove('bg-rose-50', 'border-rose-400', 'ring-2', 'ring-rose-200');
            btn.classList.add('bg-white', 'border-stone-200');
            if (icon) {
              icon.textContent = 'close';
              icon.classList.add('text-stone-400');
              icon.classList.remove('text-rose-600');
            }
            if (text) {
              text.classList.remove('line-through', 'text-rose-800', 'opacity-60');
              text.classList.add('text-stone-900');
            }
          }
        });
      });
    } else if (taskType === 'multi_select') {
      const multiBtns = modalContent.querySelectorAll('.multiselect-chip-btn');
      multiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          const isSel = btn.classList.toggle('selected');
          const icon = btn.querySelector('.multiselect-icon');
          if (isSel) {
            btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
            btn.classList.remove('bg-stone-50', 'border-stone-200');
            if (icon) {
              icon.textContent = 'check_box';
              icon.classList.remove('text-stone-300');
              icon.classList.add('text-emerald-700');
            }
          } else {
            btn.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
            btn.classList.add('bg-stone-50', 'border-stone-200');
            if (icon) {
              icon.textContent = 'check_box_outline_blank';
              icon.classList.add('text-stone-300');
              icon.classList.remove('text-emerald-700');
            }
          }
        });
      });
    } else {
      // Single choice
      const optionBtns = modalContent.querySelectorAll('.task-quiz-btn');
      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds) window.sounds.playClick();
          optionBtns.forEach(b => {
            b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
            const icon = b.querySelector('.status-icon');
            if (icon) {
              icon.textContent = 'radio_button_unchecked';
              icon.classList.remove('text-emerald-700');
              icon.classList.add('text-stone-300');
            }
          });

          btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
          const activeIcon = btn.querySelector('.status-icon');
          if (activeIcon) {
            activeIcon.textContent = 'check_circle';
            activeIcon.classList.remove('text-stone-300');
            activeIcon.classList.add('text-emerald-700');
          }

          selectedOptionCorrect = btn.getAttribute('data-correct') === 'true';
        });
      });
    }

    // Bevestig knop logica
    document.getElementById('btn-submit-task-step').addEventListener('click', () => {
      let isStepCorrect = false;

      if (taskType === 'eliminate') {
        const chipBtns = modalContent.querySelectorAll('.eliminate-chip-btn');
        const totalEliminated = Array.from(chipBtns).filter(b => b.classList.contains('eliminated')).length;
        if (totalEliminated === 0) {
          showToast('Klik eerst weg wat NIET nodig of NIET geschikt is!');
          return;
        }
        let match = true;
        chipBtns.forEach(b => {
          const mustEliminate = b.getAttribute('data-eliminate') === 'true';
          const isEliminated = b.classList.contains('eliminated');
          if (mustEliminate !== isEliminated) match = false;
        });
        isStepCorrect = match;
      } else if (taskType === 'multi_select') {
        const multiBtns = modalContent.querySelectorAll('.multiselect-chip-btn');
        const totalSelected = Array.from(multiBtns).filter(b => b.classList.contains('selected')).length;
        if (totalSelected === 0) {
          showToast('Selecteer minimaal één antwoord!');
          return;
        }
        let match = true;
        multiBtns.forEach(b => {
          const isCorrect = b.getAttribute('data-correct') === 'true';
          const isSelected = b.classList.contains('selected');
          if (isCorrect !== isSelected) match = false;
        });
        isStepCorrect = match;
      } else {
        if (selectedOptionCorrect === null) {
          showToast('Kies eerst een antwoord!');
          return;
        }
        isStepCorrect = (selectedOptionCorrect === true);
      }

      if (isStepCorrect) {
        if (currentStep < totalSteps) {
          if (window.sounds) window.sounds.playSuccess();
          showToast('Goed beantwoord! Ga door naar de volgende vraag.', 'success');
          state.itemTaskSequence.currentStep++;
          renderCurrentItemTaskStep(item);
        } else {
          // Alle 4 taken succesvol afgerond!
          state.itemTaskSequence = null;
          submitTaskAnswer(item, true);
        }
      } else {
        // FOUT ANTWOORD -> Cooldown straftijd!
        if (window.sounds) window.sounds.playError();
        showToast('Helaas, fout antwoord! Je krijgt 45s straftijd.', 'error');
        state.itemTaskSequence = null;
        submitTaskAnswer(item, false);
      }
    });

    document.getElementById('btn-step-skip-video').onclick = () => skipItemTasksWithVideo(item);
    document.getElementById('btn-step-cancel').onclick = () => {
      state.itemTaskSequence = null;
      openItemDetailModal(fullItem);
    };
    document.getElementById('btn-step-to-map').onclick = () => {
      state.itemTaskSequence = null;
      closeModal();
    };
  }

  function renderQuestionModal(item) {
    openItemTaskConfirmationModal(item);
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
          <button type="button" id="btn-captcha-back-to-map" onclick="window.closeModal ? window.closeModal() : window.playerApp.closeModal()" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar vorige pagina</span>
          </button>
        </div>
      </div>
    `;

    const btnBackToMap = document.getElementById('btn-captcha-back-to-map');
    if (btnBackToMap) {
      btnBackToMap.addEventListener('click', () => {
        closeModal();
      });
    }

    document.getElementById('btn-enter-code-now').addEventListener('click', () => {
      openItemDetailModal(item);
    });
  }

  // ==========================================
  // SCHERM 3: ITEM DETAIL POP-UP & 3 KNOPPEN
  // ==========================================
  function openItemDetailModal(item) {
    if (!item && state.activeItemId) item = ITEMS_DATA[state.activeItemId];
    if (!item) {
      closeModal();
      return;
    }
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

          </div>

          <!-- DE 3 KNOPPEN UIT DE DETAILS (Alle knoppen identiek qua stijl) -->
          <div class="w-full space-y-2.5 pt-1">
            <!-- KNOP 1: Doe taak voor item -->
            <button id="btn-submit-code" type="button" onclick="window.playerApp.submitCode()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <span>Doe taak voor item</span>
            </button>

            <!-- KNOP 2: Kijk video voor een hint (of 8 captchas) -->
            <button id="btn-open-hint-video" type="button" onclick="window.playerApp.openHintConfirmationModal()" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
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
    if (btnVideo) btnVideo.onclick = () => openHintConfirmationModal(item);
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

  // ==========================================
  // 8 CAPTCHAS OM EEN HINT TE ONTHULLEN
  // (OF: Korte video om te skippen -> Doomscroll valstrik zonder hint!)
  // ==========================================

  function openHintConfirmationModal(item) {
    if (!item) item = ITEMS_DATA[state.activeItemId];
    if (!item) return;
    state.activeItemId = item.id;
    state.activeModal = 'HINT_CONFIRM';

    // Als de speler deze hint al eerder heeft ontgrendeld, toon hem direct
    if (state.revealedHints && state.revealedHints[item.id]) {
      renderHintSuccessModal(item);
      return;
    }

    if (!state.hintCaptchaSequence || state.hintCaptchaSequence.itemId !== item.id) {
      state.hintCaptchaSequence = null;
    }

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl">lightbulb</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Geheime Hint</span>
          <h3 class="font-display text-xl font-black text-stone-900 mt-1">${item.name}</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Wil je een geheime hint voor de locatie of code? Hoe wil je deze ontgrendelen?
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <!-- KEUZE 1: 8 CAPTCHAS OPLOSSEN (EERLIJKE WEG) -->
          <button type="button" id="btn-start-hint-captchas" class="w-full p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-emerald-200 group-hover:scale-110 transition">password</span>
              <div>
                <div class="text-sm font-black">Los 8 Captcha's op</div>
                <div class="text-[11px] text-emerald-100 font-normal">Typ 8 snelle beveiligingscodes achter elkaar in om de hint eerlijk te lezen.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-emerald-200 text-lg">chevron_right</span>
          </button>

          <!-- KEUZE 2: SKIP MET KORTE VIDEO (VALSTRIK!) -->
          <button type="button" id="btn-skip-hint-video" class="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold shadow-sm active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-amber-600 group-hover:scale-110 transition">play_circle</span>
              <div>
                <div class="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <span>Korte video kijken om te skippen</span>
                  <span class="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Snel</span>
                </div>
                <div class="text-[11px] text-amber-800 font-normal">Geen zin in captchas? Kijk een korte video.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-amber-600 text-lg">arrow_forward</span>
          </button>

          <button type="button" id="btn-hint-back-to-item" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1 mt-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar item</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-start-hint-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      openConfirmHintCaptchaModal(item);
    });

    document.getElementById('btn-skip-hint-video').addEventListener('click', () => {
      skipHintWithVideo(item);
    });

    document.getElementById('btn-hint-back-to-item').addEventListener('click', () => {
      openItemDetailModal(item);
    });

    openModal();
  }

  function openConfirmHintCaptchaModal(item) {
    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl text-amber-600">help</span>
        </div>
        <div>
          <h3 class="font-display text-xl font-black text-stone-900">Weet je het zeker?</h3>
          <p class="text-xs text-stone-600 mt-2 leading-relaxed">
            Je staat op het punt om <strong>8 beveiligings-captchas</strong> achter elkaar op te lossen om een hint voor <strong>${item.name}</strong> te ontgrendelen.
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <button type="button" id="btn-confirm-start-hint-captchas" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Ja, start de 8 captchas</span>
          </button>

          <button type="button" id="btn-cancel-start-hint-captchas" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Nee, ga terug</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-confirm-start-hint-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      startHintCaptchaSequence(item);
    });

    document.getElementById('btn-cancel-start-hint-captchas').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      openHintChoiceModal(item);
    });
  }

  function skipHintWithVideo(item) {
    if (window.sounds) window.sounds.playError();
    // Reset voortgang van hint captchas
    state.hintCaptchaSequence = null;
    state.previousModalState = {
      type: 'ITEM_DETAIL',
      itemId: item.id
    };
    closeModal();
    openAppFeed('TikTok', item.id);
  }

  function startHintCaptchaSequence(item) {
    state.hintCaptchaSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8,
      challenges: generateUniqueCaptchaSequence(8)
    };
    renderCurrentHintCaptchaStep(item);
  }

  function renderCurrentHintCaptchaStep(item) {
    if (!state.hintCaptchaSequence) {
      startHintCaptchaSequence(item);
      return;
    }

    state.activeModal = 'HINT_CAPTCHA';
    const currentStep = state.hintCaptchaSequence.currentStep;
    const totalSteps = state.hintCaptchaSequence.totalSteps || 8;

    // Genereer elke stap een willekeurige, gevarieerde captcha uitdaging uit de 8 typen
    if (!state.hintCaptchaSequence.challenges || !state.hintCaptchaSequence.challenges.length) {
      state.hintCaptchaSequence.challenges = generateUniqueCaptchaSequence(totalSteps);
    }
    const challenge = state.hintCaptchaSequence.challenges[currentStep - 1];
    state.hintCaptchaSequence.currentChallenge = challenge;

    // 8 Voortgangsbolletjes om te zien hoe ver de speler is (zonder cijfertekst)
    const progressDotsHtml = [1, 2, 3, 4, 5, 6, 7, 8].map(s => `
      <div class="w-2.5 h-2.5 rounded-full transition-all ${
        s < currentStep
          ? 'bg-amber-600'
          : (s === currentStep ? 'bg-amber-500 ring-2 ring-amber-300 scale-125' : 'bg-stone-300')
      }"></div>
    `).join('');

    const widgetHtml = renderCaptchaWidgetHtml(challenge, 'hint');

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto" id="hint-captcha-container">
        
        <!-- Header met 8 voortgangsbollen (zonder cijfertekst) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-base">password</span>
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-800 uppercase tracking-wide block">Beveiligings-Captcha</span>
              <span class="text-[10px] font-bold text-amber-700 block">${item.name} Hint</span>
            </div>
          </div>
          <!-- 8 Voortgangsbolletjes -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 border border-stone-200/80">
            ${progressDotsHtml}
          </div>
        </div>

        <div>
          <h3 class="font-display text-lg font-black text-stone-900">${challenge.title}</h3>
          <p class="text-xs text-stone-600 mt-0.5 leading-snug">
            ${challenge.subTitle}
          </p>
        </div>

        <!-- Dynamische Captcha Widget (1 van de 8 types) -->
        ${widgetHtml}

        <!-- Knoppen & Valstrik -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-verify-hint-captcha" class="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>${currentStep === totalSteps ? 'Verifieer & Toon Hint' : 'Volgende Captcha'}</span>
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
    `;

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

  function renderHintSuccessModal(item) {
    if (window.sounds) window.sounds.playSuccess();
    state.activeModal = 'HINT_SUCCESS';

    const hintText = item.hintText || 'Zoek goed in de buurt van het aangegeven lokaal!';

    modalContent.innerHTML = `
      <div class="w-full bg-[#FFFDF9] rounded-3xl p-6 text-center space-y-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in-95">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow">
          <span class="material-symbols-outlined text-4xl">lightbulb</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">8 Captchas Voltooid</span>
          <h3 class="font-display text-lg font-black text-stone-900 mt-2">Geheime Hint Ontgrendeld!</h3>
        </div>
        <div class="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-center">
          <span class="text-xs text-amber-800 font-semibold block mb-0.5">Tip voor ${item.name}:</span>
          <span class="text-sm font-bold text-amber-950 leading-relaxed block">${hintText}</span>
        </div>
        <p class="text-xs text-stone-600 leading-snug">
          Gebruik deze tip om de fysieke code sneller te vinden en voer hem in!
        </p>
        <div class="pt-2">
          <button type="button" id="btn-hint-back-to-code" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-lg">pin</span>
            <span>Terug naar item & Code invoeren</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-hint-back-to-code').addEventListener('click', () => {
      openItemDetailModal(item);
    });
  }

  function openHintVideo(itemId = null) {
    const currentItem = itemId ? ITEMS_DATA[itemId] : ITEMS_DATA[state.activeItemId];
    if (currentItem) {
      openHintConfirmationModal(currentItem);
    }
  }

  // SCHERM 4: VRAAG / TAAK VERWERKING (Aangeroepen door renderQuestionItemTask)

  function submitTaskAnswer(item, selectedOptionCorrect) {
    state.itemTaskSequence = null;
    let isAnswerCorrect = false;

    if (typeof selectedOptionCorrect === 'boolean') {
      isAnswerCorrect = selectedOptionCorrect;
    } else if (item.questionType === 'amenity_filter') {
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
        showToast('Goed bezig! Je blijft gefocust op je doelen.', 'success');
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
      url: '/assets/videos/friday_chill.mp4',
      caption: 'De golven tijdens een gouden zonsondergang op vrijdagavond... 🌅🌊 Zet je geluid even lekker aan! #sunset #ocean #relax #chill',
      user: 'sunset_vibes_nl',
      avatar: 'https://i.pravatar.cc/150?img=11',
      loc: 'Scheveningen Strand',
      likes: 42100,
      sound: 'Origineel Geluid - Friday Sunset Chill (Akkoorden & Golven)',
      credits: 'Mozilla Open Web Media • Licentie: CC0 Public Domain'
    },
    {
      url: '/assets/videos/bear_stream.mp4',
      caption: 'Wat een natuurgeweld! Gigantische beer vangt verse vis in de woeste stroomversnelling 🐻🐟 #wildlife #nature #river #salmon',
      user: 'nature_wildlife_nl',
      avatar: 'https://i.pravatar.cc/150?img=33',
      loc: 'Nationaal Park',
      likes: 58400,
      sound: 'Origineel Geluid - Ruisende Bergrivier & Beer Plons',
      credits: 'W3C Open Media • Licentie: CC0 Public Domain'
    },
    {
      url: '/assets/videos/echo_music.mp4',
      caption: 'Onze nieuwe single "Here We Are" is uit! 🎸🔥 Wat vinden jullie van het refrein? #newmusic #indierock #vibes #live',
      user: 'echo_band_official',
      avatar: 'https://i.pravatar.cc/150?img=47',
      loc: 'TivoliVredenburg, Utrecht',
      likes: 71200,
      sound: 'Origineel Geluid - Echo: Here We Are (Vocal & Drums)',
      credits: 'Echo Band / MediaElement • Licentie: CC-BY Open Track'
    },
    {
      url: '/assets/videos/sintel_trailer.mp4',
      caption: 'Sintel: epische zoektocht van een dappere krijger door de besneeuwde bergen ⚔️🐉 Prachtige cinematische animatie! #sintel #openmovie #cgi',
      user: 'open_cinema_hub',
      avatar: 'https://i.pravatar.cc/150?img=53',
      loc: 'Open Media Hub',
      likes: 89400,
      sound: 'Origineel Geluid - Jan Morgenstern (Sintel Score & Dragon Roar)',
      credits: 'Blender Open Movie (Sintel) • Licentie: CC-BY 3.0'
    },
    {
      url: '/assets/videos/bunny_cartoon.mp4',
      caption: 'De legendarische Big Buck Bunny ontwaakt in het bos! 🐰🌳 100% gemaakt met open source 3D software! #blender3d #animation #openmovie',
      user: 'blender_open_anim',
      avatar: 'https://i.pravatar.cc/150?img=20',
      loc: 'Amsterdam 3D Studio',
      likes: 94300,
      sound: 'Origineel Geluid - Fluitende Vogels & Vrolijke Bunny Score',
      credits: 'Blender Foundation (Big Buck Bunny) • Licentie: CC-BY 3.0'
    },
    {
      url: '/assets/videos/movie_300.mp4',
      caption: 'Kijk naar die camerahoek en cinematische slow motion! 🎥💥 Prachtig staaltje actiewerk. #action #visuals #epic #slowmo',
      user: 'action_visuals_nl',
      avatar: 'https://i.pravatar.cc/150?img=22',
      loc: 'Filmstudio Amsterdam',
      likes: 63100,
      sound: 'Origineel Geluid - Hollywood Action Drums & Effects',
      credits: 'W3C HTML5 Video Test Suite • Licentie: CC-BY'
    },
    {
      url: '/assets/videos/oceans.mp4',
      caption: 'Duik mee in de diepblauwe oceaan tussen de dolfijnen en koraalriffen 🐬🌊 Onwerkelijk rustgevend! #oceanlife #marinelife #deepblue',
      user: 'deep_ocean_explorer',
      avatar: 'https://i.pravatar.cc/150?img=65',
      loc: 'Caribisch Nederland',
      likes: 112000,
      sound: 'Origineel Geluid - Ocean Symphony & Onderwater Ambience',
      credits: 'VideoJS Oceans Open Project • Licentie: Open Media'
    }
  ];

  const FAKE_DUTCH_COMMENTS = [
    { id: 'c1', user: 'lisa.kramer', avatar: 'https://i.pravatar.cc/150?img=1', text: 'Hahaha dit meen je niet 😂💀', time: '3u', likes: 24, liked: false },
    { id: 'c2', user: 'daan_vd', avatar: 'https://i.pravatar.cc/150?img=12', text: 'Waar is dit opgenomen?? Moeten we echt eens heen met z’n allen!', time: '5u', likes: 14, liked: false },
    { id: 'c3', user: 'sophie.99', avatar: 'https://i.pravatar.cc/150?img=5', text: 'Wauw, echt geweldige kwaliteit beelden 😍✨', time: '1d', likes: 38, liked: false },
    { id: 'c4', user: 'bram.student', avatar: 'https://i.pravatar.cc/150?img=8', text: 'Wie gaat er mee lunchen zo meteen? 👀🍕', time: '42m', likes: 9, liked: false },
    { id: 'c5', user: 'lars.visser', avatar: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%232563eb%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%3C%2Ftext%3E%3C%2Fsvg%3E', text: 'Volgende week gaan we hier ook heen gasten 🔥', time: '2u', likes: 17, liked: false }
  ];

  let activeCommentsList = [...FAKE_DUTCH_COMMENTS];

    // ==========================================
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${t.color1}"/>
          <stop offset="100%" stop-color="${t.color2}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <circle cx="${width / 2}" cy="${height / 2 - 30}" r="${Math.min(width, height) * 0.25}" fill="#ffffff" opacity="0.15"/>
      <text x="${width / 2}" y="${height / 2}" font-size="${Math.min(width, height) * 0.3}" text-anchor="middle" dominant-baseline="middle">${t.icon}</text>
      <text x="${width / 2}" y="${height / 2 + 100}" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1">${t.title}</text>
      <text x="${width / 2}" y="${height / 2 + 135}" font-family="sans-serif" font-weight="500" font-size="14" fill="#f8fafc" opacity="0.85" text-anchor="middle">${t.desc}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function getSvgAvatarDataUri(initial = '👤', bgHex = '#059669') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="avGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgHex}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#avGrad)" stroke="#ffffff" stroke-width="3"/>
      <text x="50" y="56" font-family="sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`;
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
  }

  // ==========================================
  // DOOMSCROLL TRAP GESCHIEDENIS STACK (BACK-NAVIGATIE ZONDER LOOPS)
  // ==========================================
  let viewHistory = [];
  let currentTrapView = null;
  let isPoppingTrapHistory = false;

  function pushTrapView(viewType, params = {}) {
    if (isPoppingTrapHistory) return;
    if (currentTrapView) {
      const last = viewHistory[viewHistory.length - 1];
      const isDuplicate = last && last.viewType === currentTrapView.viewType && JSON.stringify(last.params || {}) === JSON.stringify(currentTrapView.params || {});
      if (!isDuplicate) {
        viewHistory.push({ ...currentTrapView });
      }
    }
    currentTrapView = { viewType, params: params || {} };
  }

  function goBack() {
    if (window.sounds) window.sounds.playClick();
    document.querySelectorAll('video').forEach(v => {
      v.pause();
      try { v.currentTime = 0; } catch (e) { }
    });
    if (tiktokObserver) {
      tiktokObserver.disconnect();
      tiktokObserver = null;
    }
    if (instagramReelObserver) {
      instagramReelObserver.disconnect();
      instagramReelObserver = null;
    }
    if (viewHistory.length > 0) {
      const prev = viewHistory.pop();
      isPoppingTrapHistory = true;
      currentTrapView = prev;
      renderScreenByType(prev.viewType, prev.params);
      isPoppingTrapHistory = false;
    } else {
      currentTrapView = null;
      viewHistory = [];
      exitTrap();
    }
  }

  function renderScreenByType(viewType, params = {}) {
    const container = document.getElementById('app-view-container');
    if (!container) return;

    switch (viewType) {
      case 'instagram_feed':
        renderInstagramApp(container, 'feed');
        break;
      case 'instagram_explore':
        renderInstagramExplore(container);
        break;
      case 'instagram_activity':
        renderInstagramActivity(container);
        break;
      case 'instagram_profile':
        renderInstagramProfile(container);
        break;
      case 'instagram_dm':
        renderInstagramDM(container, 'inbox');
        break;
      case 'instagram_chat':
        if (params.chatId === 'moeder') {
          renderInstagramChatMoeder(container);
        } else {
          renderInstagramChatSarah(container);
        }
        break;
      case 'instagram_reel':
        renderInstagramReel(container, params.reelData, params.returnView || 'dm');
        break;
      case 'instagram_story':
        renderInstagramStory(container, params.storyUser, params.storyAvatar);
        break;
      case 'tiktok':
        renderTikTokApp(container, params.activeTab || 'foryou');
        break;
      case 'bereal':
        renderBeRealApp(container);
        break;
      case 'snapchat':
        renderSnapchatApp(container);
        break;
      case 'whatsapp_chats':
        renderWhatsAppChats(container);
        break;
      case 'whatsapp_chat':
        renderWhatsAppChat(container, params.chatId || 'moeder');
        break;
      default:
        renderInstagramApp(container, 'feed');
        break;
    }
  }

  function openAppFeed(appName = 'Instagram', originItemId = null) {
    state.inDoomscroll = true;
    state.currentApp = appName;
    state.trapStartTime = state.trapStartTime || Date.now();

    // Reset geschiedenis stack bij nieuwe binnenkomst vanuit de kaart
    viewHistory = [];
    currentTrapView = null;

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
      pushTrapView('whatsapp_chats');
      renderWhatsAppChats(appContainer);
    } else if (norm.includes('tiktok')) {
      pushTrapView('tiktok', { activeTab: 'foryou' });
      renderTikTokApp(appContainer, 'foryou');
    } else if (norm.includes('bereal')) {
      pushTrapView('bereal');
      renderBeRealApp(appContainer);
    } else if (norm.includes('snapchat')) {
      pushTrapView('snapchat');
      renderSnapchatApp(appContainer);
    } else {
      pushTrapView('instagram_feed');
      renderInstagramApp(appContainer, 'feed');
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
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <span class="font-instagram text-2xl tracking-wide text-white">Instagram</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.openInstagramTab('activity')" class="text-white hover:text-rose-500 transition" title="Meldingen">
              <span class="material-symbols-outlined text-[22px]">favorite</span>
            </button>
            <div class="relative cursor-pointer" onclick="window.playerApp.openInstagramDM()" title="Direct Berichten">
              <span class="material-symbols-outlined text-[22px]">send</span>
              <span class="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">1</span>
            </div>
          </div>
        </div>

        <!-- Stories Tray (Blijft binnen Instagram!) -->
        <div class="px-3 py-3 border-b border-stone-900 flex gap-3.5 overflow-x-auto overflow-y-hidden shrink-0 no-scrollbar">
          ${stories.map((s, i) => `
            <div class="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onclick="window.playerApp.openInstagramStory('${s.name}', '${s.img}')">
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
          <button type="button" class="text-white" onclick="window.playerApp.openInstagramTab('feed')" title="Feed"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('explore')" title="Zoeken"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openReelFromFeed(0)" title="Reels"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('activity')" title="Activiteit"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 hover:border-white cursor-pointer" onclick="window.playerApp.openInstagramTab('profile')" title="Profiel">
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
      const photoUrl = `${getSvgPostDataUri(igPostSeedCounter, 600, 600)}`;
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

  function openInstagramTab(tab) {
    pushTrapView('instagram_' + tab);
    renderInstagramApp(document.getElementById('app-view-container'), tab);
  }

  function openInstagramDM() {
    pushTrapView('instagram_dm');
    renderInstagramDM(document.getElementById('app-view-container'), 'inbox');
  }

  function openInstagramStory(storyUser, storyAvatar) {
    pushTrapView('instagram_story', { storyUser, storyAvatar });
    renderInstagramStory(document.getElementById('app-view-container'), storyUser, storyAvatar);
  }

  function openReelFromFeed(videoIndex = 0) {
    const vid = FEED_OPEN_VIDEOS[videoIndex % FEED_OPEN_VIDEOS.length];
    pushTrapView('instagram_reel', { reelData: vid, returnView: 'feed' });
    renderInstagramReel(document.getElementById('app-view-container'), vid, 'feed');
  }

  function openReelFromChat(videoIndex = 2, returnView = 'moeder', chatId = 'moeder') {
    const vid = FEED_OPEN_VIDEOS[videoIndex % FEED_OPEN_VIDEOS.length];
    pushTrapView('instagram_reel', { reelData: vid, returnView, chatId });
    renderInstagramReel(document.getElementById('app-view-container'), vid, returnView);
  }

  function openInstagramChat(chatId) {
    pushTrapView('instagram_chat', { chatId });
    const container = document.getElementById('app-view-container');
    if (chatId === 'moeder') {
      renderInstagramChatMoeder(container);
    } else {
      renderInstagramChatSarah(container);
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
        
        <!-- DM Inbox Header met Terugknop -->
        <div class="pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
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
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group bg-stone-950" onclick="window.playerApp.openInstagramChat('moeder')">
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
                <p class="text-xs text-white font-medium truncate pr-2">Heb je deze leuke video al gezien? 😂</p>
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              </div>
            </div>
          </div>

          <!-- BERICHT VAN SARAH VAN DIJK (Met Reel) -->
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group" onclick="window.playerApp.openInstagramChat('sarah')">
            <div class="relative w-13 h-13 rounded-full bg-stone-700 p-0.5 shrink-0">
              <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%23db2777%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ES%3C%2Ftext%3E%3C%2Fsvg%3E" class="w-full h-full rounded-full object-cover" alt="Sarah">
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
          <div class="p-3.5 flex items-center gap-3 hover:bg-stone-900/70 cursor-pointer transition active:scale-[0.99] group opacity-85" onclick="window.playerApp.openInstagramChat('sarah')">
            <div class="w-13 h-13 rounded-full bg-stone-800 p-0.5 shrink-0">
              <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%232563eb%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%3C%2Ftext%3E%3C%2Fsvg%3E" class="w-full h-full rounded-full object-cover" alt="Lars">
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white group-hover:text-rose-400 transition truncate">Lars Visser</span>
                <span class="text-[10px] text-stone-400">10 min</span>
              </div>
              <p class="text-xs text-stone-400 truncate mt-0.5">Ga je vanavond mee wat drinken in de stad? 🍕</p>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // CHAT MET MOEDER (ALLEEN LEUKE VIDEO & GEEN SCHOOL/SPEURTOCHT REFERENTIES)
  function renderInstagramChatMoeder(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        
        <!-- Chat Header met Terugknop naar Inbox -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug naar berichten">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-lg shadow">👩</div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Moeder ❤️</span>
              <span class="text-[10px] text-emerald-400 font-semibold">● Nu actief</span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-stone-400">
            <span class="material-symbols-outlined text-[20px]">videocam</span>
            <span class="material-symbols-outlined text-[20px]">call</span>
          </div>
        </div>

        <!-- Chat Berichten -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800 shadow">
            Heb je deze leuke video al gezien? 😂
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:30</span>
          </div>

          <!-- KLIKBARE REEL MET TERUGKEER NAAR DEZE CHAT -->
          <div class="max-w-[85%] rounded-2xl rounded-tl-none bg-stone-900 border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-emerald-400 transition transform active:scale-95 group" onclick="window.playerApp.openReelFromChat(4, 'moeder', 'moeder')">
            <div class="relative w-full h-44 bg-black overflow-hidden">
              <video src="${FEED_OPEN_VIDEOS[4].url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" autoplay loop muted playsinline></video>
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-black/75 border border-white/50 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition">
                  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
              <span class="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                🎬 Grappige animatie • 0:15
              </span>
              <span class="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <span>Tik om video te bekijken</span>
                <span class="material-symbols-outlined text-[11px]">arrow_forward</span>
              </span>
            </div>
            <div class="p-2.5 text-xs text-stone-200">
              <p class="font-medium">Kijk dit konijntje haha! 😂</p>
              <span class="text-[9px] text-stone-500 block text-right mt-1">12:32</span>
            </div>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800 shadow">
            Moest meteen aan jou denken haha! ❤️
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

  // CHAT MET SARAH (MET DE REEL EN TERUGKNOP NAAR INBOX)
  function renderInstagramChatSarah(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        
        <!-- DM Header met Terugknop naar Inbox -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug naar berichten">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-0.5 flex items-center justify-center">
              <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%23db2777%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ES%3C%2Ftext%3E%3C%2Fsvg%3E" class="w-full h-full rounded-full object-cover" alt="Sarah">
            </div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Sarah van Dijk</span>
              <span class="text-[10px] text-emerald-400 font-semibold">● Nu actief</span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-stone-400">
            <span class="material-symbols-outlined text-[20px]">videocam</span>
            <span class="material-symbols-outlined text-[20px]">call</span>
          </div>
        </div>

        <!-- Chat Berichten -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800">
            Hey! Kijk deze video die ik net zag 😂👇
            <span class="text-[9px] text-stone-500 block text-right mt-1">12:31</span>
          </div>

          <!-- GEDEELDE REEL KAART (KLIKBAAR MET TERUGMOGELIJKHEID NAAR DEZE CHAT!) -->
          <div class="max-w-[85%] rounded-2xl bg-stone-900/90 border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-white transition transform active:scale-95 group" onclick="window.playerApp.openReelFromChat(1, 'sarah', 'sarah')">
            <div class="relative w-full aspect-video bg-black overflow-hidden">
              <video src="${FEED_OPEN_VIDEOS[1].url}" class="w-full h-full object-cover group-hover:scale-105 transition" autoplay loop muted playsinline></video>
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white shadow-lg">
                  <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
              <span class="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                🎬 Beer in rivier • 0:15
              </span>
            </div>
            <div class="p-3 text-left space-y-1">
              <div class="text-xs font-bold text-white leading-tight">Natuur & Wildlife • Gigantische beer 🐻🐟</div>
              <div class="text-[10px] text-stone-400">@nature_wildlife_nl • 58.4K vind-ik-leuks</div>
              <div class="text-[10px] text-blue-400 font-bold pt-1 flex items-center gap-1">
                <span>Tik om video te bekijken</span>
                <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
              </div>
            </div>
          </div>

          <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-stone-900 text-xs text-stone-200 border border-stone-800">
            Echt geweldig haha! Laat weten wat je vindt!
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

  // ==========================================
  // UNIFIED API ENGINE VOOR ONEINDIGE REELS & AUDIO
  // ==========================================
  async function fetchReelsPage(cursor = 0, limit = 4, platform = 'instagram') {
    try {
      const res = await fetch(`/api/reels/feed?cursor=${cursor}&limit=${limit}&platform=${platform}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.reels) && data.reels.length > 0) {
        return data.reels;
      }
    } catch (e) {
      console.warn('API error, using local infinite generator:', e);
    }

    // Lokale generator indien offline (afwisselend video en unieke Picsum foto reels)
    const localReels = [];
    for (let idx = 0; idx < limit; idx++) {
      const i = cursor + idx;
      const v = FEED_OPEN_VIDEOS[i % FEED_OPEN_VIDEOS.length];
      const isImageReel = (i % 3 === 2);
      const seed = `reel_${platform}_${i}_${(i * 3571 + 104729) % 999999}`;
      const url = isImageReel ? `${getSvgPostDataUri(seed, 600, 900)}` : v.url;
      const mediaType = isImageReel ? 'image' : 'video';
      const audioUrl = v.audioUrl || v.url;

      localReels.push({
        id: `${platform}_reel_${i}`,
        index: i,
        mediaType,
        url,
        audioUrl,
        sound: v.sound || 'Origineel Geluid - Trending Beat 🎵',
        credits: isImageReel ? 'Picsum Photos CC0' : (v.credits || 'Open Media Hub'),
        user: v.user || `creator_${i}`,
        avatar: v.avatar || getRandomAvatarUrl(),
        caption: v.caption || 'Kijk deze video! 😂 #fyp #viral',
        likes: ((i * 4721 + 18200) % 95000) + 5200,
        dislikes: ((i * 83 + 120) % 450) + 15,
        commentsCount: ((i * 389 + 640) % 3500) + 120
      });
    }
    return localReels;
  }

  function createReelCardHtml(reel, platform = 'instagram') {
    const reelId = reel.id || `${platform}_reel_${reel.index || Math.random().toString(36).substring(2, 7)}`;
    if (!igUserLikes[reelId]) igUserLikes[reelId] = { count: reel.likes || 45200, liked: false };
    if (!igUserDislikes[reelId]) igUserDislikes[reelId] = { count: reel.dislikes || 320, disliked: false };

    const isImage = (reel.mediaType === 'image');
    const audioSrc = reel.audioUrl || reel.url || '/assets/videos/friday_chill.mp4';

    return `
      <div class="snap-feed-item relative w-full h-full shrink-0 flex flex-col justify-between overflow-hidden bg-black select-none" data-reel-id="${reelId}">
        <!-- Media Achtergrond (Video of Unieke Foto Reel met Looping Audio Element) -->
        <div class="absolute inset-0 bg-black">
          ${isImage ? `
            <img src="${reel.url}" alt="${reel.caption || 'Reel media'}" class="w-full h-full object-cover" loading="lazy">
            <video src="${audioSrc}" class="reel-video-el hidden" loop playsinline preload="metadata"></video>
          ` : `
            <video src="${reel.url}" class="reel-video-el w-full h-full object-cover" loop playsinline preload="metadata"></video>
          `}
          <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none"></div>
        </div>

        <div class="h-20"></div>

        <!-- Video Info & Knoppen Onderin -->
        <div class="relative z-20 pb-16 px-4 flex items-end justify-between">
          <div class="max-w-[75%] space-y-2 text-left">
            <div class="flex items-center gap-2">
              <img src="${reel.avatar || getRandomAvatarUrl()}" class="w-8 h-8 rounded-full object-cover border border-white/30" alt="${reel.user}">
              <span class="font-bold text-sm text-white drop-shadow">${reel.user}</span>
              <button type="button" class="border border-white/70 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white hover:bg-white hover:text-black transition cursor-pointer" onclick="window.playerApp.toggleFollowUser(this, '${reel.user}')">
                ${isUserFollowed(reel.user) ? '✓ Volgend' : 'Volgen'}
              </button>
            </div>
            <p class="text-xs text-white drop-shadow-md leading-snug">${reel.caption}</p>
            
            <div class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-stone-200">
              <span class="material-symbols-outlined text-[13px] text-emerald-400">music_note</span>
              <span class="truncate">${reel.sound}</span>
            </div>

            <div class="pt-0.5">
              <span class="text-[9px] text-stone-300 bg-black/75 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                ℹ️ ${reel.credits}
              </span>
            </div>
          </div>

          <!-- Actieknoppen Rechts: Like, Dislike, Comment, Deel -->
          <div class="flex flex-col items-center gap-3">
            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.toggleTikTokLike(this, '${reelId}')">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl tiktok-like-icon text-white" style="font-variation-settings: 'FILL' 0;">favorite_border</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow tiktok-like-count">${formatCount(igUserLikes[reelId].count)}</span>
            </button>

            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.toggleTikTokDislike(this, '${reelId}')">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl tiktok-dislike-icon text-stone-300" style="font-variation-settings: 'FILL' 0;">thumb_down</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow tiktok-dislike-count">Dislike</span>
            </button>

            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.openInstagramComments('${(reel.caption || '').replace(/'/g, "\\'")}', '${reel.user}')">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">chat_bubble</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow">${formatCount(reel.commentsCount || 1420)}</span>
            </button>

            <button type="button" class="flex flex-col items-center active:scale-125 transition text-white" onclick="window.playerApp.showShareMock()">
              <div class="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow">
                <span class="material-symbols-outlined text-2xl">share</span>
              </div>
              <span class="text-[10px] font-bold mt-1 text-white drop-shadow">Deel</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // REELS WEERGAVE MET ECHTE API & VOLLEDIG ONEINDIGE SCROLL FEED (MET AUDIO)
  let instagramReelObserver = null;
  let igReelsFeedCursor = 0;
  let isFetchingIgReels = false;

  function renderInstagramReel(container, initialReelData = null, returnView = 'dm') {
    closeInstagramComments();

    if (instagramReelObserver) {
      instagramReelObserver.disconnect();
      instagramReelObserver = null;
    }

    igReelsFeedCursor = 0;
    isFetchingIgReels = false;

    // Index bepalen van het startende item
    let initialIndex = 0;
    if (initialReelData && initialReelData.url) {
      const foundIdx = FEED_OPEN_VIDEOS.findIndex(v => v.url === initialReelData.url);
      if (foundIdx !== -1) initialIndex = foundIdx;
    } else if (typeof initialReelData === 'number') {
      initialIndex = initialReelData % FEED_OPEN_VIDEOS.length;
    }

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <!-- Header Bovenin met Duidelijke TERUGKNOP, Titel & Geluidsknop -->
        <div class="absolute top-0 left-0 right-0 z-30 pt-12 px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/80 active:scale-95 transition cursor-pointer" title="Terug naar vorige pagina">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          
          <span class="text-sm font-bold text-white drop-shadow tracking-wide">Reels</span>

          <button type="button" id="reel-mute-btn" onclick="window.playerApp.toggleTikTokAudio(this)" class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 cursor-pointer active:scale-95 transition" title="Geluid aan/uitzetten">
            <span class="material-symbols-outlined text-[18px]" id="reel-mute-icon">${state.reelsMuted ? 'volume_off' : 'volume_up'}</span>
          </button>
        </div>

        <!-- Verticale Scroll Feed (Oneindig door te scrollen via API) -->
        <div id="instagram-reels-feed" class="flex-1 overflow-y-scroll snap-y snap-mandatory select-none">
          <!-- Dynamisch gevuld via API & Oneindig scrollen -->
        </div>

      </div>
    `;

    const feedEl = document.getElementById('instagram-reels-feed');
    if (!feedEl) return;

    // Observer voor Instagram Reels (start uitsluitend zichtbare reel vanaf 0s met audio)
    instagramReelObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target.querySelector('.reel-video-el');
        if (!vid) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          feedEl.querySelectorAll('.reel-video-el').forEach(other => {
            if (other !== vid) {
              other.pause();
              try { other.currentTime = 0; } catch (e) { }
            }
          });

          try { vid.currentTime = 0; } catch (e) { }
          vid.muted = state.reelsMuted;
          vid.volume = 0.25;
          const p = vid.play();
          if (p !== undefined) {
            p.catch(() => {
              vid.muted = true;
              vid.play().catch(() => { });
            });
          }
        } else if (entry.intersectionRatio < 0.2) {
          vid.pause();
          try { vid.currentTime = 0; } catch (e) { }
        }
      });
    }, {
      root: feedEl,
      threshold: [0.1, 0.5, 0.8]
    });

    const appendReels = (reelsList) => {
      reelsList.forEach((r, idx) => {
        const d = document.createElement('div');
        d.innerHTML = createReelCardHtml(r, 'instagram');
        const itemEl = d.firstElementChild;
        if (initialIndex > 0 && idx === 0) {
          itemEl.id = 'ig-start-item';
        }
        feedEl.appendChild(itemEl);
        if (instagramReelObserver) {
          instagramReelObserver.observe(itemEl);
        }
      });
    };

    // Laad eerste batch
    const initialBatch = [];
    if (initialIndex > 0) {
      const startVideo = FEED_OPEN_VIDEOS[initialIndex];
      initialBatch.push({
        id: `instagram_start_${initialIndex}`,
        url: startVideo.url,
        sound: startVideo.sound,
        credits: startVideo.credits,
        user: startVideo.user,
        avatar: startVideo.avatar,
        caption: startVideo.caption,
        likes: startVideo.likes || 65200,
        dislikes: 120,
        commentsCount: 1800
      });
    }

    // Haal reels op via API
    fetchReelsPage(0, 5, 'instagram').then(apiReels => {
      appendReels(initialBatch.concat(apiReels));
      igReelsFeedCursor = 5;
    });

    // Oneindig scrollen: haal direct nieuwe video's op zodra speler naar onder scrollt
    feedEl.addEventListener('scroll', () => {
      if (isFetchingIgReels) return;
      if (feedEl.scrollTop + feedEl.clientHeight >= feedEl.scrollHeight - 800) {
        isFetchingIgReels = true;
        fetchReelsPage(igReelsFeedCursor, 4, 'instagram').then(moreReels => {
          igReelsFeedCursor += 4;
          appendReels(moreReels);
          isFetchingIgReels = false;
        }).catch(() => {
          isFetchingIgReels = false;
        });
      }
    });
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
            <button type="button" onclick="window.playerApp.goBack()" class="text-white hover:text-stone-300 p-1 cursor-pointer" title="Terug">
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
          <button type="button" onclick="window.playerApp.goBack()" class="text-white hover:text-stone-300">
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
          <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug naar feed">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div class="flex-1 flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <span class="material-symbols-outlined text-stone-400 text-lg">search</span>
            <input type="text" placeholder="Zoeken naar mensen, reels, audio..." class="bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none w-full">
          </div>
        </div>

        <!-- Explore Grid van Dynamische Video's -->
        <div class="flex-1 overflow-y-auto grid grid-cols-3 gap-0.5 pb-20">
          ${Array.from({ length: 15 }).map((_, idx) => {
      const vData = FEED_OPEN_VIDEOS[idx % FEED_OPEN_VIDEOS.length];
      return `
              <div class="aspect-square bg-stone-950 overflow-hidden relative cursor-pointer group hover:opacity-90 transition active:scale-95" onclick="window.playerApp.openReelFromFeed(${idx % FEED_OPEN_VIDEOS.length})">
                <video src="${vData.url}" class="w-full h-full object-cover pointer-events-none" muted loop playsinline autoplay preload="metadata"></video>
                <div class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition"></div>
                <span class="material-symbols-outlined absolute top-1.5 right-1.5 text-white text-sm drop-shadow pointer-events-none">movie</span>
                <span class="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/90 drop-shadow truncate max-w-[85%] pointer-events-none">@${vData.user}</span>
              </div>
            `;
    }).join('')}
        </div>

        <!-- Bottom Nav -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-12 bg-black/95 backdrop-blur-md border-t border-stone-800 flex items-center justify-around z-20 px-2">
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-white"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openReelFromFeed(0)"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('activity')"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 cursor-pointer" onclick="window.playerApp.openInstagramTab('profile')">
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
      { user: 'lars.visser', action: 'heeft je foto geliket.', time: '2d', avatar: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%232563eb%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%3C%2Ftext%3E%3C%2Fsvg%3E' }
    ];

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        <div class="pt-12 px-4 pb-3 border-b border-stone-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
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
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('explore')"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openReelFromFeed(0)"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-white"><span class="material-symbols-outlined text-2xl">favorite</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border border-stone-400 cursor-pointer" onclick="window.playerApp.openInstagramTab('profile')">
            <img src="${getRandomAvatarUrl()}" class="w-full h-full object-cover" alt="Profile">
          </button>
        </div>
      </div>
    `;
  }

  // INSTAGRAM PROFIEL TAB
  function renderInstagramProfile(container) {
    closeInstagramComments();

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto select-none">
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-black border-b border-stone-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition active:scale-95 border border-white/20 shrink-0" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <span class="font-bold text-sm">@${(state.playerName || 'speler').toLowerCase().replace(/\s+/g, '_')}</span>
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
            <div class="text-[11px] text-stone-300">Explore, connect & chill ✨</div>
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
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('feed')"><span class="material-symbols-outlined text-2xl">home</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('explore')"><span class="material-symbols-outlined text-2xl">search</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openReelFromFeed(0)"><span class="material-symbols-outlined text-2xl">movie</span></button>
          <button type="button" class="text-stone-400 hover:text-white" onclick="window.playerApp.openInstagramTab('activity')"><span class="material-symbols-outlined text-2xl">favorite_border</span></button>
          <button type="button" class="w-6 h-6 rounded-full overflow-hidden border-2 border-white cursor-pointer" onclick="window.playerApp.openInstagramTab('profile')">
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

  // 2. TIKTOK REELS INTERFACE (MET WERKEND VOLGEND / VOOR JOU TABBLAD & ONEINDIGE REELS VIA API)
  let currentTikTokTab = 'foryou';
  let tiktokObserver = null;
  let tiktokFeedCursor = 0;
  let isFetchingTikTok = false;

  function initTikTokObserver(feedEl) {
    if (tiktokObserver) {
      tiktokObserver.disconnect();
    }
    tiktokObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target.querySelector('.tiktok-video-el') || entry.target.querySelector('.reel-video-el');
        if (!vid) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Pauseer alle andere video's in de feed
          feedEl.querySelectorAll('.tiktok-video-el, .reel-video-el').forEach(other => {
            if (other !== vid) {
              other.pause();
              try { other.currentTime = 0; } catch (e) { }
            }
          });

          // Actieve video start altijd vanaf begin (0s) samen met audio
          try { vid.currentTime = 0; } catch (e) { }
          vid.muted = state.reelsMuted;
          vid.volume = 0.25;
          const p = vid.play();
          if (p !== undefined) {
            p.catch(() => {
              vid.muted = true;
              vid.play().catch(() => { });
            });
          }
        } else if (entry.intersectionRatio < 0.2) {
          vid.pause();
          try { vid.currentTime = 0; } catch (e) { }
        }
      });
    }, {
      root: feedEl,
      threshold: [0.1, 0.5, 0.8]
    });
  }

  function renderTikTokApp(container, activeTab = 'foryou') {
    currentTikTokTab = activeTab;
    const isFollowingTab = (activeTab === 'following');
    tiktokFeedCursor = 0;

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-black text-white max-w-md mx-auto relative select-none">
        
        <!-- TikTok Tabs Bovenin (Volgend & Voor jou interactief + Terugknop) -->
        <div class="pt-12 pb-2 px-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 to-transparent sticky top-0">
          <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition hover:bg-stone-800" title="Terug naar vorige pagina">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
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
          <!-- Dynamisch gevuld met 100% video's via API -->
        </div>

      </div>
    `;

    const feed = container.querySelector('#tiktok-feed-scroll');
    initTikTokObserver(feed);

    const appendReels = (reelsList) => {
      reelsList.forEach((r, idx) => {
        const d = document.createElement('div');
        if (isFollowingTab) {
          r.user = (idx % 2 === 0 ? 'sarah_vd' : r.user);
        }
        d.innerHTML = createReelCardHtml(r, 'tiktok');
        const itemEl = d.firstElementChild;
        feed.appendChild(itemEl);
        if (tiktokObserver) {
          tiktokObserver.observe(itemEl);
        }
      });
    };

    // Laad eerste batch via API
    fetchReelsPage(0, 5, 'tiktok').then(apiReels => {
      appendReels(apiReels);
      tiktokFeedCursor = 5;
    });

    // Oneindig scrollen: haal direct nieuwe video's op zodra speler naar onder scrollt
    feed.addEventListener('scroll', () => {
      if (isFetchingTikTok) return;
      if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 800) {
        isFetchingTikTok = true;
        fetchReelsPage(tiktokFeedCursor, 4, 'tiktok').then(moreReels => {
          tiktokFeedCursor += 4;
          appendReels(moreReels);
          isFetchingTikTok = false;
        }).catch(() => {
          isFetchingTikTok = false;
        });
      }
    });
  }

  function toggleTikTokAudio(btn) {
    state.reelsMuted = !state.reelsMuted;
    const vids = document.querySelectorAll('.tiktok-video-el, .reel-video-el, #active-reel-video');
    vids.forEach(v => {
      v.muted = state.reelsMuted;
      if (!state.reelsMuted) {
        v.volume = 0.25;
        v.play().catch(() => { });
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
    fetchReelsPage(tiktokFeedCursor, count, 'tiktok').then(reels => {
      tiktokFeedCursor += count;
      reels.forEach((r, idx) => {
        const d = document.createElement('div');
        if (isFollowingTab) {
          r.user = (idx % 2 === 0 ? 'sarah_vd' : r.user);
        }
        d.innerHTML = createReelCardHtml(r, 'tiktok');
        const itemEl = d.firstElementChild;
        feedEl.appendChild(itemEl);
        if (tiktokObserver) {
          tiktokObserver.observe(itemEl);
        }
      });
    });
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
        
        <!-- BeReal Header met Terugknop -->
        <div class="sticky top-0 z-30 pt-12 px-3 pb-2.5 bg-black/95 backdrop-blur-md flex items-center justify-between border-b border-stone-800">
          <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-stone-900/80 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition hover:bg-stone-800" title="Terug">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          
          <div class="flex flex-col items-center">
            <span class="font-extrabold text-xl tracking-tighter text-white">BeReal.</span>
            <span class="text-[10px] text-amber-400 font-bold">⚠️ 2 min te laat</span>
          </div>

          <div class="w-8"></div>
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

          <button type="button" onclick="window.playerApp.openInstagramTab('feed')" class="w-full py-3 bg-stone-800 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition hover:bg-stone-700">
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
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition hover:bg-black/80" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
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
            <p class="text-xs font-bold text-white tracking-wide">Wie gaat er vanavond mee wat drinken in de stad?? 🍹🍕</p>
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

  // ==========================================
  // 5. WHATSAPP BERICHTEN & MEERDERE REALISTISCHE CHATS
  // ==========================================
  const WHATSAPP_CHATS = [
    {
      id: 'moeder',
      name: 'Moeder ❤️',
      avatar: '👩',
      avatarBg: 'bg-emerald-700',
      isEmoji: true,
      status: 'online',
      time: '12:32',
      unread: 1,
      preview: 'Kijk deze video die oma net stuurde! 😂',
      messages: [
        { type: 'text', sender: 'them', text: 'Heb je deze leuke video al gezien? 😂', time: '12:30' },
        { type: 'video', sender: 'them', videoIndex: 2, caption: 'Kijk deze video die oma net stuurde! 😂', time: '12:32' },
        { type: 'text', sender: 'them', text: 'Moest meteen aan jou denken haha!', time: '12:33' }
      ]
    },
    {
      id: 'vriendengroep',
      name: 'Vriendengroep 🍕',
      avatar: '🍕',
      avatarBg: 'bg-amber-600',
      isEmoji: true,
      status: 'Liam, Emma, Sander...',
      time: '12:15',
      unread: 3,
      preview: 'Sander: Pizzeria klinkt top, wie is erbij? 🍕🍻',
      messages: [
        { type: 'text', sender: 'Liam', text: 'Gaan we vanavond nog wat drinken in de stad?', time: '12:08' },
        { type: 'text', sender: 'Emma', text: 'Ja gezellig!! Eerst terrasje of meteen hapje eten?', time: '12:11' },
        { type: 'text', sender: 'Sander', text: 'Pizzeria klinkt top, wie is er allemaal bij? 🍕🍻', time: '12:15' }
      ]
    },
    {
      id: 'sarah',
      name: 'Sarah van Dijk ✨',
      avatar: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%23db2777%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ES%3C%2Ftext%3E%3C%2Fsvg%3E',
      avatarBg: 'bg-stone-700',
      isEmoji: false,
      status: 'online',
      time: '11:58',
      unread: 1,
      preview: '🎬 Check deze clip ga helemaal stuk 😂',
      messages: [
        { type: 'text', sender: 'them', text: 'Hey! Alles goed vandaag?', time: '11:55' },
        { type: 'video', sender: 'them', videoIndex: 3, caption: 'Kijk deze clip haha, ga helemaal stuk 😂', time: '11:58' },
        { type: 'text', sender: 'them', text: 'Echt geniaal haha!', time: '11:59' }
      ]
    },
    {
      id: 'lars',
      name: 'Lars Visser ⚽',
      avatar: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22%232563eb%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2256%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%3C%2Ftext%3E%3C%2Fsvg%3E',
      avatarBg: 'bg-stone-800',
      isEmoji: false,
      status: 'online',
      time: '11:30',
      unread: 0,
      preview: 'Heb je die goal gisteren gezien?? 🔥',
      messages: [
        { type: 'text', sender: 'them', text: 'Yo! Heb je gisteren die goal in de 90e minuut gezien?? ⚽🔥', time: '11:28' },
        { type: 'text', sender: 'them', text: 'Echt niet normaal haha, we moeten snel weer een potje spelen man', time: '11:30' }
      ]
    },
    {
      id: 'thomas',
      name: 'Thomas 🎮',
      avatar: 'https://i.pravatar.cc/150?img=12',
      avatarBg: 'bg-purple-800',
      isEmoji: false,
      status: 'online',
      time: '11:12',
      unread: 0,
      preview: 'Ben je straks online voor een game?',
      messages: [
        { type: 'text', sender: 'them', text: 'Hey man, ben je straks online? Even een game spelen vanavond 🎮', time: '11:10' },
        { type: 'text', sender: 'them', text: 'Laat maar weten als je er bent!', time: '11:12' }
      ]
    }
  ];

  function openWhatsAppChat(chatId) {
    pushTrapView('whatsapp_chat', { chatId });
    renderWhatsAppChat(document.getElementById('app-view-container'), chatId);
  }

  function renderWhatsAppApp(container) {
    renderWhatsAppChats(container);
  }

  function renderWhatsAppChats(container) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-[#0b141a] text-white max-w-md mx-auto select-none">
        
        <!-- WhatsApp Inbox Header met Terugknop -->
        <div class="sticky top-0 z-30 pt-12 px-4 pb-3 bg-[#202c33] flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-3">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer active:scale-95 transition" title="Terug">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <span class="text-base font-bold text-white">WhatsApp</span>
          </div>
          <div class="flex items-center gap-3 text-stone-300">
            <span class="material-symbols-outlined text-[20px]">photo_camera</span>
            <span class="material-symbols-outlined text-[20px]">search</span>
            <span class="material-symbols-outlined text-[20px]">more_vert</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-[#202c33] px-4 flex items-center border-b border-stone-800 text-xs font-bold">
          <div class="flex-1 py-2.5 text-center text-[#00a884] border-b-2 border-[#00a884]">CHATS (${WHATSAPP_CHATS.length})</div>
          <div class="flex-1 py-2.5 text-center text-stone-400">STATUS</div>
          <div class="flex-1 py-2.5 text-center text-stone-400">OPROEPEN</div>
        </div>

        <!-- Chats Lijst met 5 verschillende gesprekken -->
        <div class="flex-1 overflow-y-auto divide-y divide-stone-800/60 text-left">
          ${WHATSAPP_CHATS.map(chat => `
            <div class="p-3.5 flex items-center gap-3 hover:bg-[#202c33]/50 cursor-pointer transition active:scale-[0.99]" onclick="window.playerApp.openWhatsAppChat('${chat.id}')">
              <div class="w-12 h-12 rounded-full ${chat.avatarBg} flex items-center justify-center text-2xl shadow shrink-0 overflow-hidden">
                ${chat.isEmoji ? chat.avatar : `<img src="${chat.avatar}" class="w-full h-full object-cover" alt="${chat.name}">`}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-white truncate">${chat.name}</span>
                  <span class="text-[10px] ${chat.unread > 0 ? 'text-[#00a884] font-bold' : 'text-stone-400 font-semibold'}">${chat.time}</span>
                </div>
                <div class="flex items-center justify-between mt-0.5">
                  <p class="text-xs ${chat.unread > 0 ? 'text-stone-200 font-medium' : 'text-stone-400'} truncate pr-2">${chat.preview}</p>
                  ${chat.unread > 0 ? `<span class="w-5 h-5 rounded-full bg-[#00a884] text-black text-[10px] font-bold flex items-center justify-center shrink-0 shadow">${chat.unread}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  }

  function renderWhatsAppChat(container, chatId = 'moeder') {
    const chat = WHATSAPP_CHATS.find(c => c.id === chatId) || WHATSAPP_CHATS[0];

    container.innerHTML = `
      <div class="w-full h-full flex flex-col bg-[#0b141a] text-white max-w-md mx-auto select-none">
        
        <!-- WhatsApp Chat Header met Terugknop naar Inbox -->
        <div class="sticky top-0 z-30 pt-12 px-3 pb-3 bg-[#202c33] flex items-center justify-between border-b border-stone-800">
          <div class="flex items-center gap-2 min-w-0">
            <button type="button" onclick="window.playerApp.goBack()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0" title="Terug naar chats">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div class="w-9 h-9 rounded-full ${chat.avatarBg} flex items-center justify-center text-lg font-bold shadow shrink-0 overflow-hidden">
              ${chat.isEmoji ? chat.avatar : `<img src="${chat.avatar}" class="w-full h-full object-cover" alt="${chat.name}">`}
            </div>
            <div class="flex flex-col text-left min-w-0">
              <span class="text-xs font-bold text-white truncate">${chat.name}</span>
              <span class="text-[10px] text-emerald-400 font-medium">${chat.status}</span>
            </div>
          </div>
          <div class="flex items-center gap-3 text-stone-300">
            <span class="material-symbols-outlined text-[20px]">videocam</span>
            <span class="material-symbols-outlined text-[20px]">call</span>
            <span class="material-symbols-outlined text-[20px]">more_vert</span>
          </div>
        </div>

        <!-- Chat Berichten -->
        <div class="flex-1 p-4 space-y-3 overflow-y-auto text-left">
          ${chat.messages.map(m => {
      if (m.type === 'text') {
        return `
                <div class="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-[#202c33] text-xs text-stone-100 shadow">
                  ${m.sender && m.sender !== 'them' ? `<span class="text-[11px] font-bold text-[#00a884] block mb-0.5">${m.sender}</span>` : ''}
                  ${m.text}
                  <span class="text-[9px] text-stone-400 block text-right mt-1">${m.time}</span>
                </div>
              `;
      } else if (m.type === 'video') {
        const vObj = FEED_OPEN_VIDEOS[m.videoIndex % FEED_OPEN_VIDEOS.length];
        return `
                <div class="max-w-[85%] rounded-2xl rounded-tl-none bg-[#202c33] border border-stone-700 overflow-hidden shadow-xl cursor-pointer hover:border-[#00a884] transition transform active:scale-95 group" onclick="window.playerApp.openReelFromChat(${m.videoIndex}, 'whatsapp', '${chat.id}')">
                  <div class="relative w-full h-44 bg-black overflow-hidden">
                    <video src="${vObj.url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" autoplay loop muted playsinline></video>
                    <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div class="w-12 h-12 rounded-full bg-black/75 border border-white/50 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition">
                        <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                      </div>
                    </div>
                    <span class="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                      🎬 Video Clip
                    </span>
                    <span class="absolute bottom-2 right-2 bg-[#00a884] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <span>Bekijk video</span>
                      <span class="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </span>
                  </div>
                  <div class="p-2.5 text-xs text-stone-100">
                    <p class="font-medium">${m.caption}</p>
                    <span class="text-[9px] text-stone-400 block text-right mt-1">${m.time}</span>
                  </div>
                </div>
              `;
      }
      return '';
    }).join('')}
        </div>

        <!-- Input balk -->
        <div class="p-3 bg-[#202c33] flex items-center gap-2">
          <input type="text" placeholder="Typ een bericht..." class="flex-1 bg-[#2a3942] border border-transparent rounded-full py-2 px-3.5 text-xs text-white placeholder-stone-400 focus:outline-none">
          <div class="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white cursor-pointer active:scale-95 transition" onclick="if(window.sounds) window.sounds.playClick()">
            <span class="material-symbols-outlined text-[18px]">send</span>
          </div>
        </div>

      </div>
    `;
  }

  function exitTrap() {
    document.querySelectorAll('video').forEach(v => {
      v.pause();
      try { v.currentTime = 0; } catch (e) { }
    });
    if (tiktokObserver) {
      tiktokObserver.disconnect();
      tiktokObserver = null;
    }
    if (instagramReelObserver) {
      instagramReelObserver.disconnect();
      instagramReelObserver = null;
    }
    const secondsSpent = Math.round((Date.now() - (state.trapStartTime || Date.now())) / 1000);
    state.inDoomscroll = false;
    viewHistory = [];
    currentTrapView = null;
    socket.emit('player:exit_doomscroll', { secondsSpent });
    screens.doomscrollTrap.classList.add('hidden');
    showScreen('gameplay');
    if (window.sounds) window.sounds.playClick();

    // Als de speler vanuit een taak- of hintmodal kwam, heropen deze vorige pagina netjes!
    if (state.previousModalState) {
      const prev = state.previousModalState;
      state.previousModalState = null;
      const itm = (typeof ITEMS_DATA !== 'undefined' ? ITEMS_DATA[prev.itemId] : null)
        || (state.limitedItems && state.limitedItems[prev.itemId])
        || (state.generalItems && state.generalItems[prev.itemId]);
      if (itm) {
        if (prev.type === 'CAPTCHA_LOCATION') {
          openCaptchaLocationModal(itm);
        } else {
          openItemDetailModal(itm);
        }
      }
    }
  }

  function setupTrapExitHandler() {
    const exitBtn = document.getElementById('trap-exit-btn');
    if (!exitBtn) return;

    exitBtn.addEventListener('click', () => {
      goBack();
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
          docEl.requestFullscreen().catch(() => { });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (document.body.webkitRequestFullscreen) {
          document.body.webkitRequestFullscreen();
        }
      } else if (!isZoomedActive && isNativeFs) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
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
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Begrepen, terug naar vorige pagina</span>
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
    } else if (document.getElementById('loc-captcha-container') || document.getElementById('hint-captcha-container')) {
      // Tik naast een captcha: eerst vragen, anders gaat alle voortgang verloren
      showCaptchaLeaveConfirm('captcha');
    } else if (state.activeModal === 'ITEM_TASK' && state.itemTaskSequence) {
      // Tik naast een taak: anders is de reeks opgeloste taken weg
      showCaptchaLeaveConfirm('task');
    } else {
      closeModal();
    }
  }

  function showCaptchaLeaveConfirm(kind = 'captcha') {
    const what = kind === 'task' ? 'Je voortgang bij de taken (je reeks opgeloste taken) wordt gereset' : "Je voortgang bij de captcha's wordt gereset";
    if (document.getElementById('captcha-leave-confirm')) return;
    const box = document.createElement('div');
    box.id = 'captcha-leave-confirm';
    box.className = 'fixed inset-0 z-[60] bg-stone-950/60 flex items-center justify-center p-6';
    box.innerHTML = `
      <div class="w-full max-w-[320px] bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 p-5 text-center space-y-3">
        <span class="material-symbols-outlined text-amber-600 text-4xl">warning</span>
        <h3 class="font-display text-base font-black text-stone-900">Weet je zeker dat je wilt stoppen?</h3>
        <p class="text-xs text-stone-600">${what} en je moet daarna opnieuw beginnen.</p>
        <button type="button" data-act="stay" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm active:scale-95 transition cursor-pointer">Nee, ga verder</button>
        <button type="button" data-act="leave" class="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-rose-700 font-semibold text-xs transition cursor-pointer">Ja, stoppen (voortgang reset)</button>
      </div>`;
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.getAttribute('data-act');
      if (e.target === box || act === 'stay') { box.remove(); return; }
      if (act === 'leave') {
        box.remove();
        state.locationCaptchaSequence = null;
        state.hintCaptchaSequence = null;
        state.itemTaskSequence = null;
        closeModal();
      }
    });
    document.body.appendChild(box);
  }

  function openModal() {
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    state.activeModal = null;
    if (!state.inDoomscroll && state.gameStatus === 'PLAYING') {
      showScreen('gameplay');
    }
  }
  window.closeModal = closeModal;

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const borderCol = type === 'error' ? 'border-rose-500' : type === 'success' ? 'border-emerald-500' : type === 'warning' ? 'border-amber-500' : 'border-stone-700';
    toast.className = `fixed bottom-16 left-4 right-4 z-50 p-3.5 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border ${borderCol} flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto select-none`;
    toast.innerHTML = `
      <span class="flex-1 mr-2">${message}</span>
      <button type="button" class="text-stone-400 hover:text-white p-1">✕</button>
    `;
    const toastCloseBtn = toast.querySelector('button');
    if (toastCloseBtn) toastCloseBtn.addEventListener('click', () => toast.remove());
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  
  // ==========================================
  // 2D MODEL CHARACTER GENERATOR & MOBIEL WINNAARS PODIUM
  // 3e Plaats: Speler helemaal ingedoken in telefoon door doomscrollen
  // 2e Plaats: Speler minder in telefoon, meer overeind
  // 1e Plaats: Speler zonder telefoon, geslaagd met diploma kleding & baret
  // ==========================================
  function createPlayer2DModelSvg(place, avatar) {
    const av = avatar || '🎒';

    if (place === 3) {
      return `
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
          <text x="0" y="9" font-size="28" text-anchor="middle">${av}</text>
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
      `;
    }

    if (place === 2) {
      return `
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
          <text x="0" y="10" font-size="30" text-anchor="middle">${av}</text>
        </g>

        <!-- Smartphone laag gehouden -->
        <g transform="translate(68, 126)">
          <rect x="0" y="0" width="24" height="32" rx="4" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
          <rect x="2" y="3" width="20" height="26" rx="2" fill="#0f172a"/>
        </g>
      </svg>
      `;
    }

    // 1e Plaats: Geslaagd, Baret, Diploma, geen telefoon!
    return `
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
        <text x="0" y="10" font-size="30" text-anchor="middle">${av}</text>
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
    `;
  }

  let mobilePodiumTimeouts = [];
  function clearMobilePodiumTimeouts() {
    mobilePodiumTimeouts.forEach(t => clearTimeout(t));
    mobilePodiumTimeouts = [];
  }

  function renderMobilePodium(leaderboard) {
    const grid = document.getElementById('mobile-podium-grid');
    if (!grid) return;

    // Gedeeld podium: exact hetzelfde als het digibord, alleen compacter
    if (window.SharedPodium) {
      clearMobilePodiumTimeouts();
      window.SharedPodium.render(grid, leaderboard, { compact: true });
      return;
    }

    clearMobilePodiumTimeouts();
    grid.innerHTML = '';

    const list = Array.isArray(leaderboard) ? leaderboard : [];
    const top1 = list[0] || null;
    const top2 = list[1] || null;
    const top3 = list[2] || null;

    const buildSlotHtml = (cfg) => {
      const p = cfg.player;
      const modelSvg = createPlayer2DModelSvg(cfg.rank, p ? p.avatar : '👤');
      return `
        <div id="m-podium-${cfg.rank}" class="flex flex-col items-center opacity-0 transform translate-y-6 transition-all duration-700 ease-out">
          <!-- 2D Speler Model -->
          <div class="relative w-16 h-16 sm:w-20 sm:h-20 mb-1.5 filter drop-shadow-md">
            ${modelSvg}
            <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-xs shadow-sm">
              ${cfg.medal}
            </div>
          </div>

          <!-- Spelersnaam & Score -->
          <div class="text-center w-full px-1 mb-1">
            <span class="block text-xs font-black text-white truncate max-w-[90px] mx-auto">${p ? p.name : 'Niemand'}</span>
            <span class="block text-[10px] font-bold text-amber-300 font-mono">${p ? `${p.score} pt` : '-'}</span>
          </div>

          <!-- Podium Pilaar -->
          <div class="w-full ${cfg.pillarHeight} ${cfg.pillarColor} rounded-t-xl border-t border-x flex flex-col items-center justify-start pt-1.5 shadow-md">
            <span class="text-xs font-black">${cfg.rank}</span>
            <span class="text-[8px] font-bold uppercase tracking-wider opacity-80">${cfg.rank === 1 ? 'Goud' : cfg.rank === 2 ? 'Zilver' : 'Brons'}</span>
          </div>
        </div>
      `;
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

    grid.innerHTML = `
      ${buildSlotHtml(cfg2)}
      ${buildSlotHtml(cfg1)}
      ${buildSlotHtml(cfg3)}
    `;

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

  function showGameOverScreen(data) {
    document.getElementById('game-over-reason').textContent = data.reason;
    document.getElementById('final-player-score').textContent = `${state.score} pt`;
    document.getElementById('final-player-items').textContent = `${(state.claimedItems || []).length} / 8`;
    document.getElementById('final-self-control').textContent = `${state.stats.selfControlRewards || 0}x`;
    document.getElementById('final-doomscroll-time').textContent = `${state.stats.doomscrollSeconds || 0}s`;

    if (Array.isArray(data.leaderboard)) state.lastLeaderboard = data.leaderboard;
    state.podiumShown = true;
    renderMobilePodium(state.lastLeaderboard || []);
    showScreen('gameOver');
  }

  // ==========================================
  // GLOBALE EXPORT VOOR INLINE HANDLERS
  // ==========================================
  window.playerApp = {
    goBack,
    selectAvatar,
    joinGame,
    submitCode,
    openHintVideo,
    openHintConfirmationModal,
    openCaptchaLocationModal,
    openItemDetailModal,
    openItemTaskConfirmationModal,
    closeModal,
    openModal,
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
    openInstagramTab,
    openInstagramDM,
    openInstagramStory,
    openInstagramChat,
    openReelFromFeed,
    openReelFromChat,
    renderWhatsAppApp,
    renderWhatsAppChats,
    renderWhatsAppChat,
    openWhatsAppChat,
    renderTikTokApp,
    toggleFollowUser,
    isUserFollowed,
    nextInstagramReel,
    scrollToNextTikTokReel,
    openFollowingListModal,
    leaveLobby,
    exitTrap,
    closeModal,
    openModal,
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

  // Globale helpers op window
  window.closeModal = closeModal;
  window.openItemDetailModal = openItemDetailModal;

  // Start initialisatie wanneer DOM gereed is
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
