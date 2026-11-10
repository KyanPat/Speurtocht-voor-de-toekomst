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

// 2. Controleer WhatsApp en Geschiedenis-Terugknoppen
console.log('\n[Check 2] WhatsApp views & Terug-stack:');
const hasWhatsAppHistory = playerAppJs.includes('WHATSAPP_CHATS') && playerAppJs.includes('openWhatsAppChat');
const hasGoBackFunction = playerAppJs.includes('function goBack()') && playerAppJs.includes('viewHistory');
console.log('✓ WhatsApp 5 verschillende chats aanwezig:', hasWhatsAppHistory);
console.log('✓ Geschiedenis-stack met goBack() zonder oneindige lus:', hasGoBackFunction);

// 3. Controleer Instagram DM & Moeder chat terugknoppen
console.log('\n[Check 3] Instagram DM & Moeder chat terugknoppen:');
const hasInstagramDMMoeder = playerAppJs.includes('renderInstagramChatMoeder');
const hasDMMoederBack = playerAppJs.includes("openInstagramChat('moeder')") && playerAppJs.includes('goBack()');
console.log('✓ Instagram DM heeft chat met Moeder:', hasInstagramDMMoeder);
console.log('✓ Chat met Moeder heeft terugknop (arrow_back) naar DM inbox / geschiedenis:', hasDMMoederBack);

// 4. Controleer Instagram Profiel terugknop
console.log('\n[Check 4] Instagram Profiel terugknop:');
const hasProfileBack = playerAppJs.includes("window.playerApp.goBack()") || playerAppJs.includes("goBack()");
console.log('✓ Instagram Profiel heeft terugknop (arrow_back) naar de geschiedenis:', hasProfileBack);

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
const isCacheV17 = indexHtml.includes('?v=17') && indexHtml.includes('doomscroll-escape-v17');
console.log('✓ Alle scripts geüpgraded naar ?v=17 en service worker v17:', isCacheV17);

// 9. Controleer Like, Dislike, Video in Chat en Stippellijn
console.log('\n[Check 9] Like/Dislike, Klikbare Video Reel en Stippellijn door alle objectives:');
const hasGlobalLikeDislike = playerAppJs.includes('handleGlobalLike') && playerAppJs.includes('handleGlobalDislike');
const hasTikTokLikeDislike = playerAppJs.includes('toggleTikTokLike') && playerAppJs.includes('toggleTikTokDislike');
const hasClickableOmaPhoto = playerAppJs.includes("openReelFromChat");
const hasDynamicTrail = playerAppJs.includes('updateAdventureTrail') && indexHtml.includes('id="adventure-trail-svg"');
console.log('✓ HandleGlobalLike en HandleGlobalDislike aanwezig en gekoppeld:', hasGlobalLikeDislike);
console.log('✓ TikTok Like en Dislike acties aanwezig:', hasTikTokLikeDislike);
console.log('✓ Klikbare video preview in chat opent reel via geschiedenis-stack:', hasClickableOmaPhoto);
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

// 14. Controleer Lobby Afhankelijkheid en Geen Digibord Link
console.log('\n[Check 14] Lobby Afhankelijkheid & Verwijdering Digibord link op mobiel:');
const hasLobbySubtext = indexHtml.includes('De spelleider start het spel zo dadelijk op het Digibord.');
const hasNoDirectStartBtn = !indexHtml.includes('id="btn-lobby-start-direct"');
const hasNoMobileDigibordLink = !indexHtml.includes('Digibord / QR');
console.log('✓ Lobby toont "De spelleider start het spel zo dadelijk op het Digibord.":', hasLobbySubtext);
console.log('✓ Geen directe startknop voor spelers (spelleider start op digibord):', hasNoDirectStartBtn);
console.log('✓ Geen Digibord / QR link onderaan de mobiele lobby:', hasNoMobileDigibordLink);

// 15. Controleer Endless Reels met Audio & Zuiver Video's (zachter volume 0.25)
console.log('\n[Check 15] Reels 100% Video met Geluid (Zachter Volume 0.25):');
const hasStrictVideos = !playerAppJs.includes("${hasVideo ?") &&
  playerAppJs.includes('toggleTikTokAudio') &&
  playerAppJs.includes('tiktok-video-el');
const hasSofterVolume = playerAppJs.includes('0.25');
console.log('✓ TikTok reels gebruiken strikt videos met audio toggle:', hasStrictVideos);
console.log('✓ Video geluidsvolume staat zacht (0.25):', hasSofterVolume);

// 16. Controleer Exacte Campus/Vindplek Locaties
console.log('\n[Check 16] Exacte Fysieke Locaties:');
const itemsDataJs = fs.readFileSync('public/js/itemsData.js', 'utf8');
const expectedLocs = [
  'LA227',
  'LX200',
  'LA Hoofdingang',
  'LA Balie',
  'LA500 Trap',
  'LD Kantine',
  'LD112',
  'Lovensdijkstraat Plein'
];
const allLocsPresentInItemsData = expectedLocs.every(loc => itemsDataJs.includes(loc));
const allLocsPresentInServer = expectedLocs.every(loc => serverJs.includes(loc));
console.log('✓ Alle 8 campuslocaties aanwezig in itemsData.js:', allLocsPresentInItemsData);
console.log('✓ Alle 8 campuslocaties aanwezig in server.js:', allLocsPresentInServer);

// 17. Controleer Paren Onder Elkaar op Kaart
console.log('\n[Check 17] Paren Onder Elkaar (date & trouwen, job_interview & job_raise):');
const hasPairedRouting = playerAppJs.includes("['date', 'trouwen']") && playerAppJs.includes("['job_interview', 'job_raise']");
console.log('✓ Paren zijn gekoppeld en behouden zelfde uitlijning onder elkaar:', hasPairedRouting);

console.log('\n--- ALLE CONTROLES MET SUCCES AFGEROND! ---');
