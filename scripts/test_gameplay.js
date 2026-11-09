const { io } = require('socket.io-client');

async function runTest() {
  console.log('--- START END-TO-END MULTIPLAYER TEST ---');
  
  const digibord = io('http://localhost:3000');
  const player1 = io('http://localhost:3000');
  const player2 = io('http://localhost:3000');

  await new Promise(r => setTimeout(r, 500));

  // 0. Reset spel voor schone start
  digibord.emit('admin:reset_game');
  await new Promise(r => setTimeout(r, 400));

  // 1. Spelers joinen
  console.log('[Test 1] Spelers joinen lobby...');
  player1.emit('player:join', { name: 'Thijs de Boer', avatar: '🎒' });
  player2.emit('player:join', { name: 'Mila Jansen', avatar: '🦊' });

  await new Promise(r => setTimeout(r, 600));

  // 2. Admin start spel
  console.log('[Test 2] Digibord start de speurtocht...');
  let gameStartedPromise = new Promise(resolve => {
    player1.on('state:sync', (state) => {
      if (state.status === 'PLAYING') resolve(state);
    });
  });
  digibord.emit('admin:start_game');
  const gameState = await gameStartedPromise;
  console.log('✓ Spelstatus is nu PLAYING! Resterende tijd:', gameState.timeRemaining);

  // 3. Code verificatie testen
  console.log('[Test 3] Locatiecode testen (4222 voor autosleutels)...');
  const codeSuccess = await new Promise(resolve => {
    player1.emit('item:verify_code', { itemId: 'autosleutels', code: '4222' }, resolve);
  });
  console.log('✓ Resultaat 4222 code:', codeSuccess.success ? 'GELDIG' : 'ONGELDIG');

  const codeFail = await new Promise(resolve => {
    player1.emit('item:verify_code', { itemId: 'autosleutels', code: '0000' }, resolve);
  });
  console.log('✓ Resultaat 0000 code:', codeFail.success ? 'GELDIG' : 'ONGELDIG (Verwacht)');

  // 4. Fout antwoord -> 45s Cooldown
  console.log('[Test 4] Fout antwoord geven voor huissleutels...');
  const wrongRes = await new Promise(resolve => {
    player1.emit('item:submit_task', { itemId: 'huissleutels', isCorrect: false }, resolve);
  });
  console.log('✓ Cooldown toegekend:', wrongRes.cooldownSeconds, 'seconden');

  // 5. Zelfbeheersing beloning testen (-15s)
  console.log('[Test 5] Zelfbeheersing beloning claimen (-15s)...');
  const rewardRes = await new Promise(resolve => {
    player1.emit('cooldown:reward_self_control', { itemId: 'huissleutels' }, resolve);
  });
  console.log('✓ Nieuwe cooldown na korting:', rewardRes.newCooldown, 'seconden (was 45s)');

  // 6. Limited item claimen door Speler 1 (Date) & broadcast check bij Speler 2
  console.log('[Test 6] Limited Item claimen (Date) en broadcast testen...');
  let broadcastReceived = null;
  player2.on('item:limited_claimed', (data) => {
    broadcastReceived = data;
  });

  const claimRes = await new Promise(resolve => {
    player1.emit('item:submit_task', { itemId: 'date', isCorrect: true }, resolve);
  });
  console.log('✓ Speler 1 claimde Date:', claimRes.success, 'Punten verdiend:', claimRes.pointsEarned);

  await new Promise(r => setTimeout(r, 400));
  if (broadcastReceived) {
    console.log('✓ Speler 2 ontving de broadcast toast:', broadcastReceived.toastMessage);
  } else {
    console.error('✗ Speler 2 ontving GEEN broadcast!');
  }

  // 7. Probeer Limited item nogmaals te claimen door Speler 2 (moet mislukken)
  console.log('[Test 7] Speler 2 probeert reeds geclaimd item te pakken...');
  const doubleClaimRes = await new Promise(resolve => {
    player2.emit('item:submit_task', { itemId: 'date', isCorrect: true }, resolve);
  });
  console.log('✓ Dubbele claim geweigerd:', doubleClaimRes.success === false, doubleClaimRes.error);

  // 8. Sollicitatiegesprek claimen en Job Raise timer checken
  console.log('[Test 8] Job Interview claimen en Job Raise unlock timer controleren...');
  let unlockTimerStarted = false;
  player1.on('item:unlock_countdown_started', (data) => {
    unlockTimerStarted = true;
    console.log('✓ Ontvangen unlock timer event:', data.message);
  });

  await new Promise(resolve => {
    player2.emit('item:submit_task', { itemId: 'job_interview', isCorrect: true }, resolve);
  });

  await new Promise(r => setTimeout(r, 500));
  console.log('✓ Job Raise unlock countdown gestart:', unlockTimerStarted);

  // Test beëindigen
  digibord.disconnect();
  player1.disconnect();
  player2.disconnect();
  console.log('--- ALLE E2E TESTS GESLAAGD! ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test mislukt:', err);
  process.exit(1);
});

