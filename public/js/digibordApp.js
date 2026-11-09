// Digibord & Admin Controller voor Doomscroll Escape
(function () {
  const socket = io();

  const state = {
    status: 'LOBBY',
    timeRemaining: 900,
    totalDuration: 900,
    formattedTime: '15:00',
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
      renderPodium(data.leaderboard, data.reason);
      updateView();
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
        if (serverItem.location) ITEMS_DATA[id].location = serverItem.location;
        if (serverItem.code) ITEMS_DATA[id].code = serverItem.code;
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
      const location = serverItem.location || localItem?.location || '';
      const code = serverItem.code || localItem?.code || '';
      const isLimited = serverItem.isLimited !== undefined ? serverItem.isLimited : (localItem?.isLimited || false);
      const icon = localItem?.icon || 'explore';

      const card = document.createElement('div');
      card.className = 'bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-2.5';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-emerald-400 text-lg">${icon}</span>
            <span class="text-xs font-bold text-white truncate">${name}</span>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isLimited ? 'bg-amber-950 text-amber-300 border border-amber-600/40' : 'bg-stone-800 text-stone-300'}">
            ${isLimited ? 'Limited' : 'Algemeen'}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="block text-[10px] text-stone-400 font-semibold mb-1">Fysieke Locatie</label>
            <input type="text" id="setting-loc-${id}" value="${location}" placeholder="Bijv. Kantine, Aula, Lokaal..." class="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-[10px] text-stone-400 font-semibold mb-1">Code (4 cijfers)</label>
            <input type="text" id="setting-code-${id}" value="${code}" maxlength="4" placeholder="4222" class="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500">
          </div>
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
      if (locInput && codeInput) {
        itemsUpdate[id] = {
          location: locInput.value.trim() || 'Lokaal',
          code: codeInput.value.trim() || '0000'
        };
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
      const location = serverItem.location || localItem?.location || 'Nader te bepalen';
      const isLimited = serverItem.isLimited !== undefined ? serverItem.isLimited : (localItem?.isLimited || false);

      const chip = document.createElement('div');
      chip.className = `p-2 rounded-xl border flex flex-col justify-between ${
        isLimited ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-300'
      }`;
      chip.innerHTML = `
        <span class="text-[10px] font-bold truncate">${name}</span>
        <span class="text-[10px] text-stone-400 truncate mt-0.5">📍 ${location}</span>
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
      if (confirm('Weet je zeker dat je de speurtocht direct wilt beëindigen?')) {
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
      statusText.textContent = 'SPEURTOCHT ACTIEF';
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
      renderPodium(state.leaderboard);
    }
  }

  function renderLobbyPlayers() {
    const grid = document.getElementById('lobby-players-grid');
    const badge = document.getElementById('lobby-player-count-badge');
    if (!grid) return;

    const count = state.leaderboard.length;
    badge.textContent = `${count} Speler${count === 1 ? '' : 's'}`;

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
      card.className = 'bg-stone-800/90 p-3 rounded-xl border border-stone-700 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200';
      card.innerHTML = `
        <span class="text-2xl">${p.avatar}</span>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-bold text-white truncate">${p.name}</span>
          <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Klaar
          </span>
        </div>
      `;
      grid.appendChild(card);
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

    // 1. Interview
    const badgeInterview = document.getElementById('badge-status-interview');
    if (interview && badgeInterview) {
      if (interview.claimedBy) {
        badgeInterview.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/50';
        badgeInterview.innerHTML = `<span>✓</span> Geclaimd door ${interview.claimedByName}`;
      } else {
        badgeInterview.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/40';
        badgeInterview.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Beschikbaar`;
      }
    }

    // 2. Raise
    const badgeRaise = document.getElementById('badge-status-raise');
    if (raise && badgeRaise) {
      if (raise.claimedBy) {
        badgeRaise.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/50';
        badgeRaise.innerHTML = `<span>✓</span> Geclaimd door ${raise.claimedByName}`;
      } else if (raise.isLocked) {
        const timerTxt = state.jobRaiseUnlockSecondsLeft < 60 && state.jobRaiseUnlockSecondsLeft > 0 
          ? ` (nog ${state.jobRaiseUnlockSecondsLeft}s)` 
          : '';
        badgeRaise.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700';
        badgeRaise.innerHTML = `<span>🔒</span> Vergrendeld${timerTxt}`;
      } else {
        badgeRaise.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse';
        badgeRaise.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> NU ONTGRENDELD!`;
      }
    }

    // 3. Date
    const badgeDate = document.getElementById('badge-status-date');
    if (date && badgeDate) {
      if (date.claimedBy) {
        badgeDate.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/50';
        badgeDate.innerHTML = `<span>✓</span> Geclaimd door ${date.claimedByName}`;
      } else {
        badgeDate.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/40';
        badgeDate.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Beschikbaar`;
      }
    }

    // 4. Trouwen
    const badgeTrouwen = document.getElementById('badge-status-trouwen');
    if (trouwen && badgeTrouwen) {
      if (trouwen.claimedBy) {
        badgeTrouwen.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700/50';
        badgeTrouwen.innerHTML = `<span>✓</span> Geclaimd door ${trouwen.claimedByName}`;
      } else if (trouwen.isLocked) {
        const timerTxt = state.trouwenUnlockSecondsLeft < 60 && state.trouwenUnlockSecondsLeft > 0 
          ? ` (nog ${state.trouwenUnlockSecondsLeft}s)` 
          : '';
        badgeTrouwen.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700';
        badgeTrouwen.innerHTML = `<span>🔒</span> Vergrendeld${timerTxt}`;
      } else {
        badgeTrouwen.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse';
        badgeTrouwen.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> NU ONTGRENDELD!`;
      }
    }
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

  function renderPodium(leaderboard, reason) {
    const podiumGrid = document.getElementById('podium-top3-grid');
    const reasonLabel = document.getElementById('ended-reason-label');
    if (reasonLabel && reason) reasonLabel.textContent = reason;
    if (!podiumGrid) return;

    podiumGrid.innerHTML = '';

    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];

    const createPodiumCol = (player, place, heightClass, colorClass, medal) => {
      const col = document.createElement('div');
      col.className = 'flex flex-col items-center justify-end';
      if (!player) {
        col.innerHTML = `
          <div class="text-stone-600 text-xs mb-2">-</div>
          <div class="w-full ${heightClass} bg-stone-900 rounded-t-2xl border border-stone-800 flex items-center justify-center text-stone-600 font-bold">${medal}</div>
        `;
        return col;
      }

      col.innerHTML = `
        <span class="text-3xl mb-1">${player.avatar}</span>
        <span class="text-xs font-bold text-white truncate max-w-[120px]">${player.name}</span>
        <span class="text-xs font-mono font-bold text-emerald-400 mb-2">${player.score} pt</span>
        <div class="w-full ${heightClass} ${colorClass} rounded-t-2xl flex flex-col items-center justify-center shadow-lg border-t-2 border-white/20">
          <span class="text-2xl font-black text-black">${medal}</span>
          <span class="text-[10px] font-bold text-black uppercase">${place}</span>
        </div>
      `;
      return col;
    };

    podiumGrid.appendChild(createPodiumCol(top2, '2e Plaats', 'h-28', 'bg-stone-300', '🥈'));
    podiumGrid.appendChild(createPodiumCol(top1, '1e Plaats', 'h-40', 'bg-amber-400', '🥇'));
    podiumGrid.appendChild(createPodiumCol(top3, '3e Plaats', 'h-20', 'bg-amber-700', '🥉'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
