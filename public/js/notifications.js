// Ambient Push Notification Distraction System voor Doomscroll Escape
class NotificationManager {
  constructor() {
    this.container = null;
    this.timer = null;
    this.isActive = false;
    this.onTemptationClick = null;
  }

  init(onTemptationClick) {
    this.onTemptationClick = onTemptationClick;
    this.createContainer();
  }

  createContainer() {
    if (document.getElementById('fake-notification-container')) {
      this.container = document.getElementById('fake-notification-container');
      return;
    }

    const div = document.createElement('div');
    div.id = 'fake-notification-container';
    div.className = 'fixed top-3 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-3 safe-top';
    document.body.appendChild(div);
    this.container = div;
  }

  startAmbientDistractions() {
    if (this.isActive) return;
    this.isActive = true;
    this.scheduleNext();
  }

  stopAmbientDistractions() {
    this.isActive = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  scheduleNext() {
    if (!this.isActive) return;
    // Willekeurig tussen 30 en 90 seconden
    const delay = (30 + Math.random() * 60) * 1000;
    this.timer = setTimeout(() => {
      if (this.isActive) {
        this.triggerRandomDistraction();
        this.scheduleNext();
      }
    }, delay);
  }

  triggerRandomDistraction(customData = null) {
    const data = customData || PUSH_NOTIFICATIONS[Math.floor(Math.random() * PUSH_NOTIFICATIONS.length)];
    this.show(data);
  }

  show(notif) {
    this.createContainer();
    if (window.sounds) window.sounds.playNotification();

    const banner = document.createElement('div');
    banner.className = 'pointer-events-auto w-full max-w-[390px] mb-2 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-stone-700/60 transform -translate-y-full opacity-0 transition-all duration-300 select-none cursor-pointer';

    const platformColor = notif.color || '#E1306C';
    const textColor = notif.textColor || '#FFFFFF';

    banner.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md font-bold text-lg" style="background-color: ${platformColor}; color: ${textColor};">
          <span class="material-symbols-outlined text-[22px]">${notif.icon || 'notifications'}</span>
        </div>
        <div class="flex-1 min-w-0 notif-body">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-stone-200">${notif.title}</span>
            <span class="text-[10px] text-stone-400 font-medium">${notif.time || 'Nu'}</span>
          </div>
          <p class="text-xs text-stone-100 font-medium mt-0.5 leading-snug line-clamp-2">${notif.message}</p>
          <span class="text-[10px] text-primary block mt-1 font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">touch_app</span> Tik om te bekijken...
          </span>
        </div>
        <button type="button" aria-label="Melding sluiten" class="dismiss-notif-btn p-1 -mr-1 -mt-1 text-stone-400 hover:text-white rounded-full transition active:scale-90">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    `;

    this.container.appendChild(banner);

    // Slide down animatie
    requestAnimationFrame(() => {
      banner.classList.remove('-translate-y-full', 'opacity-0');
      banner.classList.add('translate-y-0', 'opacity-100');
    });

    // Dismiss knop
    const dismissBtn = banner.querySelector('.dismiss-notif-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(banner);
      });
    }

    // Tik op HELE notificatie kaart -> Opent direct de app/het bericht
    banner.addEventListener('click', (e) => {
      if (e.target.closest('.dismiss-notif-btn')) return;
      this.dismiss(banner);
      if (this.onTemptationClick) {
        this.onTemptationClick(notif);
      }
    });

    // Auto dismiss na 14 seconden als speler niets doet
    setTimeout(() => {
      if (banner.parentElement) {
        this.dismiss(banner);
      }
    }, 14000);
  }

  dismiss(banner) {
    banner.classList.add('-translate-y-full', 'opacity-0');
    setTimeout(() => {
      if (banner.parentElement) {
        banner.parentElement.removeChild(banner);
      }
    }, 300);
  }
}

window.notifications = new NotificationManager();

