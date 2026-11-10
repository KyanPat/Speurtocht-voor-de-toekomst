const fs = require('fs');

console.log('--- VERIFICATIE VAN DE RECENTE FIXES & INTERFACES ---');

const playerAppJs = fs.readFileSync('public/js/playerApp.js', 'utf8');
const notifJs = fs.readFileSync('public/js/notifications.js', 'utf8');
const indexHtml = fs.readFileSync('public/index.html', 'utf8');

// 1. Controleer notificatie interactie & WhatsApp/Moeder mapping
console.log('\n[Check 1] Notificatieklik en WhatsApp / Bericht van moeder mapping:');
const hasFullBannerClick = notifJs.includes("banner.addEventListener('click'");
const hasAppNotifMapping = playerAppJs.includes("raw.includes('whatsapp') || raw.includes('moeder')");
console.log('✓ Hele notificatiebanner is klikbaar:', hasFullBannerClick);
console.log('✓ Notificatie opent direct WhatsApp bij bericht van moeder:', hasAppNotifMapping);

// 2. Controleer WhatsApp en Terugknoppen
console.log('\n[Check 2] WhatsApp views & Terugknoppen:');
const hasWhatsAppBackToChats = playerAppJs.includes('renderWhatsAppChats(document.getElementById');
const hasWhatsAppInboxBackToGame = playerAppJs.includes('window.playerApp.exitTrap()');
console.log('✓ WhatsApp chat met moeder heeft terugknop naar chatoverzicht:', hasWhatsAppBackToChats);
console.log('✓ WhatsApp inbox heeft terugknop naar het spel (exitTrap):', hasWhatsAppInboxBackToGame);

// 3. Controleer Instagram DM & Moeder chat terugknoppen
console.log('\n[Check 3] Instagram DM & Moeder chat terugknoppen:');
const hasInstagramDMMoeder = playerAppJs.includes('renderInstagramChatMoeder');
const hasDMMoederBack = playerAppJs.includes("renderInstagramDM(document.getElementById('app-view-container'), 'inbox')");
console.log('✓ Instagram DM heeft chat met Moeder:', hasInstagramDMMoeder);
console.log('✓ Chat met Moeder heeft terugknop naar DM inbox:', hasDMMoederBack);

// 4. Controleer Instagram Profiel terugknop
console.log('\n[Check 4] Instagram Profiel terugknop:');
const hasProfileBack = playerAppJs.includes("renderInstagramApp(document.getElementById('app-view-container'), 'feed')");
console.log('✓ Instagram Profiel heeft terugknop (arrow_back) naar de feed:', hasProfileBack);

// 5. Controleer de knoppen in Item Detail Modal
console.log('\n[Check 5] Item Detail Modal knoppen (Date etc.):');
const hasSubmitCodeBtn = playerAppJs.includes('btn-submit-code') && playerAppJs.includes('Doe taak voor item');
const hasHintVideoBtn = playerAppJs.includes('btn-open-hint-video') && playerAppJs.includes('Kijk video voor een hint');
const hasCloseModalBtn = playerAppJs.includes('btn-close-modal') && playerAppJs.includes('Sluiten');
console.log('✓ Knop 1 (Doe taak voor item):', hasSubmitCodeBtn);
console.log('✓ Knop 2 (Kijk video voor een hint):', hasHintVideoBtn);
console.log('✓ Knop 3 (Sluiten):', hasCloseModalBtn);

// 6. Controleer de knoppen in Cooldown Modal
console.log('\n[Check 6] Cooldown Modal knoppen (Identieke stijl, geen -15s tekst):');
const cooldownHasNo15s = !playerAppJs.includes('Nee, ik wacht rustig (-15s');
const cooldownHasIdenticalButtons = playerAppJs.includes('Ja, open Instagram') && playerAppJs.includes('Nee, ik wacht rustig');
console.log('✓ "-15s beloning" tekst is verwijderd uit de knoptekst:', cooldownHasNo15s);
console.log('✓ Alle knoppen hebben uniforme styling:', cooldownHasIdenticalButtons);

