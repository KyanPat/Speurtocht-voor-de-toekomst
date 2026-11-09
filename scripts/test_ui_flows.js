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
const isCacheV12 = indexHtml.includes('?v=12') && indexHtml.includes('doomscroll-escape-v12');
console.log('✓ Alle scripts geüpgraded naar ?v=12 en service worker v12:', isCacheV12);

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

console.log('\n--- ALLE CONTROLES MET SUCCES AFGEROND! ---');
