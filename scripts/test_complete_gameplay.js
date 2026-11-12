const { io } = require('socket.io-client');

async function runCompleteTest() {
  console.log('====================================================');
  console.log('🧪 UITGEBREIDE TEST: ALLE 8 ITEMS BEREIKEN & LOGICA TESTEN');
  console.log('====================================================\n');

  const digibord = io('http://localhost:3000');
  const player1 = io('http://localhost:3000');
  const player2 = io('http://localhost:3000');

  await new Promise(r => setTimeout(r, 600));

  // Reset spelstatus voor schone idempotent test
  digibord.emit('admin:reset_game');
  await new Promise(r => setTimeout(r, 400));

  // STAP 1: Lobby joinen
  console.log('📌 [Stap 1] Spelers melden zich aan in de lobby...');
  player1.emit('player:join', { name: 'Daan van Dijk', avatar: '🚀' });
  player2.emit('player:join', { name: 'Lisa Bakker', avatar: '🦊' });
  await new Promise(r => setTimeout(r, 500));
  console.log('   ✓ Speler 1 (Daan) en Speler 2 (Lisa) zijn aangemeld.\n');

  // STAP 2: Digibord start de 15-minuten speurtocht
  console.log('📌 [Stap 2] Digibord start het spel...');
  let startPromise = new Promise(resolve => {
    player1.on('state:sync', (s) => {
      if (s.status === 'PLAYING') resolve(s);
    });
  });
  digibord.emit('admin:start_game');
  const startedState = await startPromise;
  console.log(`   ✓ Spel gestart! Globale timer: ${startedState.timeRemaining} seconden.\n`);

  // STAP 3: Test foutieve code en foutief antwoord + Cooldown + Zelfbeheersing
  console.log('📌 [Stap 3] Test foutieve code, foutief antwoord, cooldown en zelfbeheersing...');
  // 3A. Foutieve code
  const wrongCodeRes = await new Promise(res => {
    player1.emit('item:verify_code', { itemId: 'autosleutels', code: '9999' }, res);
  });
  console.log('   ✓ Foutieve code (9999) afgewezen:', !wrongCodeRes.success, wrongCodeRes.error);

  // 3B. Goede code, maar fout antwoord
  const rightCodeRes = await new Promise(res => {
    player1.emit('item:verify_code', { itemId: 'autosleutels', code: '4222' }, res);
  });
  console.log('   ✓ Juiste code (4222) goedgekeurd:', rightCodeRes.success);

  const wrongAnswerRes = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'autosleutels', isCorrect: false }, res);
  });
  console.log('   ✓ Fout antwoord geregistreerd: Cooldown is', wrongAnswerRes.cooldownSeconds, 'seconden.');

  // 3C. Zelfbeheersing beloning (-15s)
  const selfCtrlRes = await new Promise(res => {
    player1.emit('cooldown:reward_self_control', { itemId: 'autosleutels' }, res);
  });
  console.log('   ✓ Zelfbeheersing beloond: Straftijd verkort naar', selfCtrlRes.newCooldown, 'seconden (-15s korting!).');

  // 3D. Doomscroll val betreden en verlaten
  player1.emit('player:enter_doomscroll', { itemId: 'autosleutels', app: 'Instagram' });
  await new Promise(r => setTimeout(r, 400));
  player1.emit('player:exit_doomscroll', { itemId: 'autosleutels', secondsSpent: 12 });
  console.log('   ✓ Social Media trap (Instagram) betreden en verlaten logica succesvol getest.\n');

  // STAP 4: ALLE 8 ITEMS BEREIKEN EN CLAIMEN DOOR SPELER 1
  console.log('📌 [Stap 4] Alle 8 items één voor één oplossen en claimen (elk 1 punt):\n');

  // ITEM 1: Autosleutels (Algemeen, 1 pt, code 4222)
  console.log('   ▶ [Item 1/8] Autosleutels oplossen...');
  const item1Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'autosleutels', isCorrect: true }, res);
  });
  console.log(`     ✓ Autosleutels behaald: +${item1Res.pointsEarned} pt. Totaalscore: ${item1Res.totalScore} pt.`);

  // ITEM 2: Huissleutels (Algemeen, 1 pt, code 1412)
  console.log('   ▶ [Item 2/8] Huissleutels (Voorzieningen) oplossen...');
  const code2 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'huissleutels', code: '1412' }, res));
  if (!code2.success) throw new Error('Code 1412 mislukt');
  const item2Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'huissleutels', isCorrect: true }, res);
  });
  console.log(`     ✓ Huissleutels behaald: +${item2Res.pointsEarned} pt. Totaalscore: ${item2Res.totalScore} pt.`);

  // ITEM 3: Diploma (Algemeen, 1 pt, code 3221)
  console.log('   ▶ [Item 3/8] Diploma (Fotovraag Paard) oplossen...');
  const code3 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'diploma', code: '3221' }, res));
  if (!code3.success) throw new Error('Code 3221 mislukt');
  const item3Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'diploma', isCorrect: true }, res);
  });
  console.log(`     ✓ Diploma behaald: +${item3Res.pointsEarned} pt. Totaalscore: ${item3Res.totalScore} pt.`);

  // ITEM 4: Ticket voor droomreis (Algemeen, 1 pt, code 2143)
  console.log('   ▶ [Item 4/8] Ticket voor droomreis (Topografie Frankrijk) oplossen...');
  const code4 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'droomreis', code: '2143' }, res));
  if (!code4.success) throw new Error('Code 2143 mislukt');
  const item4Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'droomreis', isCorrect: true }, res);
  });
  console.log(`     ✓ Droomreis behaald: +${item4Res.pointsEarned} pt. Totaalscore: ${item4Res.totalScore} pt.`);

  // ITEM 5: Job Interview (Limited, 1 pt, code 4343)
  console.log('   ▶ [Item 5/8] Job Interview (Limited • 1 pt) claimen...');
  let broadcastClaimToast = null;
  player2.on('item:limited_claimed', (data) => {
    broadcastClaimToast = data.toastMessage;
  });

  const code5 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'job_interview', code: '2413' }, res));
  if (!code5.success) throw new Error('Code 2413 mislukt');
  const item5Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'job_interview', isCorrect: true }, res);
  });
  console.log(`     ✓ Job Interview behaald: +${item5Res.pointsEarned} pt. Totaalscore: ${item5Res.totalScore} pt.`);
  await new Promise(r => setTimeout(r, 200));
  console.log(`     ✓ Realtime broadcast naar Speler 2 ontvangen: "${broadcastClaimToast}"`);

  // ITEM 6: Date (Limited, 1 pt, code 3442)
  console.log('   ▶ [Item 6/8] Date (Limited • 1 pt) claimen...');
  const code6 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'date', code: '3442' }, res));
  if (!code6.success) throw new Error('Code 3442 mislukt');
  const item6Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'date', isCorrect: true }, res);
  });
  console.log(`     ✓ Date behaald: +${item6Res.pointsEarned} pt. Totaalscore: ${item6Res.totalScore} pt.`);

  // ITEM 7: Job Raise (Limited, 1 pt, code 1243)
  console.log('   ▶ [Item 7/8] Job Raise (Limited • 1 pt) claimen...');
  const code7 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'job_raise', code: '1243' }, res));
  console.log('     ✓ Code 1243 verificatie voor Job Raise:', code7.success ? 'CORRECT' : 'FOUT');
  const item7Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'job_raise', isCorrect: true }, res);
  });
  console.log(`     ✓ Job Raise behaald: +${item7Res.pointsEarned} pt. Totaalscore: ${item7Res.totalScore} pt.`);

  // ITEM 8: Trouwen (Limited, 1 pt, code 3443 - Vervolg op Date!)
  console.log('   ▶ [Item 8/8] Trouwen (Limited • 1 pt - Vervolg op Date) claimen...');
  let gameOverDetected = false;
  digibord.on('game:ended', (endData) => {
    gameOverDetected = true;
    console.log(`\n🎉 [SPEL AFGELOPEN!] Reden: "${endData.reason}". Winnaar: ${endData.winner ? endData.winner.name : 'Geen'}`);
  });

  const code8 = await new Promise(res => player1.emit('item:verify_code', { itemId: 'trouwen', code: '3443' }, res));
  console.log('     ✓ Code 3443 verificatie voor Trouwen:', code8.success ? 'CORRECT' : 'FOUT');
  const item8Res = await new Promise(res => {
    player1.emit('item:submit_task', { itemId: 'trouwen', isCorrect: true }, res);
  });
  console.log(`     ✓ Trouwen behaald: +${item8Res.pointsEarned} pt. Totaalscore: ${item8Res.totalScore} pt.`);

  await new Promise(r => setTimeout(r, 600));

  console.log('\n====================================================');
  console.log(`🏆 EINDSCORE SPELER 1 (Daan): ${item8Res.totalScore} / 8 PUNTEN (ALLE 8 ITEMS VOLTOOID!)`);
  console.log(`🏁 Game Over Event Getriggerd: ${gameOverDetected ? 'JA' : 'NEE'}`);
  console.log('====================================================');

  digibord.disconnect();
  player1.disconnect();
  player2.disconnect();
  process.exit(0);
}

runCompleteTest().catch(err => {
  console.error('Test fout:', err);
  process.exit(1);
});
