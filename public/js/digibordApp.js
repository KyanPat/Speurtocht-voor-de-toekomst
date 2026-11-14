// Digibord & Admin Controller voor Doomscroll Escape
(function () {
  const socket = io();

  const state = {
    status: 'LOBBY',
    timeRemaining: 900,
    totalDuration: 900,
    formattedTime: '15:00',
    limitedItemsMaxClaims: 1,
    limitedItems: {},
    generalItems: {},
    leaderboard: [],
    activityLog: [],
    jobRaiseUnlockSecondsLeft: 60,
    trouwenUnlockSecondsLeft: 60,
    qrUrl: '',
    qrSvg: ''
  };

  const ALL_ITEM_IDS = [
    'autosleutels',
    'huissleutels',
    'diploma',
    'droomreis',
    'job_interview',
    'job_raise',
    'date',
    'trouwen'
  ];

  // DOM Secties
  const views = {
    lobby: document.getElementById('digibord-lobby-view'),
    active: document.getElementById('digibord-active-view'),
    ended: document.getElementById('digibord-ended-view')
  };

  const statusBadge = document.getElementById('board-status-badge');
  const statusText = document.getElementById('board-status-text');

  // Modals
  const settingsModal = document.getElementById('modal-settings');
  const qrFullscreenModal = document.getElementById('modal-qr-fullscreen');

  function init() {
    setupControls();
    setupFullscreen();
    setupQrLogic();
    setupSettingsModal();

    socket.on('connect', () => {
      console.log('Digibord verbonden met server!');
    });

    socket.on('state:sync', (data) => {
      state.status = data.status;
      state.timeRemaining = data.timeRemaining;
      state.totalDuration = data.totalDuration || 900;
      state.formattedTime = data.formattedTime;
      state.limitedItems = data.limitedItems || {};
      state.generalItems = data.generalItems || {};
      state.leaderboard = data.leaderboard || [];
      state.jobRaiseUnlockSecondsLeft = data.jobRaiseUnlockSecondsLeft;
      if (data.limitedItemsMaxClaims) state.limitedItemsMaxClaims = data.limitedItemsMaxClaims;
      if (data.activityLog) state.activityLog = data.activityLog;

      syncItemsData();
      renderLobbyLocations();
      updateView();
    });

    socket.on('timer:tick', (data) => {
      state.timeRemaining = data.timeRemaining;
      state.formattedTime = data.formattedTime;
      if (data.jobRaiseUnlockSecondsLeft !== undefined) {
        state.jobRaiseUnlockSecondsLeft = data.jobRaiseUnlockSecondsLeft;
      }
      if (data.trouwenUnlockSecondsLeft !== undefined) {
        state.trouwenUnlockSecondsLeft = data.trouwenUnlockSecondsLeft;
      }
      updateTimer();
    });

    socket.on('activity:new', (entry) => {
      state.activityLog.unshift(entry);
      if (state.activityLog.length > 50) state.activityLog.pop();
      renderActivityFeed();
    });

    socket.on('game:ended', (data) => {
      state.status = 'ENDED';
      state.leaderboard = data.leaderboard;
      updateView();
      renderPodium(data.leaderboard, data.reason);
      if (window.sounds) window.sounds.playLimitedClaim();
    });

    socket.on('game:reset', (data) => {
      state.status = 'LOBBY';
      state.timeRemaining = data.timeRemaining || (data.totalDuration || 900);
      state.totalDuration = data.totalDuration || 900;
      state.formattedTime = data.formattedTime || '15:00';
      state.limitedItems = data.limitedItems || {};
      state.generalItems = data.generalItems || {};
      state.leaderboard = data.leaderboard || [];
      state.activityLog = [];

      syncItemsData();
      renderLobbyLocations();
      updateView();
      if (window.sounds) window.sounds.playSuccess();
    });

    socket.on('settings:updated', (data) => {
      state.limitedItems = data.limitedItems || state.limitedItems;
      state.generalItems = data.generalItems || state.generalItems;
      if (data.totalDuration) {
        state.totalDuration = data.totalDuration;
        if (state.status === 'LOBBY') {
          state.timeRemaining = data.totalDuration;
          const m = Math.floor(data.totalDuration / 60);
          state.formattedTime = `${m.toString().padStart(2, '0')}:00`;
        }
      }
      syncItemsData();
      renderLobbyLocations();
      if (!settingsModal.classList.contains('hidden')) {
        renderSettingsInputs();
      }
    });

    socket.on('item:limited_claimed', () => {
      if (window.sounds) window.sounds.playLimitedClaim();
    });
  }

  function syncItemsData() {
    if (typeof ITEMS_DATA === 'undefined') return;
    ALL_ITEM_IDS.forEach(id => {
      const serverItem = state.limitedItems[id] || state.generalItems[id];
      if (serverItem && ITEMS_DATA[id]) {
        if (serverItem.secretLocation) ITEMS_DATA[id].secretLocation = serverItem.secretLocation;
        if (serverItem.location) ITEMS_DATA[id].location = serverItem.location;
        if (serverItem.code) ITEMS_DATA[id].code = serverItem.code;
        if (serverItem.maxClaims) ITEMS_DATA[id].maxClaims = serverItem.maxClaims;
      }
    });
  }

  // ==========================================
  // QR CODE & LINK BEHEER (ECHTE SCANNABLE QR)
  // ==========================================
  async function setupQrLogic() {
    // 1. Toon direct de live publieke URL van de browser (werkt op Render.com, lokaal en elk domein)
    const browserOriginUrl = window.location.origin + '/';
    state.qrUrl = browserOriginUrl;

    const joinUrlEl = document.getElementById('join-url-display');
    const settingJoinUrlEl = document.getElementById('setting-join-url');
    const fsQrUrlEl = document.getElementById('fullscreen-qr-url');
    const qrBox = document.getElementById('lobby-qr-code-box');
    const fsQrContainer = document.getElementById('fullscreen-qr-container');

    if (joinUrlEl) joinUrlEl.textContent = browserOriginUrl;
    if (settingJoinUrlEl) settingJoinUrlEl.value = browserOriginUrl;
    if (fsQrUrlEl) fsQrUrlEl.textContent = browserOriginUrl;

    try {
      // Vraag de QR-code op voor de actuele browser URL (voorkomt localhost op Render)
      const res = await fetch(`/api/qr?url=${encodeURIComponent(browserOriginUrl)}`);
      const data = await res.json();
      if (data.success) {
        state.qrUrl = data.url;
        state.qrSvg = data.svg;

        if (joinUrlEl) joinUrlEl.textContent = data.url;
        if (settingJoinUrlEl) settingJoinUrlEl.value = data.url;
        if (fsQrUrlEl) fsQrUrlEl.textContent = data.url;

        if (qrBox) {
          qrBox.innerHTML = data.svg;
          const svgEl = qrBox.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');
          }
        }

        if (fsQrContainer) {
          fsQrContainer.innerHTML = data.svg;
          const svgEl = fsQrContainer.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');
          }
        }
      }
    } catch (err) {
      console.warn('Kon dynamische QR niet ophalen:', err);
    }

    // Klikken op QR om te vergroten voor beamer
    const btnEnlargeQr = document.getElementById('btn-enlarge-qr');
    const btnCloseFsQr = document.getElementById('btn-close-qr-fullscreen');
    const btnDoneFsQr = document.getElementById('btn-done-qr');

    if (qrBox) qrBox.addEventListener('click', openFullscreenQr);
    if (btnEnlargeQr) btnEnlargeQr.addEventListener('click', openFullscreenQr);
    if (btnCloseFsQr) btnCloseFsQr.addEventListener('click', closeFullscreenQr);
    if (btnDoneFsQr) btnDoneFsQr.addEventListener('click', closeFullscreenQr);

    if (qrFullscreenModal) {
      qrFullscreenModal.addEventListener('click', (e) => {
        if (e.target === qrFullscreenModal) closeFullscreenQr();
      });
    }

    // Kopieer knoppen
    setupCopyButton('btn-copy-main-url');
    setupCopyButton('btn-copy-join-url');
  }

  function setupCopyButton(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const url = state.qrUrl || window.location.origin;
      navigator.clipboard.writeText(url).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ Gekopieerd!';
        btn.classList.add('bg-emerald-600', 'text-white');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('bg-emerald-600', 'text-white');
        }, 1800);
      }).catch(() => {
        prompt('Kopieer link:', url);
      });
    });
  }

  function openFullscreenQr() {
    if (qrFullscreenModal) qrFullscreenModal.classList.remove('hidden');
  }

  function closeFullscreenQr() {
    if (qrFullscreenModal) qrFullscreenModal.classList.add('hidden');
  }

  // ==========================================
  // SPELINSTELLINGEN & LOCATIES MODAL
  // ==========================================
  function setupSettingsModal() {
    const btnHeaderSettings = document.getElementById('btn-header-settings');
    const btnLobbySettings = document.getElementById('btn-lobby-settings');
    const btnQuickEdit = document.getElementById('btn-lobby-quick-edit-locations');
    const btnClose = document.getElementById('btn-close-settings');
    const btnCancel = document.getElementById('btn-cancel-settings');
    const btnSave = document.getElementById('btn-save-settings');
    const btnReset = document.getElementById('btn-reset-defaults');

    const openModal = () => {
      renderSettingsInputs();
      if (settingsModal) settingsModal.classList.remove('hidden');
    };

    const closeModal = () => {
      if (settingsModal) settingsModal.classList.add('hidden');
    };

    if (btnHeaderSettings) btnHeaderSettings.addEventListener('click', openModal);
    if (btnLobbySettings) btnLobbySettings.addEventListener('click', openModal);
    if (btnQuickEdit) btnQuickEdit.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        saveSettings(closeModal);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je alle locaties en codes wilt resetten naar de standaardwaarden?')) {
          socket.emit('settings:reset', () => {
            renderSettingsInputs();
            renderLobbyLocations();
            alert('Standaardwaarden succesvol hersteld!');
          });
        }
      });
    }
  }

  function renderSettingsInputs() {
    const container = document.getElementById('settings-items-list');
    const durationSelect = document.getElementById('setting-game-duration');
    if (!container) return;

    if (durationSelect) {
      const currentMins = Math.round(state.totalDuration / 60);
      durationSelect.value = String(currentMins);
    }

    container.innerHTML = '';

    ALL_ITEM_IDS.forEach(id => {
      const localItem = typeof ITEMS_DATA !== 'undefined' ? ITEMS_DATA[id] : null;
      const serverItem = state.limitedItems[id] || state.generalItems[id] || {};
      const name = serverItem.name || localItem?.name || id;
      const isLimited = serverItem.isLimited !== undefined ? serverItem.isLimited : (localItem?.isLimited || false);
      const location = (isLimited && (serverItem.secretLocation || localItem?.secretLocation))
        ? (serverItem.secretLocation || localItem?.secretLocation)
        : (serverItem.location || localItem?.location || '');
      const code = serverItem.code || localItem?.code || '';
      const icon = localItem?.icon || 'explore';

      const card = document.createElement('div');
      card.className = 'bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-2.5';
      const itemMaxClaims = serverItem.maxClaims || state.limitedItemsMaxClaims || 1;

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-emerald-400 text-lg">${icon}</span>
            <span class="text-xs font-bold text-white truncate">${name}</span>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isLimited ? 'bg-amber-950 text-amber-300 border border-amber-600/40' : 'bg-stone-800 text-stone-300'}">
            ${isLimited ? `Limited Item` : 'Algemeen'}
          </span>
        </div>

        <div class="grid ${isLimited ? 'grid-cols-5' : 'grid-cols-3'} gap-2">
          <div class="${isLimited ? 'col-span-2' : 'col-span-2'}">
            <label class="block text-[10px] text-stone-400 font-semibold mb-1">
              ${isLimited ? 'Geheime Locatie (vindplek)' : 'Fysieke Locatie'}
            </label>
            <input type="text" id="setting-loc-${id}" value="${location}" placeholder="Bijv. Kantine, Aula, Lokaal..." class="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
          </div>
          <div class="${isLimited ? 'col-span-2' : 'col-span-1'}">
            <label class="block text-[10px] text-stone-400 font-semibold mb-1">Code (4 cijfers)</label>
            <input type="text" id="setting-code-${id}" value="${code}" maxlength="4" placeholder="4222" class="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500">
          </div>
          ${isLimited ? `
          <div class="col-span-1">
            <label class="block text-[10px] text-amber-400 font-semibold mb-1">Voorraad</label>
            <select id="setting-claims-${id}" class="w-full bg-stone-900 border border-amber-600/50 rounded-xl px-1.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400">
              <option value="1" ${itemMaxClaims === 1 ? 'selected' : ''}>1x</option>
              <option value="2" ${itemMaxClaims === 2 ? 'selected' : ''}>2x</option>
              <option value="3" ${itemMaxClaims === 3 ? 'selected' : ''}>3x</option>
              <option value="4" ${itemMaxClaims === 4 ? 'selected' : ''}>4x</option>
            </select>
          </div>
          ` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  }

  function saveSettings(onSuccess) {
    const durationSelect = document.getElementById('setting-game-duration');
    const durationMinutes = durationSelect ? parseInt(durationSelect.value, 10) : 15;

    const itemsUpdate = {};
    ALL_ITEM_IDS.forEach(id => {
      const locInput = document.getElementById(`setting-loc-${id}`);
      const codeInput = document.getElementById(`setting-code-${id}`);
      const claimsSelect = document.getElementById(`setting-claims-${id}`);
      if (locInput && codeInput) {
        itemsUpdate[id] = {
          location: locInput.value.trim() || 'Lokaal',
          code: codeInput.value.trim() || '0000'
        };
        if (claimsSelect) {
          itemsUpdate[id].maxClaims = parseInt(claimsSelect.value, 10) || 1;
        }
      }
    });

    socket.emit('settings:update', {
      durationMinutes,
      items: itemsUpdate
    }, (res) => {
      if (res && res.success) {
        state.generalItems = res.generalItems;
        state.limitedItems = res.limitedItems;
        syncItemsData();
        renderLobbyLocations();
        if (window.sounds) window.sounds.playSuccess();
        if (onSuccess) onSuccess();
      }
    });
  }

  function renderLobbyLocations() {
    const container = document.getElementById('lobby-locations-chips');
    if (!container) return;

    container.innerHTML = '';
    ALL_ITEM_IDS.forEach(id => {
      const localItem = typeof ITEMS_DATA !== 'undefined' ? ITEMS_DATA[id] : null;
      const serverItem = state.limitedItems[id] || state.generalItems[id] || {};
      const name = serverItem.name || localItem?.name || id;
      const isLimited = serverItem.isLimited !== undefined ? serverItem.isLimited : (localItem?.isLimited || false);
      const maxClaims = serverItem.maxClaims || state.limitedItemsMaxClaims || 1;

      const chip = document.createElement('div');
      chip.className = `p-2 rounded-xl border flex flex-col justify-between ${
        isLimited ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-300'
      }`;
      chip.innerHTML = `
        <div class="flex items-center justify-between gap-1">
          <span class="text-[10px] font-bold truncate">${name}</span>
          ${isLimited ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">${maxClaims}x</span>` : ''}
        </div>
        <span class="text-[10px] text-stone-500 truncate mt-0.5">🔒 Lokaal verborgen</span>
      `;
      container.appendChild(chip);
    });
  }

  // ==========================================
  // KNOPPEN & CONTROLS SETUP
  // ==========================================
  function setupControls() {
    // Start Spel
    document.getElementById('btn-start-game').addEventListener('click', () => {
      socket.emit('admin:start_game');
      if (window.sounds) window.sounds.playSuccess();
    });

    // Test Bots Toevoegen
    document.getElementById('btn-add-bots').addEventListener('click', () => {
      socket.emit('admin:add_test_players');
      if (window.sounds) window.sounds.playClick();
    });

    // Footer Knoppen
    document.getElementById('admin-btn-pause').addEventListener('click', () => {
      socket.emit('admin:pause_game');
    });

    document.getElementById('admin-btn-add-min').addEventListener('click', () => {
      socket.emit('admin:add_time', 60);
      if (window.sounds) window.sounds.playClick();
    });

    document.getElementById('admin-btn-distract').addEventListener('click', () => {
      socket.emit('admin:trigger_distraction');
      if (window.sounds) window.sounds.playNotification();
    });

    document.getElementById('admin-btn-end').addEventListener('click', () => {
      if (confirm('Weet je zeker dat je het spel direct wilt beëindigen?')) {
        socket.emit('admin:end_game');
      }
    });

    // Reset Lobby (Footer)
    document.getElementById('admin-btn-reset').addEventListener('click', () => {
      if (confirm('Weet je zeker dat je het spel wilt resetten naar de lobby? Alle scores worden gereset.')) {
        socket.emit('admin:reset_game');
      }
    });

    // Reset Lobby (Game Over View)
    const resetEndBtn = document.getElementById('btn-reset-to-lobby-end');
    if (resetEndBtn) {
      resetEndBtn.addEventListener('click', () => {
        socket.emit('admin:reset_game');
      });
    }
  }

  function setupFullscreen() {
    const fsBtn = document.getElementById('btn-fullscreen');
    if (!fsBtn) return;

    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fsBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">fullscreen_exit</span><span>Sluit volledig</span>`;
      } else {
        document.exitFullscreen().catch(() => {});
        fsBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">fullscreen</span><span>Volledig scherm</span>`;
      }
    });
  }

  // ==========================================
  // VIEW & RENDER LOGICA
  // ==========================================
  function updateView() {
    views.lobby.classList.add('hidden');
    views.active.classList.add('hidden');
    views.ended.classList.add('hidden');

    const pauseLabel = document.getElementById('admin-pause-label');

    if (state.status === 'LOBBY') {
      views.lobby.classList.remove('hidden');
      statusText.textContent = 'LOBBY WACHTEN';
      statusBadge.className = 'px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-amber-950 text-amber-300 border border-amber-600/40 flex items-center gap-1.5 shadow';
      renderLobbyPlayers();
    } else if (state.status === 'PLAYING') {
      views.active.classList.remove('hidden');
      statusText.textContent = 'SPEL ACTIEF';
      statusBadge.className = 'px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1.5 shadow';
      if (pauseLabel) pauseLabel.textContent = 'Pauzeer';
      updateTimer();
      renderLimitedItemsStatus();
      renderLeaderboard();
      renderActivityFeed();
    } else if (state.status === 'PAUSED') {
      views.active.classList.remove('hidden');
      statusText.textContent = 'GEPAUZEERD';
      statusBadge.className = 'px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-yellow-950 text-yellow-300 border border-yellow-600/40 flex items-center gap-1.5 shadow';
      if (pauseLabel) pauseLabel.textContent = 'Hervat';
      updateTimer();
      renderLimitedItemsStatus();
      renderLeaderboard();
    } else if (state.status === 'ENDED') {
      views.ended.classList.remove('hidden');
      statusText.textContent = 'AFGELOPEN';
      statusBadge.className = 'px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-rose-950 text-rose-300 border border-rose-600/40 flex items-center gap-1.5 shadow';
    }
  }

  function renderLobbyPlayers() {
    const grid = document.getElementById('lobby-players-grid');
    const badge = document.getElementById('lobby-player-count-badge');
    const btnClear = document.getElementById('btn-clear-lobby');
    if (!grid) return;

    const count = state.leaderboard.length;
    badge.textContent = `${count} Speler${count === 1 ? '' : 's'}`;

    if (btnClear) {
      if (count > 0) {
        btnClear.classList.remove('hidden');
        btnClear.onclick = () => {
          if (confirm(`Weet je zeker dat je alle ${count} spelers wilt verwijderen uit de lobby?`)) {
            socket.emit('admin:clear_lobby_players');
          }
        };
      } else {
        btnClear.classList.add('hidden');
      }
    }

    if (count === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center text-stone-500 text-xs py-4">
          Nog geen spelers verbonden. Scan de QR code hierboven of open de link op je smartphone!
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    state.leaderboard.forEach(p => {
      const card = document.createElement('div');
      card.className = 'bg-stone-800/90 p-3 rounded-xl border border-stone-700 flex items-center justify-between gap-2.5 shadow-sm animate-in fade-in duration-200 group hover:border-stone-600';
      card.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-2xl shrink-0">${p.avatar}</span>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-bold text-white truncate" title="${p.name}">${p.name}</span>
            <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Klaar
            </span>
          </div>
        </div>
        <button type="button" class="btn-kick-player p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-700/50 transition cursor-pointer shrink-0" title="Verwijder ${p.name} uit lobby" data-player-id="${p.id}" data-player-name="${p.name}">
          <span class="material-symbols-outlined text-[18px]">person_remove</span>
        </button>
      `;
      grid.appendChild(card);
    });

    // Koppel verwijder-knoppen
    grid.querySelectorAll('.btn-kick-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.playerId;
        const pName = btn.dataset.playerName;
        if (confirm(`Weet je zeker dat je "${pName}" wilt verwijderen uit de lobby?`)) {
          socket.emit('admin:remove_player', { playerId: pId });
        }
      });
    });
  }

  function updateTimer() {
    const timerDisplay = document.getElementById('big-timer-display');
    const progressRing = document.getElementById('timer-progress-ring');
    if (!timerDisplay) return;

    timerDisplay.textContent = state.formattedTime;

    // Kleur aanpassen als tijd bijna op is (onder 2 minuten)
    if (state.timeRemaining < 120) {
      timerDisplay.classList.add('text-rose-500', 'animate-pulse');
      timerDisplay.classList.remove('text-white');
    } else {
      timerDisplay.classList.remove('text-rose-500', 'animate-pulse');
      timerDisplay.classList.add('text-white');
    }

    // SVG Ring voortgang
    if (progressRing) {
      const circumference = 264;
      const progress = Math.max(0, state.timeRemaining) / (state.totalDuration || 900);
      const offset = circumference * (1 - progress);
      progressRing.style.strokeDashoffset = offset;

      if (state.timeRemaining < 120) {
        progressRing.setAttribute('stroke', '#e11d48');
      } else {
        progressRing.setAttribute('stroke', '#059669');
      }
    }
  }

  function renderLimitedItemsStatus() {
    const interview = state.limitedItems.job_interview;
    const raise = state.limitedItems.job_raise;
    const date = state.limitedItems.date;
    const trouwen = state.limitedItems.trouwen;

    const renderBadge = (badgeEl, item, isLocked, unlockSeconds) => {
      if (!item || !badgeEl) return;
      const max = item.maxClaims || state.limitedItemsMaxClaims || 1;
      const claims = item.claims || (item.claimedBy ? [{ playerId: item.claimedBy, playerName: item.claimedByName }] : []);
      const count = claims.length;

      if (count >= max) {
        badgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/50';
        badgeEl.innerHTML = `<span>✓</span> Geclaimd (${count}/${max}) door ${item.claimedByName || claims.map(c => c.playerName).join(', ')}`;
      } else if (isLocked) {
        const timerTxt = unlockSeconds < 60 && unlockSeconds > 0 ? ` (nog ${unlockSeconds}s)` : '';
        badgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700';
        badgeEl.innerHTML = `<span>🔒</span> Vergrendeld${timerTxt}`;
      } else if (count > 0) {
        badgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse';
        badgeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ${count}/${max} geclaimd (nog ${max - count} over!)`;
      } else {
        badgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/40';
        badgeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Beschikbaar (${max}x)`;
      }
    };

    renderBadge(document.getElementById('badge-status-interview'), interview, false, 0);
    renderBadge(document.getElementById('badge-status-raise'), raise, raise?.isLocked, state.jobRaiseUnlockSecondsLeft);
    renderBadge(document.getElementById('badge-status-date'), date, false, 0);
    renderBadge(document.getElementById('badge-status-trouwen'), trouwen, trouwen?.isLocked, state.trouwenUnlockSecondsLeft);
  }

  function renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    const totalBadge = document.getElementById('leaderboard-total-players');
    if (!container) return;

    totalBadge.textContent = `${state.leaderboard.length} Spelers`;

    if (state.leaderboard.length === 0) {
      container.innerHTML = `
        <div class="text-center text-stone-500 text-xs py-8">
          Geen spelers aangesloten.
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    state.leaderboard.forEach((player, index) => {
      const row = document.createElement('div');
      row.className = `p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${
        index === 0 ? 'bg-amber-950/20 border-amber-500/40' :
        index === 1 ? 'bg-stone-800/80 border-stone-600/40' :
        index === 2 ? 'bg-amber-900/10 border-amber-800/30' :
        'bg-stone-900/60 border-stone-800'
      }`;

      // Rank medaille
      let rankBadge = `<span class="w-7 h-7 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center font-mono font-bold text-xs">${index + 1}</span>`;
      if (index === 0) rankBadge = `<span class="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs shadow">1</span>`;
      if (index === 1) rankBadge = `<span class="w-7 h-7 rounded-full bg-stone-300 text-black flex items-center justify-center font-black text-xs shadow">2</span>`;
      if (index === 2) rankBadge = `<span class="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow">3</span>`;

      // Status van de speler
      let statusIndicator = `<span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aan het speuren</span>`;
      if (player.inDoomscroll) {
        statusIndicator = `<span class="text-[10px] text-rose-300 font-bold flex items-center gap-1 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/50 animate-pulse"><span class="material-symbols-outlined text-[12px]">phone_android</span> In Doomscroll val!</span>`;
      } else if (player.activeCooldownCount > 0) {
        statusIndicator = `<span class="text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-600/40">⏳ In cooldown</span>`;
      }

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          ${rankBadge}
          <span class="text-2xl">${player.avatar}</span>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-bold text-white truncate">${player.name}</span>
            <div class="flex items-center gap-2 mt-0.5">
              ${statusIndicator}
            </div>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 pl-2">
          <span class="text-base font-mono font-black text-emerald-400">${player.score} <span class="text-xs font-normal text-stone-400">pt</span></span>
          <span class="text-[10px] text-stone-500">${player.claimedCount || 0} / 8 items</span>
        </div>
      `;

      container.appendChild(row);
    });
  }

  function renderActivityFeed() {
    const feed = document.getElementById('activity-feed-list');
    if (!feed) return;

    if (state.activityLog.length === 0) {
      feed.innerHTML = `<div class="text-stone-500 text-[11px] py-2">Wachten op acties van leerlingen...</div>`;
      return;
    }

    feed.innerHTML = '';
    state.activityLog.slice(0, 20).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'flex items-start gap-2 text-stone-300 text-[11px] leading-tight py-1 border-b border-stone-800/60 last:border-0';

      let icon = 'info';
      let iconColor = 'text-stone-400';
      if (entry.type === 'claim') { icon = 'stars'; iconColor = 'text-amber-400'; }
      if (entry.type === 'penalty') { icon = 'hourglass_bottom'; iconColor = 'text-rose-400'; }
      if (entry.type === 'trap') { icon = 'smart_display'; iconColor = 'text-[#ff4e7c]'; }
      if (entry.type === 'reward') { icon = 'self_improvement'; iconColor = 'text-emerald-400'; }
      if (entry.type === 'unlock') { icon = 'lock_open'; iconColor = 'text-amber-300'; }

      item.innerHTML = `
        <span class="material-symbols-outlined text-[14px] ${iconColor} shrink-0 mt-0.5">${icon}</span>
        <span class="text-stone-500 text-[10px] shrink-0 font-mono">${entry.timestamp}</span>
        <span class="flex-1">${entry.message}</span>
      `;
      feed.appendChild(item);
    });
  }

  // ==========================================
  // 2D CHARACTER MODELLEN VOOR WINNAARS PODIUM
  // ==========================================
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

  let podiumTimeouts = [];

  function clearPodiumTimeouts() {
    if (podiumTimeouts && podiumTimeouts.length > 0) {
      podiumTimeouts.forEach(t => clearTimeout(t));
      podiumTimeouts = [];
    }
  }

  function renderPodium(leaderboard, reason) {
    const podiumGrid = document.getElementById('podium-top3-grid');
    const reasonLabel = document.getElementById('ended-reason-label');
    if (reasonLabel && reason) reasonLabel.textContent = reason;
    if (!podiumGrid) return;

    // Gedeeld podium (zelfde als op de telefoons)
    if (window.SharedPodium) {
      clearPodiumTimeouts();
      window.SharedPodium.render(podiumGrid, leaderboard, { compact: false });
      return;
    }

    clearPodiumTimeouts();
    podiumGrid.innerHTML = '';

    const list = Array.isArray(leaderboard) ? leaderboard : [];
    const top1 = list[0] || null;
    const top2 = list[1] || null;
    const top3 = list[2] || null;

    // Configuratie per podiumplek met 2D character modellen van de spelers
    const config3 = {
      place: '3e Plaats',
      rank: 3,
      medal: '🥉',
      pillarHeight: 'h-24 md:h-28',
      pillarColor: 'bg-gradient-to-t from-amber-950 via-amber-900 to-amber-700 text-amber-200 border-amber-600/50',
      player: top3,
      badgeText: '📱 Verzonken in doomscrollen',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-800/80',
      descText: 'Tijd verloren aan schermen & video feeds'
    };

    const config2 = {
      place: '2e Plaats',
      rank: 2,
      medal: '🥈',
      pillarHeight: 'h-32 md:h-36',
      pillarColor: 'bg-gradient-to-t from-stone-600 via-stone-400 to-stone-200 text-stone-900 border-stone-100',
      player: top2,
      badgeText: '👀 Minder op scherm, blik omhoog',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
      descText: 'Weerstand geboden aan de meeste afleidingen'
    };

    const config1 = {
      place: '1e Plaats',
      rank: 1,
      medal: '🥇',
      pillarHeight: 'h-44 md:h-52',
      pillarColor: 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 text-stone-950 border-amber-200 shadow-amber-500/20 shadow-xl',
      player: top1,
      badgeText: '🎓 Schermvrij & Glansrijk Geslaagd!',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 ring-1 ring-emerald-400/40',
      descText: 'Volledig gefocust op de echte toekomst!'
    };

    // Creëer de 3 kolommen in visuele opstelling: [2e Plaats (links), 1e Plaats (midden), 3e Plaats (rechts)]
    const buildColumn = (cfg) => {
      const col = document.createElement('div');
      col.className = 'flex flex-col items-center justify-end transition-all duration-700 ease-out opacity-0 transform translate-y-10 scale-95';

      if (!cfg.player) {
        col.innerHTML = `
          <div class="w-full text-center mb-3">
            <span class="text-stone-600 text-xs font-mono">- Geen speler -</span>
          </div>
          <div class="w-full ${cfg.pillarHeight} bg-stone-900/90 rounded-t-3xl border border-stone-800 flex items-center justify-center text-stone-600 font-bold text-xl">${cfg.medal}</div>
        `;
        return col;
      }

      const modelSvg = createPlayer2DModelSvg(cfg.rank, cfg.player.avatar);

      col.innerHTML = `
        <div class="flex flex-col items-center text-center mb-2.5 w-full">
          <!-- 2D Model van de speler in zijn specifieke scherm-status -->
          <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl relative mb-2 flex items-center justify-center transition-transform duration-500 hover:scale-105">
            ${modelSvg}
          </div>

          <!-- Speler Gegevens -->
          <span class="text-xs sm:text-sm font-black text-white truncate max-w-[110px] sm:max-w-[150px] mt-1">${cfg.player.name}</span>
          <span class="text-[11px] sm:text-xs font-mono font-bold text-emerald-400">${cfg.player.score} pt</span>

          <!-- Thematische Status Badge -->
          <div class="mt-1 px-2 py-0.5 rounded-lg border text-[9px] sm:text-[10px] font-bold leading-tight max-w-[120px] sm:max-w-[160px] ${cfg.badgeClass}">
            ${cfg.badgeText}
          </div>
          <p class="text-[9px] text-stone-400 mt-0.5 hidden sm:block max-w-[140px] leading-tight">${cfg.descText}</p>
        </div>

        <!-- Podium Pilaar -->
        <div class="w-full ${cfg.pillarHeight} ${cfg.pillarColor} rounded-t-3xl flex flex-col items-center justify-center shadow-2xl border-t-2">
          <span class="text-2xl sm:text-3xl font-black drop-shadow">${cfg.medal}</span>
          <span class="text-[10px] sm:text-xs font-black uppercase tracking-wider">${cfg.place}</span>
        </div>
      `;
      return col;
    };

    const col2 = buildColumn(config2);
    const col1 = buildColumn(config1);
    const col3 = buildColumn(config3);

    podiumGrid.appendChild(col2);
    podiumGrid.appendChild(col1);
    podiumGrid.appendChild(col3);

    // Korte geanimeerde onthulling:
    // 1. DERDE PLAATS eerst onthullen (na 600ms)
    podiumTimeouts.push(setTimeout(() => {
      col3.classList.remove('opacity-0', 'translate-y-10', 'scale-95');
      col3.classList.add('opacity-100', 'translate-y-0', 'scale-100');
      if (window.sounds) window.sounds.playClick();
    }, 600));

    // 2. TWEEDE PLAATS daarna onthullen (na 2200ms)
    podiumTimeouts.push(setTimeout(() => {
      col2.classList.remove('opacity-0', 'translate-y-10', 'scale-95');
      col2.classList.add('opacity-100', 'translate-y-0', 'scale-100');
      if (window.sounds) window.sounds.playClick();
    }, 2200));

    // 3. EERSTE PLAATS als klapstuk onthullen (na 3800ms)
    podiumTimeouts.push(setTimeout(() => {
      col1.classList.remove('opacity-0', 'translate-y-10', 'scale-95');
      col1.classList.add('opacity-100', 'translate-y-0', 'scale-100');
      if (window.sounds) {
        if (typeof window.sounds.playReward === 'function') window.sounds.playReward();
        else if (typeof window.sounds.playSuccess === 'function') window.sounds.playSuccess();
      }
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 3800));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