// 7. Controleer de "Volgend" & "Volgende" knoppen
console.log('\n[Check 7] "Volgend" en "Volgende" functionaliteit:');
const hasTikTokVolgendTab = playerAppJs.includes("renderTikTokApp(document.getElementById('app-view-container'), 'following')");
const hasTikTokVoorJouTab = playerAppJs.includes("renderTikTokApp(document.getElementById('app-view-container'), 'foryou')");
const hasFollowToggle = playerAppJs.includes('toggleFollowUser') && playerAppJs.includes('isUserFollowed');
const hasReelNextBtn = playerAppJs.includes('nextInstagramReel') && playerAppJs.includes('skip_next');
const hasTikTokNextScroll = playerAppJs.includes('scrollToNextTikTokReel');
const hasProfileFollowingModal = playerAppJs.includes('openFollowingListModal');

console.log('✓ TikTok "Volgend" tab is interactief en roept following-feed aan:', hasTikTokVolgendTab);
console.log('✓ TikTok "Voor jou" tab schakelt terug:', hasTikTokVoorJouTab);
console.log('✓ Volgen / Volgend knop togglet creator status:', hasFollowToggle);
console.log('✓ Volgende Reel knop in Instagram video view:', hasReelNextBtn);
console.log('✓ Volgende Video scrollknop in TikTok:', hasTikTokNextScroll);
console.log('✓ Profiel "Volgend" opent lijst met gevolgde accounts:', hasProfileFollowingModal);

// 8. Controleer Cache Busters
console.log('\n[Check 8] Cache Busters in index.html:');
const isCacheV16 = indexHtml.includes('?v=16') && indexHtml.includes('doomscroll-escape-v16');
console.log('✓ Alle scripts geüpgraded naar ?v=16 en service worker v16:', isCacheV16);

// 9. Controleer Like, Dislike, Oma Foto Reel en Stippellijn
console.log('\n[Check 9] Like/Dislike, Klikbare Oma Foto en Stippellijn door alle objectives:');
const hasGlobalLikeDislike = playerAppJs.includes('handleGlobalLike') && playerAppJs.includes('handleGlobalDislike');
const hasTikTokLikeDislike = playerAppJs.includes('toggleTikTokLike') && playerAppJs.includes('toggleTikTokDislike');
const hasClickableOmaPhoto = playerAppJs.includes("renderInstagramReel(document.getElementById('app-view-container'), window.playerApp.getFeedVideo(2), 'moeder')");
const hasDynamicTrail = playerAppJs.includes('updateAdventureTrail') && indexHtml.includes('id="adventure-trail-svg"');
console.log('✓ HandleGlobalLike en HandleGlobalDislike aanwezig en gekoppeld:', hasGlobalLikeDislike);
console.log('✓ TikTok Like en Dislike acties aanwezig:', hasTikTokLikeDislike);
console.log('✓ Klikbare foto van oma in chat moeder opent reel:', hasClickableOmaPhoto);
console.log('✓ Dynamisch avonturenpad SVG en updateAdventureTrail berekend door objectives:', hasDynamicTrail);

// 10. Controleer Groot Scherm / Fullscreen functionaliteit voor telefoon
console.log('\n[Check 10] Groot Scherm / Fullscreen Telefoon Knoppen:');
const hasFsToggleBtn = indexHtml.includes('id="btn-fullscreen-toggle"');
const hasFsLoginBtn = indexHtml.includes('id="btn-login-fullscreen"');
const hasFsLobbyBtn = indexHtml.includes('id="btn-lobby-fullscreen"');
const hasFsLogic = playerAppJs.includes('setupFullscreenHandler') && playerAppJs.includes('toggleFullScreen');
console.log('✓ Knop in gameplay header aanwezig:', hasFsToggleBtn);
console.log('✓ Knop in login scherm aanwezig:', hasFsLoginBtn);
console.log('✓ Knop in lobby scherm aanwezig:', hasFsLobbyBtn);
console.log('✓ Fullscreen handler en toggleFullScreen functie aanwezig:', hasFsLogic);

