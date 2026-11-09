const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Statische bestanden serveren
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/digibord', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'digibord.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'digibord.html'));
});

// REST API voor echte QR Code (dynamisch voor lokale IP of custom URL)
app.get('/api/qr', async (req, res) => {
  try {
    const localIp = getLocalIp();
    const defaultUrl = `http://${localIp}:${PORT}/`;
    const targetUrl = req.query.url || defaultUrl;

    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const dataUrl = await QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 400
    });

    res.json({
      success: true,
      url: targetUrl,
      defaultUrl,
      localIp,
      port: PORT,
      svg,
      dataUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// REST API voor huidige instellingen
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    localIp: getLocalIp(),
    port: PORT,
    joinUrl: `http://${getLocalIp()}:${PORT}/`,
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    totalDuration: gameState.totalDuration
  });
});

// ==========================================
// IN-MEMORY SPELTOESTAND (SERVER-SIDE STATE)
// ==========================================
const GAME_DURATION_SECONDS = 15 * 60; // 15 minuten = 900 seconden

const INITIAL_LIMITED_ITEMS = {
  job_interview: {
    id: 'job_interview',
    name: 'Job Interview',
    location: 'Kantoor 302',
    points: 1,
    code: '4343',
    isLimited: true,
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  job_raise: {
    id: 'job_raise',
    name: 'Job Raise',
    location: 'Kantoor 302',
    points: 1,
    code: '1243',
    isLimited: true,
    isLocked: true,
    unlockCountdown: 60, // 1 minuut na claimen interview
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  date: {
    id: 'date',
    name: 'Date',
    location: 'Kantine Terras',
    points: 1,
    code: '3442',
    isLimited: true,
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  trouwen: {
    id: 'trouwen',
    name: 'Trouwen',
    location: 'Trouwzaal / Aula',
    points: 1,
    code: '3443',
    isLimited: true,
    isLocked: true,
    unlockCountdown: 60, // 1 minuut na voltooien date
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  }
};

const INITIAL_GENERAL_ITEMS = {
  autosleutels: {
    id: 'autosleutels',
    name: 'Autosleutels',
    location: 'Parkeerdek Noord',
    points: 1,
    code: '4222',
    isLimited: false
  },
  huissleutels: {
    id: 'huissleutels',
    name: 'Huissleutels',
    location: 'Binnentuin Bankje #4',
    points: 1,
    code: '1412',
    isLimited: false
  },
  diploma: {
    id: 'diploma',
    name: 'Diploma',
    location: 'Collegezaal B2',
    points: 1,
    code: '3221',
    isLimited: false
  },
  droomreis: {
    id: 'droomreis',
    name: 'Ticket voor droomreis',
    location: 'Receptie LA225',
    points: 1,
    code: '2143',
    isLimited: false
  }
};

let gameState = {
  status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'PAUSED' | 'ENDED'
  timeRemaining: GAME_DURATION_SECONDS,
  totalDuration: GAME_DURATION_SECONDS,
  players: {}, // socketId of UUID -> playerData
  limitedItems: JSON.parse(JSON.stringify(INITIAL_LIMITED_ITEMS)),
  generalItems: JSON.parse(JSON.stringify(INITIAL_GENERAL_ITEMS)),
  activityLog: [],
  jobRaiseUnlockTimerActive: false,
  jobRaiseUnlockSecondsLeft: 60,
  trouwenUnlockTimerActive: false,
  trouwenUnlockSecondsLeft: 60
};

let gameTimerInterval = null;

function formatSeconds(secs) {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function addActivityLog(message, type = 'info', playerName = '') {
  const entry = {
    id: Date.now() + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message,
    type,
    playerName
  };
  gameState.activityLog.unshift(entry);
  if (gameState.activityLog.length > 50) {
    gameState.activityLog.pop();
  }
  io.emit('activity:new', entry);
}

function getLeaderboard() {
  const playersList = Object.values(gameState.players).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    claimedCount: (p.claimedItems || []).length,
    claimedItems: p.claimedItems || [],
    inDoomscroll: p.inDoomscroll || false,
    activeCooldownCount: Object.keys(p.cooldowns || {}).filter(k => p.cooldowns[k] > 0).length,
    connected: p.connected,
    stats: p.stats
  }));

  // Sorteren op score aflopend, daarna op aantal items
  playersList.sort((a, b) => b.score - a.score || b.claimedCount - a.claimedCount);
  return playersList;
}

function broadcastFullState() {
  io.emit('state:sync', {
    status: gameState.status,
    timeRemaining: gameState.timeRemaining,
    formattedTime: formatSeconds(gameState.timeRemaining),
    totalDuration: gameState.totalDuration,
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    leaderboard: getLeaderboard(),
    jobRaiseUnlockSecondsLeft: gameState.jobRaiseUnlockSecondsLeft,
    activityLog: gameState.activityLog.slice(0, 15)
  });
}

function checkGameOverCondition() {
  if (gameState.status !== 'PLAYING') return;

  // Voorwaarde 1: Timer verlopen
  if (gameState.timeRemaining <= 0) {
    endGame('TIJD_VERLOPEN');
    return;
  }

  // Voorwaarde 2: Alle items zijn verzameld
  const allLimitedClaimed = Object.values(gameState.limitedItems).every(item => item.claimedBy !== null);
  const playerValues = Object.values(gameState.players);
  const totalItemsCount = Object.keys(gameState.generalItems).length + Object.keys(gameState.limitedItems).length;
  
  if (playerValues.length > 0) {
    // A: Een topspeler heeft alle items behaald
    const anyPlayerHasAll = playerValues.some(p => (p.claimedItems || []).length >= totalItemsCount);

    // B: Alle limited items zijn op EN alle actieve spelers hebben alle algemene items
    const allGeneralClaimedByAll = allLimitedClaimed && playerValues.every(p => {
      const generalKeys = Object.keys(gameState.generalItems);
      return generalKeys.every(k => (p.claimedItems || []).includes(k));
    });

    if (anyPlayerHasAll || allGeneralClaimedByAll) {
      endGame('ALLE_ITEMS_VERZAMELD');
    }
  }
}

function startGame() {
  if (gameState.status === 'PLAYING') return;

  gameState.status = 'PLAYING';
  gameState.timeRemaining = GAME_DURATION_SECONDS;
  
  addActivityLog('Speurtocht gestart! De klok tikt: 15 minuten.', 'start');

  if (gameTimerInterval) clearInterval(gameTimerInterval);

  gameTimerInterval = setInterval(() => {
    if (gameState.status === 'PLAYING') {
      gameState.timeRemaining--;

      // Check of Job Raise ontgrendeld moet worden (1 minuut na claim van Job Interview)
      if (gameState.jobRaiseUnlockTimerActive && gameState.jobRaiseUnlockSecondsLeft > 0) {
        gameState.jobRaiseUnlockSecondsLeft--;
        if (gameState.jobRaiseUnlockSecondsLeft <= 0) {
          gameState.jobRaiseUnlockTimerActive = false;
          if (gameState.limitedItems.job_raise) {
            gameState.limitedItems.job_raise.isLocked = false;
          }
          addActivityLog('🚨 Salarisverhoging (Job Raise) is nu ontgrendeld op de kaart!', 'unlock');
          io.emit('item:unlocked', {
            itemId: 'job_raise',
            itemName: 'Job Raise',
            message: '🚨 Salarisverhoging (Job Raise) is NU ontgrendeld op de kaart! Wie pakt hem als eerste?'
          });
          broadcastFullState();
        }
      }

      // Check of Trouwen ontgrendeld moet worden (1 minuut na claim van Date)
      if (gameState.trouwenUnlockTimerActive && gameState.trouwenUnlockSecondsLeft > 0) {
        gameState.trouwenUnlockSecondsLeft--;
        if (gameState.trouwenUnlockSecondsLeft <= 0) {
          gameState.trouwenUnlockTimerActive = false;
          if (gameState.limitedItems.trouwen) {
            gameState.limitedItems.trouwen.isLocked = false;
          }
          addActivityLog('💍 "Trouwen" (Limited • 1 pt) is nu ontgrendeld op de kaart!', 'unlock');
          io.emit('item:unlocked', {
            itemId: 'trouwen',
            itemName: 'Trouwen',
            message: '💍 "Trouwen" (Limited • 1 pt) is NU ontgrendeld in de Trouwzaal/Aula! Wie pakt hem als eerste?'
          });
          broadcastFullState();
        }
      }

      // Elke seconde timer tick uitzenden
      io.emit('timer:tick', {
        timeRemaining: gameState.timeRemaining,
        formattedTime: formatSeconds(gameState.timeRemaining),
        jobRaiseUnlockSecondsLeft: gameState.jobRaiseUnlockSecondsLeft,
        trouwenUnlockSecondsLeft: gameState.trouwenUnlockSecondsLeft
      });

      if (gameState.timeRemaining <= 0) {
        endGame('TIJD_VERLOPEN');
      }
    }
  }, 1000);

  broadcastFullState();
}

function pauseGame() {
  if (gameState.status === 'PLAYING') {
    gameState.status = 'PAUSED';
    addActivityLog('Spel gepauzeerd door spelleider.', 'info');
  } else if (gameState.status === 'PAUSED') {
    gameState.status = 'PLAYING';
    addActivityLog('Spel hervat door spelleider.', 'info');
  }
  broadcastFullState();
}

function endGame(reason = 'TIJD_VERLOPEN') {
  if (gameState.status === 'ENDED') return;
  
  gameState.status = 'ENDED';
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }

  const finalLeaderboard = getLeaderboard();
  const winner = finalLeaderboard[0] || null;

  let reasonDutch = 'De 15 minuten zijn voorbij!';
  if (reason === 'ALLE_ITEMS_VERZAMELD') {
    reasonDutch = 'Alle items op de kaart zijn gevonden en geclaimd!';
  } else if (reason === 'BEËINDIGD_DOOR_ADMIN') {
    reasonDutch = 'Het spel is beëindigd door de spelleider.';
  }

  addActivityLog(`Spel afgelopen: ${reasonDutch}`, 'end');
  
  io.emit('game:ended', {
    reason: reasonDutch,
    leaderboard: finalLeaderboard,
    winner
  });

  broadcastFullState();
}

