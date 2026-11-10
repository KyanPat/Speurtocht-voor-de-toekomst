const http = require('http');
const io = require('socket.io-client');
const fs = require('fs');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + path, (res) => {
      resolve({
        path,
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length']
      });
    }).on('error', (e) => resolve({ path, error: e.message }));
  });
}

async function runTests() {
  console.log('=== TEST 1: STATIC ASSETS & SOUNDS & BANNER ===');
  
  // 1. Check speltip banner removed
  const html = fs.readFileSync('public/index.html', 'utf8');
  if (html.includes('Speltip: Pas op voor video-hints')) {
    console.error('❌ Speltip banner still present in index.html!');
    process.exit(1);
  } else {
    console.log('✅ Speltip banner successfully removed from index.html.');
  }

  // 2. Check sounds
  const sounds = ['whatsapp.wav', 'snapchat.wav', 'instagram.wav', 'bereal.wav', 'tiktok.wav'];
  for (const s of sounds) {
    const res = await testEndpoint('/assets/sounds/' + s);
    if (res.statusCode === 200 && res.contentType && res.contentType.includes('audio')) {
      console.log(`✅ Sound ${s}: 200 OK (${res.contentType}, ${res.contentLength} bytes)`);
    } else {
      console.error(`❌ Sound ${s} failed:`, res);
      process.exit(1);
    }
  }

  // 3. Check videos
  const videos = [
    'friday_chill.mp4', 'bear_stream.mp4', 'echo_music.mp4',
    'sintel_trailer.mp4', 'bunny_cartoon.mp4', 'movie_300.mp4', 'oceans.mp4'
  ];
  for (const v of videos) {
    const res = await testEndpoint('/assets/videos/' + v);
    if (res.statusCode === 200 && res.contentType && res.contentType.includes('video')) {
      console.log(`✅ Video ${v}: 200 OK (${res.contentType}, ${res.contentLength} bytes)`);
    } else {
      console.error(`❌ Video ${v} failed:`, res);
      process.exit(1);
    }
  }

  console.log('\n=== TEST 2: END GAME CONDITIONS VIA SOCKET.IO ===');
  
  const digibordSocket = io('http://localhost:3000');
  const playerSocket = io('http://localhost:3000');

  await new Promise(r => setTimeout(r, 800));

  // Reset game first to get fresh state
  digibordSocket.emit('admin:reset_game');
  await new Promise(r => setTimeout(r, 500));

  // Player joins
  let registeredPlayer = null;
  playerSocket.on('player:registered', (data) => {
    registeredPlayer = data.player || data;
  });

  playerSocket.emit('player:join', {
    name: 'TestSpelerEindSpel',
    avatar: '🦊'
  });

  await new Promise(r => setTimeout(r, 600));
  if (!registeredPlayer) {
    console.error('❌ Player failed to register');
    process.exit(1);
  }
  console.log('✅ Player registered successfully:', registeredPlayer.name);

  // Digibord starts game
  let gameStarted = false;
  playerSocket.on('game:started', () => { gameStarted = true; });
  digibordSocket.emit('admin:start_game');
  await new Promise(r => setTimeout(r, 600));

  if (!gameStarted) {
    console.error('❌ Game failed to start');
    process.exit(1);
  }
  console.log('✅ Game started successfully!');

  // Check ending when all items are claimed
  let endedPromise = new Promise((resolve) => {
    playerSocket.on('game:ended', (data) => {
      resolve(data);
    });
  });

  // Submit all 4 general items, then date -> trouwen, job_interview -> job_raise
  const itemsToSubmit = [
    { id: 'autosleutels' },
    { id: 'huissleutels' },
    { id: 'diploma' },
    { id: 'droomreis' },
    { id: 'date' },
    { id: 'trouwen' },
    { id: 'job_interview' },
    { id: 'job_raise' }
  ];

  console.log('Submitting all items...');
  for (const itm of itemsToSubmit) {
    await new Promise(res => {
      playerSocket.emit('item:submit_task', { itemId: itm.id, isCorrect: true }, (ack) => {
        console.log(`  Claimed ${itm.id}:`, ack ? ack.success : 'no ack');
        res();
      });
    });
    await new Promise(r => setTimeout(r, 100));
  }

  // Wait for game:ended
  const endData = await Promise.race([
    endedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for game:ended')), 3000))
  ]);

  console.log('✅ Received game:ended event on all items collected:', endData.reason);
  if (!endData.reason.includes('Alle items op de kaart zijn gevonden en geclaimd')) {
    console.error('❌ Unexpected reason:', endData.reason);
    process.exit(1);
  }

  digibordSocket.close();
  playerSocket.close();

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