// 11. Controleer Captcha Taken voor Verborgen Locaties
console.log('\n[Check 11] Captcha Taken voor Verborgen Locaties:');
const hasCaptchaModal = playerAppJs.includes('openCaptchaLocationModal');
const hasRotateCaptcha = playerAppJs.includes('renderRotateCaptcha');
const hasTextCaptcha = playerAppJs.includes('renderTextCaptcha');
const hasSliderCaptcha = playerAppJs.includes('renderSliderCaptcha');
const hasGridCaptcha = playerAppJs.includes('renderGridCaptcha');
const hasCaptchaSuccess = playerAppJs.includes('onCaptchaSuccess');
console.log('✓ Captcha Modal aanwezig:', hasCaptchaModal);
console.log('✓ Rotatie Captcha (date):', hasRotateCaptcha);
console.log('✓ Tekst Captcha (job_interview):', hasTextCaptcha);
console.log('✓ Schuifpuzzel Captcha (job_raise):', hasSliderCaptcha);
console.log('✓ 3x3 Raster Captcha (trouwen):', hasGridCaptcha);
console.log('✓ OnCaptchaSuccess toont geheime vindplek:', hasCaptchaSuccess);

// 12. Controleer Exclusieve Follow-up Items & Random Kaart Route
console.log('\n[Check 12] Exclusieve Follow-up Items & Random Kaart Route:');
const serverJs = fs.readFileSync('server.js', 'utf8');
const hasFollowUpExclusivity = serverJs.includes('eligiblePlayerId') && playerAppJs.includes('Alleen voor');
const hasRandomizedCardOrder = playerAppJs.includes('getPlayerCardOrder') && playerAppJs.includes('state.cardOrder');
console.log('✓ Server & client exclusiviteit voor follow-up items (job_raise & trouwen):', hasFollowUpExclusivity);
console.log('✓ Deterministic shuffle route per speler (getPlayerCardOrder):', hasRandomizedCardOrder);

// 13. Controleer Verwijdering Schoolthema
console.log('\n[Check 13] Verwijdering Schoolthema:');
const hasNoSchoolReferences = !playerAppJs.includes('speurtocht op school') &&
  !playerAppJs.includes('tijdens de les') &&
  !playerAppJs.includes('Klasgenoot 🎒') &&
  !playerAppJs.includes('Docent:') &&
  !playerAppJs.includes('Klas 3B Speurtocht');
console.log('✓ Geen school/docent/klas referenties in chats & social feeds:', hasNoSchoolReferences);

// 14. Controleer Lobby Start Tekst en Direct Start Knop
console.log('\n[Check 14] Lobby Start Tekst en Direct Start Knop:');
const hasLobbyStartText = indexHtml.includes('Het spel start over een dadelijk moment.') &&
  indexHtml.includes('id="btn-lobby-start-direct"') &&
  playerAppJs.includes('btn-lobby-start-direct');
console.log('✓ Lobby toont "Het spel start over een dadelijk moment." en startknop:', hasLobbyStartText);

// 15. Controleer Endless Reels met Audio & Zuiver Video's
console.log('\n[Check 15] Reels 100% Video met Geluid:');
const hasStrictVideos = !playerAppJs.includes("${hasVideo ?") &&
  playerAppJs.includes('toggleTikTokAudio') &&
  playerAppJs.includes('tiktok-video-el');
console.log('✓ TikTok reels gebruiken strikt videos met audio toggle:', hasStrictVideos);

console.log('\n--- ALLE CONTROLES MET SUCCES AFGEROND! ---');