function resetGame() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }

  // Bewaar aangepaste locaties en codes
  const savedLocations = {};
  const savedCodes = {};
  [...Object.values(gameState.generalItems), ...Object.values(gameState.limitedItems)].forEach(item => {
    savedLocations[item.id] = item.location;
    savedCodes[item.id] = item.code;
  });

  gameState.status = 'LOBBY';
  gameState.timeRemaining = gameState.totalDuration || GAME_DURATION_SECONDS;
  gameState.limitedItems = JSON.parse(JSON.stringify(INITIAL_LIMITED_ITEMS));
  gameState.generalItems = JSON.parse(JSON.stringify(INITIAL_GENERAL_ITEMS));

  // Herstel eventuele aangepaste locaties en codes
  Object.keys(savedLocations).forEach(id => {
    if (gameState.generalItems[id] && savedLocations[id]) gameState.generalItems[id].location = savedLocations[id];
    if (gameState.limitedItems[id] && savedLocations[id]) gameState.limitedItems[id].location = savedLocations[id];
  });
  Object.keys(savedCodes).forEach(id => {
    if (gameState.generalItems[id] && savedCodes[id]) gameState.generalItems[id].code = savedCodes[id];
    if (gameState.limitedItems[id] && savedCodes[id]) gameState.limitedItems[id].code = savedCodes[id];
  });

  gameState.jobRaiseUnlockTimerActive = false;
  gameState.jobRaiseUnlockSecondsLeft = 60;
  gameState.trouwenUnlockTimerActive = false;
  gameState.trouwenUnlockSecondsLeft = 60;
  gameState.activityLog = [];

  // Reset spelers scores en geclaimde items, behoud namen en avatars
  Object.values(gameState.players).forEach(p => {
    p.score = 0;
    p.claimedItems = [];
    p.cooldowns = {};
    p.inDoomscroll = false;
    p.stats = {
      wrongAnswers: 0,
      hintsClicked: 0,
      selfControlRewards: 0,
      doomscrollSeconds: 0
    };
  });

  addActivityLog('Het spel is herstart naar de lobby.', 'info');
  io.emit('game:reset', {
    status: 'LOBBY',
    totalDuration: gameState.totalDuration,
    timeRemaining: gameState.timeRemaining,
    formattedTime: formatSeconds(gameState.timeRemaining),
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    leaderboard: getLeaderboard()
  });
  broadcastFullState();
}

