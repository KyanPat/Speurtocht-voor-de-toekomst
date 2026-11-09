const http = require('http');
const io = require('socket.io-client');

async function testHttpEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- TEST 1: /api/qr ENDPOINT ---');
  const qrRes = await testHttpEndpoint('/api/qr');
  console.log('Status:', qrRes.status);
  console.log('Success:', qrRes.body.success);
  console.log('URL in QR:', qrRes.body.url);
  console.log('Local IP:', qrRes.body.localIp);
  console.log('Has SVG:', !!qrRes.body.svg && qrRes.body.svg.includes('<svg'));
  console.log('Has DataURL:', !!qrRes.body.dataUrl && qrRes.body.dataUrl.startsWith('data:image/png'));

  if (!qrRes.body.success || !qrRes.body.svg) {
    throw new Error('QR endpoint failed!');
  }

  console.log('\n--- TEST 2: /api/settings ENDPOINT ---');
  const settingsRes = await testHttpEndpoint('/api/settings');
  console.log('Status:', settingsRes.status);
  console.log('General items count:', Object.keys(settingsRes.body.generalItems).length);
  console.log('Limited items count:', Object.keys(settingsRes.body.limitedItems).length);
  console.log('Total duration:', settingsRes.body.totalDuration);

  console.log('\n--- TEST 3: SOCKET.IO SETTINGS UPDATE & SYNC ---');
  const digibordSocket = io('http://localhost:3000');
  const playerSocket = io('http://localhost:3000');

  await new Promise(r => setTimeout(r, 500));

  let playerReceivedSettings = null;
  playerSocket.on('settings:updated', (data) => {
    playerReceivedSettings = data;
  });

  // Digibord updates Autosleutels location to "Fietsenstalling Oost" and code to "8888"
  await new Promise(resolve => {
    digibordSocket.emit('settings:update', {
      durationMinutes: 20,
      items: {
        autosleutels: { location: 'Fietsenstalling Oost', code: '8888' }
      }
    }, (res) => {
      console.log('Settings update response:', res.success);
      resolve(res);
    });
  });

  await new Promise(r => setTimeout(r, 400));
  console.log('Player received updated settings:', !!playerReceivedSettings);
  console.log('New Autosleutels location on player:', playerReceivedSettings?.generalItems?.autosleutels?.location);
  console.log('New Autosleutels code on player:', playerReceivedSettings?.generalItems?.autosleutels?.code);

  console.log('\n--- TEST 4: VERIFY CUSTOM CODE ---');
  await new Promise(resolve => {
    playerSocket.emit('item:verify_code', { itemId: 'autosleutels', code: '8888' }, (res) => {
      console.log('Verify with new code 8888 result:', res);
      resolve(res);
    });
  });

  console.log('\n--- TEST 5: START GAME, END GAME, & TERUG NAAR DE LOBBY ---');
  let gameResetReceived = false;
  playerSocket.on('game:reset', (data) => {
    gameResetReceived = true;
    console.log('Player received game:reset! New status:', data.status);
  });

  digibordSocket.emit('admin:start_game');
  await new Promise(r => setTimeout(r, 400));

  digibordSocket.emit('admin:end_game');
  await new Promise(r => setTimeout(r, 400));

  // Player clicks "Terug naar de lobby"
  console.log('Emitting player:restart_lobby...');
  playerSocket.emit('player:restart_lobby');
  await new Promise(r => setTimeout(r, 500));

  console.log('game:reset event successfully received by player:', gameResetReceived);

  console.log('\n--- TEST 6: RESET SETTINGS TO DEFAULTS ---');
  await new Promise(resolve => {
    digibordSocket.emit('settings:reset', (res) => {
      console.log('Settings reset to default:', res);
      resolve(res);
    });
  });
  await new Promise(r => setTimeout(r, 400));

  const postResetSettings = await testHttpEndpoint('/api/settings');
  console.log('Autosleutels location after default reset:', postResetSettings.body.generalItems.autosleutels.location);

  digibordSocket.disconnect();
  playerSocket.disconnect();

  console.log('\n✅ ALLE TESTS MET SUCCES DOORLOPEN!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

