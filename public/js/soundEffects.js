// Web Audio Geluidseffecten voor Doomscroll Escape (Moderne, warme UI & Game Audio)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Zachte, haptische bubble/houten pop voor knoppen en clicks (zeer prettig en modern)
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.045);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 2. Warme, sprankelende marimba / harpakkoord voor juist antwoord (Eb major triade met glans)
  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Akkoorden: Eb5, G5, Bb5, Eb6 (warme triomf)
    const freqs = [622.25, 783.99, 932.33, 1244.50];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.065;
      const duration = 0.38;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Zachte zwellende aanzet en bel-achtige uitloop
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 3. Subtiele, gedempte dubbele bastoon voor foutief antwoord (geen harde irritante zoemer!)
  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Twee zachte lage resonantietonen
    [
      { f1: 140, f2: 85, start: 0, dur: 0.12, vol: 0.22 },
      { f1: 110, f2: 65, start: 0.11, dur: 0.15, vol: 0.20 }
    ].forEach(b => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t + b.start);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(b.f1, t + b.start);
      osc.frequency.exponentialRampToValueAtTime(b.f2, t + b.start + b.dur);

      gain.gain.setValueAtTime(b.vol, t + b.start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + b.start + b.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + b.start);
      osc.stop(t + b.start + b.dur);
    });
  }

  // Helper om een echt audiobestand af te spelen met Web Audio fallback
  playAudioFile(filename, fallbackFn) {
    if (this.muted) return;
    try {
      const audio = new Audio('/assets/sounds/' + filename);
      audio.volume = 0.5;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          if (fallbackFn) fallbackFn.call(this);
        });
      }
    } catch(e) {
      if (fallbackFn) fallbackFn.call(this);
    }
  }

  // 4a. Authentiek WhatsApp notificatiegeluid (karakteristieke twee-toon bel)
  playWhatsAppNotification() {
    this.playAudioFile('whatsapp.wav', () => {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [
        { freq: 1396.91, delay: 0, dur: 0.22, vol: 0.25 },
        { freq: 1760.00, delay: 0.07, dur: 0.35, vol: 0.3 }
      ].forEach(tone => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone.freq, t + tone.delay);
        gain.gain.setValueAtTime(0.001, t + tone.delay);
        gain.gain.linearRampToValueAtTime(tone.vol, t + tone.delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.delay + tone.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + tone.delay);
        osc.stop(t + tone.delay + tone.dur);
      });
    });
  }

  // 4b. Authentiek Snapchat notificatiegeluid (snappy omhooggaande 'bloop-pop')
  playSnapchatNotification() {
    this.playAudioFile('snapchat.wav', () => {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(1250, t + 0.08);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  // 4c. Authentiek Instagram / iOS DM geluid (zachte, heldere kristaltinteling)
  playInstagramNotification() {
    this.playAudioFile('instagram.wav', () => {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [1318.51, 1975.53].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.2 / (idx + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    });
  }

  // 4d. Authentiek BeReal notificatiegeluid (dubbele alarmerende beep)
  playBeRealNotification() {
    this.playAudioFile('bereal.wav', () => {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [
        { freq: 880, delay: 0, dur: 0.09, vol: 0.25 },
        { freq: 1174.66, delay: 0.12, dur: 0.15, vol: 0.3 }
      ].forEach(b => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(b.freq, t + b.delay);
        gain.gain.setValueAtTime(b.vol, t + b.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + b.delay + b.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + b.delay);
        osc.stop(t + b.delay + b.dur);
      });
    });
  }

  // 4e. Authentiek TikTok notificatiegeluid
  playTikTokNotification() {
    this.playAudioFile('tiktok.wav', () => {
      this.playInstagramNotification();
    });
  }

  // 4. Centrale dispatcher voor platform-specifieke notificatiegeluiden
  playNotification(platform = 'instagram') {
    if (this.muted) return;
    const p = (platform || '').toString().toLowerCase();
    if (p.includes('whatsapp') || p.includes('moeder') || p.includes('vrienden')) {
      this.playWhatsAppNotification();
    } else if (p.includes('snapchat')) {
      this.playSnapchatNotification();
    } else if (p.includes('bereal')) {
      this.playBeRealNotification();
    } else if (p.includes('tiktok')) {
      this.playTikTokNotification();
    } else {
      this.playInstagramNotification();
    }
  }

  // 5. Triumfante, sprankelende synth chime voor het behalen van een Limited Item
  playLimitedClaim() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 -> E5 -> G5 -> C6 -> E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.055;
      const duration = 0.45;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 6. Diepe, serene klankschaal / zen gong voor beloning van zelfbeheersing
  playReward() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // 432 Hz harmonische klankschaal
    [432, 864, 1296].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const duration = 0.85;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      const vol = 0.16 / (i + 1);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  // 7. Karakteristieke dubbel-pop voor social media hartje / like
  playLike() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [
      { f1: 520, f2: 820, delay: 0 },
      { f1: 820, f2: 1250, delay: 0.05 }
    ].forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + p.delay;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.f1, startTime);
      osc.frequency.exponentialRampToValueAtTime(p.f2, startTime + 0.04);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.045);
    });
  }

  // 8. Fotosluiter klik voor BeReal & Snapchat
  playCameraShutter() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.035);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }
}

window.sounds = new SoundManager();
// Activeer geluid bij eerste interactie
window.addEventListener('click', () => window.sounds.init(), { once: true });
window.addEventListener('touchstart', () => window.sounds.init(), { once: true });
