const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Gzip compressie voor alle HTTP responses (bespaart tot 75% mobiele data)
app.use(compression());

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

// Statische bestanden serveren met slimme caching headers tegen overmatig dataverbruik
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js') || filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2|mp3|wav)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (filePath.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
app.use(express.json());

// Routes met strikte no-cache headers zodat updates direct op mobiele schermen verschijnen
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/digibord', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'digibord.html'));
});

app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'digibord.html'));
});

// REST API voor echte QR Code (dynamisch voor lokale IP, Render URL of custom URL)
app.get('/api/qr', async (req, res) => {
  try {
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const autoHostUrl = forwardedHost ? `${protocol}://${forwardedHost}/` : null;

    const defaultUrl = (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}/` : null)
      || autoHostUrl
      || `http://${getLocalIp()}:${PORT}/`;

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
      localIp: getLocalIp(),
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
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const autoHostUrl = forwardedHost ? `${protocol}://${forwardedHost}/` : null;

  const joinUrl = (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}/` : null)
    || autoHostUrl
    || `http://${getLocalIp()}:${PORT}/`;

  res.json({
    success: true,
    localIp: getLocalIp(),
    port: PORT,
    joinUrl,
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    totalDuration: gameState.totalDuration
  });
});

// ==========================================
// REST API VOOR ONEINDIGE VIDEO & AUDIO FEED
// ==========================================
const REEL_BASE_VIDEOS = [
  { url: '/assets/videos/friday_chill.mp4', sound: 'Origineel Geluid - Friday Sunset Chill (Akkoorden & Golven) 🎵', credits: 'Mozilla Open Web Media • CC0' },
  { url: '/assets/videos/bear_stream.mp4', sound: 'Origineel Geluid - Ruisende Bergrivier & Beer Plons 🌊', credits: 'W3C Open Media • CC0' },
  { url: '/assets/videos/echo_music.mp4', sound: 'Origineel Geluid - Echo: Here We Are (Vocal & Drums) 🎸', credits: 'Echo Band / MediaElement • CC-BY' },
  { url: '/assets/videos/sintel_trailer.mp4', sound: 'Origineel Geluid - Jan Morgenstern (Sintel Dragon Score) 🐉', credits: 'Blender Open Movie • CC-BY' },
  { url: '/assets/videos/bunny_cartoon.mp4', sound: 'Origineel Geluid - Vrolijke Bunny Beats & Fluitende Vogels 🐰', credits: 'Blender Foundation • CC-BY' },
  { url: '/assets/videos/movie_300.mp4', sound: 'Origineel Geluid - Hollywood Action Drums & Effects 🎬', credits: 'W3C HTML5 Video Test • CC-BY' },
  { url: '/assets/videos/oceans.mp4', sound: 'Origineel Geluid - Ocean Symphony & Onderwater Ambience 🐬', credits: 'VideoJS Oceans Open Project' },
  { url: '/assets/videos/bunny_short.mp4', sound: 'Origineel Geluid - Cartoon Fun Soundtrack 🎶', credits: 'Open Animation Hub • CC-BY' },
  { url: '/assets/videos/flower_blooming.mp4', sound: 'Origineel Geluid - Bloeiende Lente & Rustgevende Klanken 🌸', credits: 'MDN Open Media • CC0' },
  { url: '/assets/videos/big_buck_sample.mp4', sound: 'Origineel Geluid - Forest Groove Beats 🎧', credits: 'Peach Open Movie Project • CC-BY' },
  { url: '/assets/videos/trailer_sample.mp4', sound: 'Origineel Geluid - Cinematic Action Trailer 💥', credits: 'W3C Open Test Suite • CC-BY' }
];

const REEL_CREATORS = [
  { user: 'sunset_vibes_nl', avatar: 'https://i.pravatar.cc/150?img=11' },
  { user: 'nature_wildlife_nl', avatar: 'https://i.pravatar.cc/150?img=33' },
  { user: 'echo_band_official', avatar: 'https://i.pravatar.cc/150?img=47' },
  { user: 'open_cinema_hub', avatar: 'https://i.pravatar.cc/150?img=53' },
  { user: 'blender_open_anim', avatar: 'https://i.pravatar.cc/150?img=20' },
  { user: 'action_visuals_nl', avatar: 'https://i.pravatar.cc/150?img=22' },
  { user: 'deep_ocean_explorer', avatar: 'https://i.pravatar.cc/150?img=65' },
  { user: 'daan.vlogz', avatar: 'https://i.pravatar.cc/150?img=12' },
  { user: 'lisa.kramer', avatar: 'https://i.pravatar.cc/150?img=1' },
  { user: 'sophie_outdoor', avatar: 'https://i.pravatar.cc/150?img=5' },
  { user: 'bram.student', avatar: 'https://i.pravatar.cc/150?img=8' },
  { user: 'lars.adventures', avatar: 'https://i.pravatar.cc/150?img=15' },
  { user: 'foodie_sarah_nl', avatar: 'https://i.pravatar.cc/150?img=49' },
  { user: 'urban_beats_020', avatar: 'https://i.pravatar.cc/150?img=60' }
];

const REEL_CAPTIONS = [
  'De golven tijdens een gouden zonsondergang op vrijdagavond... 🌅🌊 Zet je geluid even lekker aan! #sunset #ocean #relax #chill',
  'Wat een natuurgeweld! Gigantische beer vangt verse vis in de woeste stroomversnelling 🐻🐟 #wildlife #nature #river #salmon',
  'Onze nieuwe single "Here We Are" is uit! 🎸🔥 Wat vinden jullie van het refrein? #newmusic #indierock #vibes #live',
  'Sintel: epische zoektocht van een dappere krijger door de besneeuwde bergen ⚔️🐉 Prachtige cinematische animatie! #sintel #openmovie #cgi',
  'Wanneer je dacht dat het weekend was maar het is pas woensdag... 💀😭 #relatable #humor #weekendvibes #viral',
  'Kijk naar die camerahoek en cinematische slow motion! 🎥💥 Prachtig staaltje actiewerk. #action #visuals #epic #slowmo',
  'Duik mee in de diepblauwe oceaan tussen de dolfijnen en koraalriffen 🐬🌊 Onwerkelijk rustgevend! #oceanlife #marinelife #deepblue',
  'Wie herkent dit moment? Als je net op de bank ligt en je telefoon begint te rinkelen 😂📱 #fyp #grappig #herkenbaar',
  'POV: Je probeert productief te zijn maar je belandt in een oneindige scrollsessie... 👀⌛ #scrolling #trap #fail',
  'Dit uitzicht verveelt echt nooit! De mooiste plekjes ontdekken 🇳🇱✨ #wanderlust #nature #explore',
  'Volume op 100%! Deze beat is echt ongekend lekker 🔥🎧 #electronic #music #vibes #trending',
  'Even een reminder om vandaag wat rust te nemen en van het moment te genieten ✨🌿 #mindfulness #goodvibes #chill'
];

function generateReelsFeed(cursor = 0, limit = 4, platform = 'all') {
  const reels = [];
  for (let idx = 0; idx < limit; idx++) {
    const i = cursor + idx;
    const v = REEL_BASE_VIDEOS[i % REEL_BASE_VIDEOS.length];
    const c = REEL_CREATORS[i % REEL_CREATORS.length];
    const cap = REEL_CAPTIONS[i % REEL_CAPTIONS.length];

    const likes = ((i * 4721 + 18200) % 95000) + 5200;
    const dislikes = ((i * 83 + 120) % 450) + 15;
    const comments = ((i * 389 + 640) % 3500) + 120;

    // Afbeeldingen van gratis API (Picsum) die dankzij een unieke seed per post nooit herhalen
    const isPhotoReel = (i % 3 === 2);

    if (isPhotoReel) {
      const seed = `reel_${platform}_${i}_${(i * 3571 + 104729) % 999999}`;
      const photoUrl = `https://picsum.photos/seed/${seed}/1080/1920`;

      reels.push({
        id: `${platform}_photo_${i}`,
        index: i,
        mediaType: 'image',
        url: photoUrl,
        audioUrl: v.url,
        sound: v.sound,
        credits: 'Picsum Photos API • Free Open License',
        user: c.user,
        avatar: c.avatar,
        caption: cap,
        likes,
        dislikes,
        commentsCount: comments
      });
    } else {
      reels.push({
        id: `${platform}_reel_${i}`,
        index: i,
        mediaType: 'video',
        url: v.url,
        sound: v.sound,
        credits: v.credits,
        user: c.user,
        avatar: c.avatar,
        caption: cap,
        likes,
        dislikes,
        commentsCount: comments
      });
    }
  }
  return reels;
}

app.get('/api/reels/feed', (req, res) => {
  const cursor = Math.max(0, parseInt(req.query.cursor, 10) || 0);
  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 4));
  const platform = req.query.platform || 'instagram';

  const reels = generateReelsFeed(cursor, limit, platform);
  res.json({
    success: true,
    cursor,
    limit,
    nextCursor: cursor + limit,
    hasMore: true,
    reels
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
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LA500 Trap',
    points: 1,
    code: '2413',
    isLimited: true,
    maxClaims: 1,
    claims: [],
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  job_raise: {
    id: 'job_raise',
    name: 'Job Raise',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LD Kantine',
    points: 1,
    code: '1243',
    isLimited: true,
    isLocked: true,
    maxClaims: 1,
    claims: [],
    eligiblePlayerIds: [],
    eligiblePlayerId: null,
    eligiblePlayerName: null,
    unlockCountdown: 60, // 1 minuut na claimen interview (alleen voor de winnaar(s))
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  date: {
    id: 'date',
    name: 'Date',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LD112',
    points: 1,
    code: '3442',
    isLimited: true,
    maxClaims: 1,
    claims: [],
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  },
  trouwen: {
    id: 'trouwen',
    name: 'Trouwen',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'Lovensdijkstraat Plein',
    points: 1,
    code: '3443',
    isLimited: true,
    isLocked: true,
    maxClaims: 1,
    claims: [],
    eligiblePlayerIds: [],
    eligiblePlayerId: null,
    eligiblePlayerName: null,
    unlockCountdown: 60, // 1 minuut na voltooien date (alleen voor de winnaar(s))
    claimedBy: null,
    claimedByName: null,
    claimedAt: null
  }
};

const INITIAL_GENERAL_ITEMS = {
  autosleutels: {
    id: 'autosleutels',
    name: 'Autosleutels',
    location: 'LA227',
    points: 1,
    code: '4222',
    isLimited: false
  },
  huissleutels: {
    id: 'huissleutels',
    name: 'Huissleutels',
    location: 'LX200',
    points: 1,
    code: '1412',
    isLimited: false
  },
  diploma: {
    id: 'diploma',
    name: 'Diploma',
    location: 'LA Hoofdingang',
    points: 1,
    code: '3221',
    isLimited: false
  },
  droomreis: {
    id: 'droomreis',
    name: 'Ticket voor droomreis',
    location: 'LA Balie',
    points: 1,
    code: '2143',
    isLimited: false
  }
};

let gameState = {
  status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'PAUSED' | 'ENDED'
  timeRemaining: GAME_DURATION_SECONDS,
  totalDuration: GAME_DURATION_SECONDS,
  limitedItemsMaxClaims: 1,
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
let serverDistractionCounter = 0;
let nextServerDistractionSeconds = 20;

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
    limitedItemsMaxClaims: gameState.limitedItemsMaxClaims || 1,
    limitedItems: gameState.limitedItems,
    generalItems: gameState.generalItems,
    leaderboard: getLeaderboard(),
    jobRaiseUnlockSecondsLeft: gameState.jobRaiseUnlockSecondsLeft,
    trouwenUnlockSecondsLeft: gameState.trouwenUnlockSecondsLeft,
    jobRaiseUnlockTimerActive: gameState.jobRaiseUnlockTimerActive,
    trouwenUnlockTimerActive: gameState.trouwenUnlockTimerActive,
    activityLog: gameState.activityLog.slice(0, 15)
  });
}

function checkGameOverCondition() {
  if (gameState.status !== 'PLAYING') return;

  // Voorwaarde 1: Timer van 15 minuten is afgelopen
  if (gameState.timeRemaining <= 0) {
    endGame('TIJD_VERLOPEN');
    return;
  }

  // Voorwaarde 2: Alle behaalde limited en standaard items zijn verkregen
  const playerValues = Object.values(gameState.players);
  if (playerValues.length === 0) return;

  const generalKeys = Object.keys(gameState.generalItems);
  const limitedKeys = Object.keys(gameState.limitedItems);

  // Zijn alle limited items geclaimd (volgens maxClaims)?
  const allLimitedClaimed = limitedKeys.every(k => {
    const itm = gameState.limitedItems[k];
    if (!itm) return true;
    const max = itm.maxClaims || gameState.limitedItemsMaxClaims || 1;
    const count = (itm.claims && itm.claims.length) || (itm.claimedBy !== null ? 1 : 0);
    return count >= max;
  });

  // Heeft een speler alle 4 standaard items verkregen?
  const anyPlayerHasAllGeneral = playerValues.some(p => 
    generalKeys.every(k => (p.claimedItems || []).includes(k))
  );

  // Hebben alle actieve verbonden spelers alle standaard items behaald?
  const activePlayers = playerValues.filter(p => p.connected);
  const allActiveHaveAllGeneral = activePlayers.length > 0 && activePlayers.every(p => 
    generalKeys.every(k => (p.claimedItems || []).includes(k))
  );

  // Heeft een speler alle items behaald?
  const totalItemCount = generalKeys.length + limitedKeys.length;
  const anyPlayerHasAll = playerValues.some(p => (p.claimedItems || []).length >= totalItemCount);

  // Beëindig de game zodra 15 minuten voorbij zijn OF alle limited en standaard items zijn behaald!
  if (anyPlayerHasAll || (allLimitedClaimed && anyPlayerHasAllGeneral) || (allLimitedClaimed && allActiveHaveAllGeneral)) {
    endGame('ALLE_ITEMS_VERZAMELD');
  }
}

function startGame() {
  if (gameState.status === 'PLAYING') return;

  gameState.status = 'PLAYING';
  gameState.timeRemaining = GAME_DURATION_SECONDS;
  serverDistractionCounter = 0;
  nextServerDistractionSeconds = 20;
  
  addActivityLog('Spel gestart! De klok tikt: 15 minuten.', 'start');
  io.emit('game:started', { timeRemaining: gameState.timeRemaining });

  if (gameTimerInterval) clearInterval(gameTimerInterval);

  gameTimerInterval = setInterval(() => {
    if (gameState.status === 'PLAYING') {
      gameState.timeRemaining--;

      // Automatische afleidingsnotificaties om de 20-30 seconden tijdens het spel
      serverDistractionCounter++;
      if (serverDistractionCounter >= nextServerDistractionSeconds) {
        serverDistractionCounter = 0;
        nextServerDistractionSeconds = Math.floor(Math.random() * 11) + 20; // 20 tot 30 seconden
        
        const distractionList = [
          { app: 'TikTok', title: 'TikTok', message: 'Kijk deze virale video: "Bizarre ontdekking op camera vastgelegd..." 😱', platform: 'tiktok' },
          { app: 'Instagram', title: 'Instagram', message: '@lisa.kramer heeft je recente foto geliket ❤️', platform: 'instagram' },
          { app: 'Snapchat', title: 'Snapchat', message: '🔥 Je streak met Daan staat op 56 dagen! Stuur snel een snap terug!', platform: 'snapchat' },
          { app: 'BeReal', title: 'BeReal.', message: '⚠️ Tijd voor BeReal! Je hebt nog 2 minuten om je foto te posten.', platform: 'bereal' },
          { app: 'WhatsApp', title: 'WhatsApp • Moeder', message: 'Heb je deze leuke video al gezien? 😂 Wat eten we vanavond?', platform: 'whatsapp' },
          { app: 'WhatsApp', title: 'WhatsApp • Vriendengroep', message: 'Daan: Wie heeft er straks zin om een potje te gamen? 🎮', platform: 'whatsapp' }
        ];
        const pick = distractionList[Math.floor(Math.random() * distractionList.length)];
        io.emit('notification:push', pick);
      }

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

      // Actieve speler-cooldowns per seconde bijhouden (pauzeert tijdens doomscrollen)
      Object.values(gameState.players).forEach((p) => {
        if (!p.inDoomscroll && p.cooldowns) {
          Object.keys(p.cooldowns).forEach((id) => {
            if (p.cooldowns[id] > 0) {
              p.cooldowns[id]--;
              if (p.cooldowns[id] <= 0) {
                delete p.cooldowns[id];
                if (p.cooldownRewarded) delete p.cooldownRewarded[id];
              }
            }
          });
        }
      });

      // Elke seconde timer tick uitzenden
      io.emit('timer:tick', {
        timeRemaining: gameState.timeRemaining,
        formattedTime: formatSeconds(gameState.timeRemaining),
        jobRaiseUnlockSecondsLeft: gameState.jobRaiseUnlockSecondsLeft,
        trouwenUnlockSecondsLeft: gameState.trouwenUnlockSecondsLeft,
        jobRaiseUnlockTimerActive: gameState.jobRaiseUnlockTimerActive,
        trouwenUnlockTimerActive: gameState.trouwenUnlockTimerActive
      });

      checkGameOverCondition();
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

  // Bewaar aangepaste locaties, secret locaties, codes en maxClaims
  const savedLocations = {};
  const savedSecretLocations = {};
  const savedCodes = {};
  const savedMaxClaims = {};

  Object.values(gameState.generalItems).forEach(item => {
    savedLocations[item.id] = item.location;
    savedCodes[item.id] = item.code;
  });
  Object.values(gameState.limitedItems).forEach(item => {
    savedSecretLocations[item.id] = item.secretLocation || 'Locatie';
    savedCodes[item.id] = item.code;
    savedMaxClaims[item.id] = item.maxClaims || 1;
  });

  gameState.status = 'LOBBY';
  gameState.timeRemaining = gameState.totalDuration || GAME_DURATION_SECONDS;
  gameState.limitedItems = JSON.parse(JSON.stringify(INITIAL_LIMITED_ITEMS));
  gameState.generalItems = JSON.parse(JSON.stringify(INITIAL_GENERAL_ITEMS));

  // Herstel eventuele aangepaste locaties, secret locaties, codes en maxClaims
  Object.keys(savedLocations).forEach(id => {
    if (gameState.generalItems[id] && savedLocations[id]) gameState.generalItems[id].location = savedLocations[id];
  });
  Object.keys(savedSecretLocations).forEach(id => {
    if (gameState.limitedItems[id] && savedSecretLocations[id]) {
      gameState.limitedItems[id].secretLocation = savedSecretLocations[id];
      gameState.limitedItems[id].location = '❓ Verborgen (Los taak op)';
    }
  });
  Object.keys(savedCodes).forEach(id => {
    if (gameState.generalItems[id] && savedCodes[id]) gameState.generalItems[id].code = savedCodes[id];
    if (gameState.limitedItems[id] && savedCodes[id]) gameState.limitedItems[id].code = savedCodes[id];
  });
  Object.keys(savedMaxClaims).forEach(id => {
    if (gameState.limitedItems[id] && savedMaxClaims[id]) {
      gameState.limitedItems[id].maxClaims = savedMaxClaims[id];
    }
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
    trouwenUnlockSecondsLeft: gameState.trouwenUnlockSecondsLeft,
    jobRaiseUnlockTimerActive: gameState.jobRaiseUnlockTimerActive,
    trouwenUnlockTimerActive: gameState.trouwenUnlockTimerActive,
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

  socket.on('admin:set_limited_claims', (data) => {
    if (!data || !data.maxClaims) return;
    const max = Math.max(1, parseInt(data.maxClaims, 10));
    gameState.limitedItemsMaxClaims = max;
    Object.values(gameState.limitedItems).forEach(item => {
      item.maxClaims = max;
    });
    addActivityLog(`Voorraad per limited item ingesteld op ${max}x per item.`, 'info');
    io.emit('settings:updated', {
      generalItems: gameState.generalItems,
      limitedItems: gameState.limitedItems,
      limitedItemsMaxClaims: gameState.limitedItemsMaxClaims,
      totalDuration: gameState.totalDuration
    });
    broadcastFullState();
  });

  socket.on('settings:update', (data, callback) => {
    if (!data) return;
    if (data.limitedItemsMaxClaims) {
      const max = Math.max(1, parseInt(data.limitedItemsMaxClaims, 10));
      gameState.limitedItemsMaxClaims = max;
      Object.values(gameState.limitedItems).forEach(item => {
        item.maxClaims = max;
      });
    }
    if (data.items) {
      Object.keys(data.items).forEach(id => {
        const itemUpdate = data.items[id];
        if (gameState.generalItems[id]) {
          if (itemUpdate.location !== undefined) gameState.generalItems[id].location = itemUpdate.location.trim();
          if (itemUpdate.code !== undefined) gameState.generalItems[id].code = itemUpdate.code.trim();
        }
        if (gameState.limitedItems[id]) {
          if (itemUpdate.location !== undefined) {
            gameState.limitedItems[id].secretLocation = itemUpdate.location.trim();
            gameState.limitedItems[id].location = '❓ Verborgen (Los taak op)';
          }
          if (itemUpdate.code !== undefined) gameState.limitedItems[id].code = itemUpdate.code.trim();
          if (itemUpdate.maxClaims !== undefined) {
            gameState.limitedItems[id].maxClaims = Math.max(1, parseInt(itemUpdate.maxClaims, 10));
          }
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
      'WhatsApp: 👩 Moeder: "Heb je deze leuke video al gezien? 😂 Wat eten we vanavond?"',
      'TikTok: 🔥 Kijk deze virale video over een bizarre ontdekking!',
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

  // SPELER VERWIJDEREN UIT DE LOBBY (DOOR SPELLEIDER)
  socket.on('admin:remove_player', (data) => {
    const playerId = typeof data === 'string' ? data : data?.playerId;
    if (!playerId) return;

    const player = gameState.players[playerId];
    if (player) {
      const playerName = player.name;
      const targetSocketId = player.socketId;

      delete gameState.players[playerId];
      addActivityLog(`${playerName} is verwijderd uit de lobby door de spelleider.`, 'info');

      if (targetSocketId && targetSocketId !== 'bot') {
        io.to(targetSocketId).emit('player:kicked', {
          reason: 'Je bent uit de lobby verwijderd door de spelleider.'
        });
      }

      broadcastFullState();
    }
  });

  // ALLE SPELERS VERWIJDEREN UIT DE LOBBY (RESET LOBBY)
  socket.on('admin:clear_lobby_players', () => {
    const playerList = Object.values(gameState.players);
    playerList.forEach(p => {
      if (p.socketId && p.socketId !== 'bot') {
        io.to(p.socketId).emit('player:kicked', {
          reason: 'De lobby is leeggemaakt door de spelleider.'
        });
      }
    });

    gameState.players = {};
    addActivityLog('Alle spelers zijn verwijderd uit de lobby.', 'info');
    broadcastFullState();
  });

  // SPELER VERLAAT ZELF DE LOBBY (MOBIELE APP)
  socket.on('player:leave_lobby', (data) => {
    const playerId = socket.data?.playerId || data?.playerId;
    if (playerId && gameState.players[playerId]) {
      const playerName = gameState.players[playerId].name;
      delete gameState.players[playerId];
      addActivityLog(`${playerName} heeft de lobby verlaten.`, 'info');
      socket.emit('player:kicked', {
        reason: 'Je hebt de lobby verlaten.'
      });
      broadcastFullState();
    }
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

    // Exclusiviteit follow-up items controleren:
    // Job Raise mag ALLEEN geclaimd worden door de speler(s) die het Job Interview hebben behaald
    if (itemId === 'job_raise') {
      const interviewItem = gameState.limitedItems.job_interview;
      const eligibleIds = interviewItem?.claims && interviewItem.claims.length > 0
        ? interviewItem.claims.map(c => c.playerId)
        : (interviewItem?.claimedBy ? [interviewItem.claimedBy] : []);
      if (eligibleIds.length === 0 || !eligibleIds.includes(socket.data.playerId)) {
        const interviewWinners = interviewItem?.claims?.map(c => c.playerName).join(' en ')
          || interviewItem?.claimedByName
          || 'de winnaar van het Job Interview';
        if (callback) callback({
          success: false,
          error: `🔒 Alleen ${interviewWinners} (winnaar van het Job Interview) kan de Job Raise claimen!`
        });
        return;
      }
    }
    // Trouwen mag ALLEEN geclaimd worden door de speler(s) die de Date hebben behaald
    if (itemId === 'trouwen') {
      const dateItem = gameState.limitedItems.date;
      const eligibleIds = dateItem?.claims && dateItem.claims.length > 0
        ? dateItem.claims.map(c => c.playerId)
        : (dateItem?.claimedBy ? [dateItem.claimedBy] : []);
      if (eligibleIds.length === 0 || !eligibleIds.includes(socket.data.playerId)) {
        const dateWinners = dateItem?.claims?.map(c => c.playerName).join(' en ')
          || dateItem?.claimedByName
          || 'de winnaar van de Date';
        if (callback) callback({
          success: false,
          error: `🔒 Alleen ${dateWinners} (winnaar van de Date) kan gaan Trouwen!`
        });
        return;
      }
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

    // Exclusiviteit follow-up items controleren:
    if (itemId === 'job_raise') {
      const interviewItem = gameState.limitedItems.job_interview;
      const eligibleIds = interviewItem?.claims && interviewItem.claims.length > 0
        ? interviewItem.claims.map(c => c.playerId)
        : (interviewItem?.claimedBy ? [interviewItem.claimedBy] : []);
      if (eligibleIds.length === 0 || !eligibleIds.includes(playerId)) {
        const interviewWinners = interviewItem?.claims?.map(c => c.playerName).join(' en ')
          || interviewItem?.claimedByName
          || 'de winnaar van het Job Interview';
        if (callback) callback({
          success: false,
          error: `🔒 Alleen ${interviewWinners} (winnaar van het Job Interview) kan de Job Raise claimen!`
        });
        return;
      }
    }
    if (itemId === 'trouwen') {
      const dateItem = gameState.limitedItems.date;
      const eligibleIds = dateItem?.claims && dateItem.claims.length > 0
        ? dateItem.claims.map(c => c.playerId)
        : (dateItem?.claimedBy ? [dateItem.claimedBy] : []);
      if (eligibleIds.length === 0 || !eligibleIds.includes(playerId)) {
        const dateWinners = dateItem?.claims?.map(c => c.playerName).join(' en ')
          || dateItem?.claimedByName
          || 'de winnaar van de Date';
        if (callback) callback({
          success: false,
          error: `🔒 Alleen ${dateWinners} (winnaar van de Date) kan gaan Trouwen!`
        });
        return;
      }
    }

    // Controleer of speler dit item al bezit
    if ((player.claimedItems || []).includes(itemId)) {
      if (callback) callback({ success: false, error: 'Je hebt dit item al geclaimd!' });
      return;
    }

    // Controleer of limited item al gekaapt is
    if (isLimited) {
      itemData.claims = itemData.claims || [];
      if (itemData.claimedBy && itemData.claims.length === 0) {
        itemData.claims.push({ playerId: itemData.claimedBy, playerName: itemData.claimedByName, claimedAt: itemData.claimedAt });
      }
      const maxClaims = itemData.maxClaims || gameState.limitedItemsMaxClaims || 1;
      if (itemData.claims.length >= maxClaims && !itemData.claims.some(c => c.playerId === playerId)) {
        const winners = itemData.claims.map(c => c.playerName).join(' en ');
        if (callback) callback({
          success: false,
          error: `Helaas! Dit limited item is al geclaimd door ${winners}! OP = OP.`
        });
        return;
      }
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
        itemData.claims = itemData.claims || [];
        const claimRecord = { playerId, playerName: player.name, claimedAt: new Date().toISOString() };
        if (!itemData.claims.some(c => c.playerId === playerId)) {
          itemData.claims.push(claimRecord);
        }
        itemData.claimedBy = itemData.claims[0].playerId;
        itemData.claimedByName = itemData.claims.map(c => c.playerName).join(', ');
        itemData.claimedAt = claimRecord.claimedAt;

        const maxClaims = itemData.maxClaims || gameState.limitedItemsMaxClaims || 1;
        const remaining = Math.max(0, maxClaims - itemData.claims.length);

        addActivityLog(`⭐ ${player.name} heeft het LIMITED item "${itemData.name}" geclaimd! (+${points} pt)`, 'claim', player.name);

        const toastMsg = remaining === 0
          ? `${player.name} heeft de laatste ${itemData.name} gepakt! (OP = OP)`
          : `${player.name} heeft ${itemData.name} geclaimd! (Nog ${remaining} beschikbaar)`;

        // Broadcast aan ALLE andere spelers dat dit limited item geclaimd is
        socket.broadcast.emit('item:limited_claimed', {
          playerId,
          playerName: player.name,
          itemId,
          itemName: itemData.name,
          remaining,
          toastMessage: toastMsg
        });

        // Als dit het Job Interview is, ontgrendel Job Raise na 60 seconden
        if (itemId === 'job_interview') {
          if (gameState.limitedItems.job_raise) {
            gameState.limitedItems.job_raise.eligiblePlayerIds = gameState.limitedItems.job_raise.eligiblePlayerIds || [];
            if (!gameState.limitedItems.job_raise.eligiblePlayerIds.includes(playerId)) {
              gameState.limitedItems.job_raise.eligiblePlayerIds.push(playerId);
            }
            gameState.limitedItems.job_raise.eligiblePlayerId = playerId;
            gameState.limitedItems.job_raise.eligiblePlayerName = player.name;
          }
          gameState.jobRaiseUnlockTimerActive = true;
          gameState.jobRaiseUnlockSecondsLeft = 60;
          addActivityLog(`⏱️ Timer gestart: Job Raise ontgrendelt over 1 minuut (exclusief voor ${player.name})!`, 'info');
          io.emit('item:unlock_countdown_started', {
            itemId: 'job_raise',
            secondsLeft: 60,
            eligiblePlayerId: playerId,
            eligiblePlayerName: player.name,
            message: `Job Raise ontgrendelt over 1 minuut exclusief voor ${player.name}! Houd de kaart in de gaten.`
          });
        } else if (itemId === 'date') {
          if (gameState.limitedItems.trouwen) {
            gameState.limitedItems.trouwen.eligiblePlayerIds = gameState.limitedItems.trouwen.eligiblePlayerIds || [];
            if (!gameState.limitedItems.trouwen.eligiblePlayerIds.includes(playerId)) {
              gameState.limitedItems.trouwen.eligiblePlayerIds.push(playerId);
            }
            gameState.limitedItems.trouwen.eligiblePlayerId = playerId;
            gameState.limitedItems.trouwen.eligiblePlayerName = player.name;
          }
          gameState.trouwenUnlockTimerActive = true;
          gameState.trouwenUnlockSecondsLeft = 60;
          addActivityLog(`⏱️ Timer gestart: Trouwen ontgrendelt over 1 minuut (exclusief voor ${player.name})!`, 'info');
          io.emit('item:unlock_countdown_started', {
            itemId: 'trouwen',
            secondsLeft: 60,
            eligiblePlayerId: playerId,
            eligiblePlayerName: player.name,
            message: `💍 De date was een succes! "Trouwen" ontgrendelt over 1 minuut exclusief voor ${player.name}!`
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
      player.cooldownRewarded = player.cooldownRewarded || {};
      player.cooldownRewarded[itemId] = false;

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
      if (player.cooldownRewarded && player.cooldownRewarded[itemId]) {
        if (callback) callback({
          success: false,
          alreadyClaimed: true,
          newCooldown: player.cooldowns[itemId],
          message: 'Je hebt de zelfbeheersingskorting voor deze cooldown al ontvangen.'
        });
        return;
      }

      player.cooldownRewarded = player.cooldownRewarded || {};
      player.cooldownRewarded[itemId] = true;

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