// ==========================================
// SOCKET.IO REAL-TIME COMMUNICATIE
// ==========================================
io.on('connection', (socket) => {
  // Stuur direct de actuele toestand bij verbinden
  socket.emit('state:sync', {
    status: gameState.status,
    timeRemaining: gameState.timeRemaining,
    formattedTime: formatSeconds(gameState.timeRemaining),
    totalDuration: gameState.totalDuration,
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    leaderboard: getLeaderboard(),
    jobRaiseUnlockSecondsLeft: gameState.jobRaiseUnlockSecondsLeft,
    activityLog: gameState.activityLog.slice(0, 15)
  });

  // SPELER JOINEN
  socket.on('player:join', (data) => {
    const { name, avatar, existingId } = data;
    const cleanName = (name || 'Speler ' + socket.id.substr(0, 4)).trim().substring(0, 20);
    const playerId = existingId || socket.id;

    if (!gameState.players[playerId]) {
      gameState.players[playerId] = {
        id: playerId,
        socketId: socket.id,
        name: cleanName,
        avatar: avatar || '🎒',
        score: 0,
        claimedItems: [],
        cooldowns: {}, // itemId -> remainingSeconds
        inDoomscroll: false,
        connected: true,
        stats: {
          wrongAnswers: 0,
          hintsClicked: 0,
          selfControlRewards: 0,
          doomscrollSeconds: 0
        }
      };
      addActivityLog(`${cleanName} is binnengekomen in de lobby!`, 'join', cleanName);
    } else {
      // Reconnect
      gameState.players[playerId].socketId = socket.id;
      gameState.players[playerId].connected = true;
      gameState.players[playerId].name = cleanName;
      if (avatar) gameState.players[playerId].avatar = avatar;
      addActivityLog(`${cleanName} is opnieuw verbonden.`, 'info', cleanName);
    }

    socket.data.playerId = playerId;
    socket.emit('player:registered', {
      player: gameState.players[playerId],
      gameState: {
        status: gameState.status,
        timeRemaining: gameState.timeRemaining,
        limitedItems: gameState.limitedItems
      }
    });

    broadcastFullState();
  });

  // DIGIBORD ACTIES
  socket.on('admin:start_game', () => {
    startGame();
  });

  socket.on('admin:pause_game', () => {
    pauseGame();
  });

  socket.on('admin:end_game', () => {
    endGame('BEËINDIGD_DOOR_ADMIN');
  });

  socket.on('admin:reset_game', () => {
    resetGame();
  });

  socket.on('player:restart_lobby', () => {
    resetGame();
  });

  socket.on('settings:update', (data, callback) => {
    if (!data) return;
    if (data.items) {
      Object.keys(data.items).forEach(id => {
        const itemUpdate = data.items[id];
        if (gameState.generalItems[id]) {
          if (itemUpdate.location !== undefined) gameState.generalItems[id].location = itemUpdate.location.trim();
          if (itemUpdate.code !== undefined) gameState.generalItems[id].code = itemUpdate.code.trim();
        }
        if (gameState.limitedItems[id]) {
          if (itemUpdate.location !== undefined) gameState.limitedItems[id].location = itemUpdate.location.trim();
          if (itemUpdate.code !== undefined) gameState.limitedItems[id].code = itemUpdate.code.trim();
        }
      });
    }
    if (data.durationMinutes) {
      const mins = Math.max(1, parseInt(data.durationMinutes, 10));
      gameState.totalDuration = mins * 60;
      if (gameState.status === 'LOBBY') {
        gameState.timeRemaining = gameState.totalDuration;
      }
    }
    addActivityLog('Spelinstellingen & locaties bijgewerkt door docent.', 'info');
    io.emit('settings:updated', {
      generalItems: gameState.generalItems,
      limitedItems: gameState.limitedItems,
      totalDuration: gameState.totalDuration
    });
    broadcastFullState();
    if (callback) callback({ success: true, generalItems: gameState.generalItems, limitedItems: gameState.limitedItems });
  });

  socket.on('settings:reset', (callback) => {
    gameState.generalItems = JSON.parse(JSON.stringify(INITIAL_GENERAL_ITEMS));
    gameState.limitedItems = JSON.parse(JSON.stringify(INITIAL_LIMITED_ITEMS));
    gameState.totalDuration = GAME_DURATION_SECONDS;
    if (gameState.status === 'LOBBY') {
      gameState.timeRemaining = GAME_DURATION_SECONDS;
    }
    addActivityLog('Spelinstellingen hersteld naar standaardwaarden.', 'info');
    io.emit('settings:updated', {
      generalItems: gameState.generalItems,
      limitedItems: gameState.limitedItems,
      totalDuration: gameState.totalDuration
    });
    broadcastFullState();
    if (callback) callback({ success: true });
  });

  socket.on('admin:add_time', (seconds = 60) => {
    gameState.timeRemaining += seconds;
    addActivityLog(`Spelleider heeft +${seconds} seconden toegevoegd aan de klok!`, 'info');
    broadcastFullState();
  });

  socket.on('admin:trigger_distraction', (customMsg) => {
    const defaultMessages = [
      'WhatsApp: 👩 Moeder: "Vergeet je fietssleutels niet! En hoe gaat de speurtocht?"',
      'TikTok: 🔥 Kijk deze viral video over schoolgeheimen!',
      'Instagram: @lars.v heeft je zojuist getagd in een bericht!',
      'BeReal: ⚠️ Tijd voor BeReal! Je hebt 2 minuten.',
      'Snapchat: Je streak met Sophie verloopt over 1 uur!'
    ];
    const msg = customMsg || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
    addActivityLog(`Klassikale afleiding verzonden door spelleider: "${msg}"`, 'distraction');
    io.emit('notification:push', {
      title: 'Notificatie',
      message: msg,
      platform: msg.includes('WhatsApp') ? 'whatsapp' : msg.includes('TikTok') ? 'tiktok' : msg.includes('Instagram') ? 'instagram' : msg.includes('BeReal') ? 'bereal' : 'snapchat'
    });
  });

  socket.on('admin:add_test_players', () => {
    const testBots = [
      { name: 'Bram de Vries', avatar: '🦊' },
      { name: 'Sanne Jansen', avatar: '⚡' },
      { name: 'Noah El Amrani', avatar: '🚀' }
    ];

    testBots.forEach(bot => {
      const id = 'bot_' + Math.random().toString(36).substr(2, 6);
      gameState.players[id] = {
        id,
        socketId: 'bot',
        name: bot.name,
        avatar: bot.avatar,
        score: Math.floor(Math.random() * 2),
        claimedItems: [],
        cooldowns: {},
        inDoomscroll: false,
        connected: true,
        stats: {
          wrongAnswers: 0,
          hintsClicked: 0,
          selfControlRewards: 0,
          doomscrollSeconds: 0
        }
      };
      addActivityLog(`${bot.name} is toegevoegd als testspeler.`, 'join', bot.name);
    });

    broadcastFullState();
  });

  // SPELACTIE: CODE VERIFIËREN
  socket.on('item:verify_code', (data, callback) => {
    const { itemId, code } = data;
    const cleanCode = (code || '').trim();

    let targetItem = gameState.generalItems[itemId] || gameState.limitedItems[itemId];
    if (!targetItem) {
      if (callback) callback({ success: false, error: 'Onbekend item.' });
      return;
    }

    if (cleanCode === targetItem.code) {
      if (callback) callback({ success: true, message: 'Code correct!' });
    } else {
      if (callback) callback({ success: false, error: 'Onjuiste fysieke locatiecode! Controleer het cijferslot/bord.' });
    }
  });

  // SPELACTIE: TAAK INDIENEN (GOED OF FOUT)
  socket.on('item:submit_task', (data, callback) => {
    const playerId = socket.data.playerId || data.playerId;
    const { itemId, isCorrect } = data;
    const player = gameState.players[playerId];

    if (!player) {
      if (callback) callback({ success: false, error: 'Speler niet gevonden.' });
      return;
    }

    const isLimited = !!gameState.limitedItems[itemId];
    const itemData = isLimited ? gameState.limitedItems[itemId] : gameState.generalItems[itemId];

    if (!itemData) {
      if (callback) callback({ success: false, error: 'Onbekend item.' });
      return;
    }

    // Controleer of limited item al gekaapt is
    if (isLimited && itemData.claimedBy && itemData.claimedBy !== playerId) {
      if (callback) callback({
        success: false,
        error: `Helaas! Dit limited item is net gepakt door ${itemData.claimedByName}! OP = OP.`
      });
      return;
    }

    // Controleer of speler dit item al bezit
    if ((player.claimedItems || []).includes(itemId)) {
      if (callback) callback({ success: false, error: 'Je hebt dit item al geclaimd!' });
      return;
    }

    if (isCorrect) {
      // 1. Antwoord is GOED!
      const points = itemData.points || 1;
      player.score += points;
      player.claimedItems = player.claimedItems || [];
      player.claimedItems.push(itemId);

      // Verwijder eventuele actieve cooldown op dit item
      if (player.cooldowns) delete player.cooldowns[itemId];

      if (isLimited) {
        // Markeer globaal als geclaimd
        itemData.claimedBy = playerId;
        itemData.claimedByName = player.name;
        itemData.claimedAt = new Date().toISOString();

        addActivityLog(`⭐ ${player.name} heeft het LIMITED item "${itemData.name}" geclaimd! (+${points} pt)`, 'claim', player.name);

        // Broadcast aan ALLE andere spelers dat dit limited item op is!
        socket.broadcast.emit('item:limited_claimed', {
          playerId,
          playerName: player.name,
          itemId,
          itemName: itemData.name,
          toastMessage: `${player.name} heeft de laatste ${itemData.name} gepakt!`
        });

        // Als dit het Job Interview is, ontgrendel Job Raise na 60 seconden
        if (itemId === 'job_interview') {
          gameState.jobRaiseUnlockTimerActive = true;
          gameState.jobRaiseUnlockSecondsLeft = 60;
          addActivityLog('⏱️ Timer gestart: Job Raise ontgrendelt over 1 minuut!', 'info');
          io.emit('item:unlock_countdown_started', {
            itemId: 'job_raise',
            secondsLeft: 60,
            message: 'Job Raise ontgrendelt over 1 minuut! Houd de kaart in de gaten.'
          });
        } else if (itemId === 'date') {
          // Date behaald -> Trouwen ontgrendelt na 60 seconden
          gameState.trouwenUnlockTimerActive = true;
          gameState.trouwenUnlockSecondsLeft = 60;
          addActivityLog('⏱️ Timer gestart: Trouwen ontgrendelt over 1 minuut!', 'info');
          io.emit('item:unlock_countdown_started', {
            itemId: 'trouwen',
            secondsLeft: 60,
            message: '💍 De date was een succes! "Trouwen" ontgrendelt over 1 minuut op de kaart!'
          });
        }
      } else {
        addActivityLog(`✅ ${player.name} heeft "${itemData.name}" behaald! (+${points} pt)`, 'claim', player.name);
      }

      if (callback) callback({
        success: true,
        pointsEarned: points,
        totalScore: player.score,
        itemName: itemData.name
      });

      broadcastFullState();
      checkGameOverCondition();
    } else {
      // 2. Antwoord is FOUT -> 45s Cooldown straftijd!
      player.stats.wrongAnswers++;
      player.cooldowns = player.cooldowns || {};
      player.cooldowns[itemId] = 45; // 45 seconden straftijd

      addActivityLog(`❌ ${player.name} gaf een fout antwoord bij "${itemData.name}" (45s cooldown)!`, 'penalty', player.name);

      if (callback) callback({
        success: false,
        cooldownSeconds: 45,
        message: 'Fout antwoord! Er geldt nu 45 seconden cooldown op dit item.'
      });

      broadcastFullState();
    }
  });

  // ZELFBEHEERSING BELONING: -15 SECONDE KORTING BIJ SLUITEN ZONDER SCROLLEN
  socket.on('cooldown:reward_self_control', (data, callback) => {
    const playerId = socket.data.playerId || data.playerId;
    const { itemId } = data;
    const player = gameState.players[playerId];

    if (player && player.cooldowns && player.cooldowns[itemId]) {
      const oldVal = player.cooldowns[itemId];
      // Trek 15 seconden af!
      player.cooldowns[itemId] = Math.max(0, oldVal - 15);
      player.stats.selfControlRewards++;

      addActivityLog(`🧘 ${player.name} toonde zelfbeheersing! -15s korting op cooldown van "${itemId}".`, 'reward', player.name);

      if (callback) callback({
        success: true,
        newCooldown: player.cooldowns[itemId],
        deducted: 15,
        message: 'Zelfbeheersing beloond! Je straftijd is met 15 seconden verkort.'
      });

      broadcastFullState();
    }
  });

  // DOOMSCROLL VAL BETREDEN
  socket.on('player:enter_doomscroll', (data) => {
    const playerId = socket.data.playerId || data.playerId;
    const player = gameState.players[playerId];
    if (player) {
      player.inDoomscroll = true;
      player.stats.hintsClicked++;
      addActivityLog(`📱 ${player.name} trapte in de Doomscroll val en kijkt video's! (Cooldown gepauzeerd)`, 'trap', player.name);
      broadcastFullState();
    }
  });

  // DOOMSCROLL VAL VERLATEN
  socket.on('player:exit_doomscroll', (data) => {
    const playerId = socket.data.playerId || data.playerId;
    const { secondsSpent = 0 } = data;
    const player = gameState.players[playerId];
    if (player) {
      player.inDoomscroll = false;
      player.stats.doomscrollSeconds += secondsSpent;
      addActivityLog(`🏃 ${player.name} is ontsnapt uit de Doomscroll val na ${secondsSpent}s!`, 'info', player.name);
      broadcastFullState();
    }
  });

  // UPDATE COOLDOWNS TICK VANAF CLIENT
  socket.on('player:update_cooldown', (data) => {
    const playerId = socket.data.playerId || data.playerId;
    const { itemId, remainingSeconds } = data;
    const player = gameState.players[playerId];
    if (player && player.cooldowns) {
      if (remainingSeconds <= 0) {
        delete player.cooldowns[itemId];
      } else {
        player.cooldowns[itemId] = remainingSeconds;
      }
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const playerId = socket.data.playerId;
    if (playerId && gameState.players[playerId]) {
      gameState.players[playerId].connected = false;
      addActivityLog(`${gameState.players[playerId].name} verbinding verbroken.`, 'info');
      broadcastFullState();
    }
  });
});

// Server starten
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Doomscroll Escape Server actief op poort ${PORT}!`);
  console.log(`📱 Speler Mobiel:  http://localhost:${PORT}/`);
  console.log(`🖥️ Digibord Klas:  http://localhost:${PORT}/digibord`);
  console.log(`====================================================`);
});

