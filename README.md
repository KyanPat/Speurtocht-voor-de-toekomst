# Doomscroll Escape - Speurtocht voor de Toekomst

Een real-time locatiegebaseerde multiplayer hybride web-app prototype (PWA) voor 3-6 spelers, ontworpen tegen schermverslaving en doomscrollen. Volledig in het Nederlands en gebouwd op basis van de ontwerpen uit `stitch_doomscroll_escape_game.zip`.

---

## 🚀 Snelle Start

### 1. Installeren en Starten
```bash
# Afhankelijkheden installeren
npm install

# Server starten op poort 3000
npm start
```

### 2. Openen in de Browser
- 📱 **Speler Scherm (Mobiel / PWA):** [http://localhost:3000/](http://localhost:3000/)
- 🖥️ **Digibord Scherm (Desktop / Klaslokaal):** [http://localhost:3000/digibord](http://localhost:3000/digibord)

---

## 🎮 Spelverloop & Functionaliteiten

1. **Digibord & Lobby (Desktop):**
   - Centraal dashboard voor het klaslokaal (beamer/smartboard).
   - Toont verbonden leerlingen met live ping en avatars.
   - Grote knop **"START SPEURTOCHT (15 MIN)"** en een knop om direct **3 test-leerlingen toe te voegen**.
   - Tijdens het spel: een gigantische 15:00 countdown klok, status van limited items, live activiteiten feed en real-time klassement.

2. **Speelveld Kaart (`speelveld_vereenvoudigd` - Mobiel):**
   - Authentiek perkament- en topografisch thema met kronkelend gestikt pad.
   - 7 interactieve Polaroid kaarten met schaduw- en rotatie-effecten.
   - Real-time synchronisatie: als iemand anders een limited item claimt, wordt dit item direct doorgestreept met een badge `OP = OP • [Naam]` en klinkt een geluidssignaal.

3. **Item Detail Pop-up & Fysieke Code (`item_detail_pop_up_simpel`):**
   - Toont locatie en vereist de 4-cijferige fysieke code.
   - Bevat de grote knop *"Doe taak voor item"* en de misleidende kleine knop *"Kijk video voor een hint"*.

4. **Vragen & Opdrachten (`vraag_*`):**
   - **4222: Autosleutels (1 pt)** -> Verkeersbord vraag (Stopbord).
   - **1412: Huissleutels (1 pt)** -> Voorzieningen taak (bewaar alleen Dak, Water, Elektriciteit, Slaapplek; klik Bioscoopkamer en Zwembad weg).
   - **3221: Diploma (1 pt)** -> Fotovraag Collegezaal (Paard).
   - **2143: Ticket voor droomreis (1 pt)** -> Topografie vraag (Eiffeltoren staat in Frankrijk).
   - **4343: Job Interview (2 pt, Limited)** -> Sollicitatievraag (Leergierig & teamplayer).
   - **1243: Job Raise (2 pt, Limited)** -> Ontgrendelt exact 1 minuut na het Job Interview. Dilemma salarisverhoging.
   - **3442: Date (2 pt, Limited)** -> Cadeaukeuze voor de eerste date (Mooie bos bloemen).

5. **Straftijd & Zelfbeheersing Beloning (`pop_up_cooldown_simpel`):**
   - Fout antwoord = 45 seconden cooldown op dat item.
   - **Zelfbeheersing beloning:** Sluit de speler de popup zonder op video te klikken (of via *"Niet scrollen"*), dan wordt direct **15 seconden afgetrokken** van de straftijd!

6. **Doomscroll Valstrik (`videospeler_doomscroll_val`):**
   - Klikken op video-hints opent een fullscreen verticale swipe-feed (TikTok stijl).
   - Meerdere video's met likes, comments, shares, draaiende vinyl plaat en **bronvermelding/credits knop**.
   - **Cruciale Spelregel:** De globale 15-minuten klok tikt onverbiddelijk door, maar de 45s cooldown straftijd van de speler staat **stil**! Pas bij het klikken op *"✕ Sluiten"* hervat de cooldown.

7. **Klassikale Afleidingen (Ambient Push Notifications):**
   - Elke 30-90 seconden schuift er een realistische nep-notificatie van boven het scherm in (TikTok, Instagram, BeReal, Snapchat in het Nederlands).
   - Moet handmatig worden weggesleept of gesloten. Tikken op het bericht leidt de speler af.

---

## 🛠️ Technische Architectuur

- **Backend:** Node.js + Express
- **Real-time:** Socket.io (bidirectionele events voor lobby, timer, limited claims, cooldowns en klassement)
- **Frontend:** HTML5, CSS3 (Tailwind CSS + custom CSS), Vanilla ES6+ JavaScript
- **PWA:** `manifest.json` en `sw.js` (installeerbaar op iOS en Android)
- **Audio:** Web Audio API procedurale geluidssynthesizer (succes-chimes, fout-buzzers, notificatie-belletjes)
- **Design Baseline:** 100% trouw aan de designs en templates uit `stitch_doomscroll_escape_game.zip`.

