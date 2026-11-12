const fs = require('fs');
const path = require('path');

const playerAppPath = path.join(__dirname, '..', 'public', 'js', 'playerApp.js');
let content = fs.readFileSync(playerAppPath, 'utf8');

const startMarker = `  // ==========================================
  // 4 TAKEN OM EEN ITEM TE BEHALEN / CLAIMEN`;

const endMarker = `  function renderQuestionModal(item) {
    openItemTaskConfirmationModal(item);
  }`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

const replacement = `  // ==========================================
  // 8 THEMA-TAKEN OM EEN ITEM TE BEHALEN / CLAIMEN
  // (OF: Korte video om te skippen -> Doomscroll feed!)
  // ==========================================

  // STAP 1: CONFIRMATIE- & KEUZESCHERM VOOR DE 8 THEMA-TAKEN
  function openItemTaskConfirmationModal(item) {
    if (!item) item = ITEMS_DATA[state.activeItemId];
    if (!item) return;

    state.activeItemId = item.id;
    state.activeModal = 'ITEM_TASK_CONFIRM';

    if (!state.itemTaskSequence || state.itemTaskSequence.itemId !== item.id) {
      state.itemTaskSequence = null;
    }

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl">verified</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">Code Goedgekeurd</span>
          <h3 class="font-display text-xl font-black text-stone-900 mt-1">\${item.name}</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Code klopt! Om dit item definitief te claimen en je punt te verdienen, moet je <b>8 uitdagende thema-taken</b> voltooien.
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <!-- KEUZE 1: 8 TAKEN VOOR ITEM -->
          <button type="button" id="btn-start-item-tasks" class="w-full p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-emerald-200 group-hover:scale-110 transition">task_alt</span>
              <div>
                <div class="text-sm font-black">Doe 8 Taken voor \${item.name}</div>
                <div class="text-[11px] text-emerald-100 font-normal">Voltooi alle 8 diepgaande thema-situaties achter elkaar om je punt te claimen.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-emerald-200 text-lg">chevron_right</span>
          </button>

          <!-- KEUZE 2: SKIP MET KORTE VIDEO (GEEN VALSTRIK TEKST!) -->
          <button type="button" id="btn-skip-item-tasks-video" class="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold shadow-sm active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-amber-600 group-hover:scale-110 transition">play_circle</span>
              <div>
                <div class="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <span>Korte video kijken om te skippen</span>
                  <span class="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Snel</span>
                </div>
                <div class="text-[11px] text-amber-800 font-normal">Geen zin in taken? Sla over met een korte video.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-amber-600 text-lg">arrow_forward</span>
          </button>

          <button type="button" onclick="window.playerApp.openItemDetailModal(ITEMS_DATA['\${item.id}'])" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1 mt-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar item</span>
          </button>
        </div>
      </div>
    \`;

    document.getElementById('btn-start-item-tasks').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      startItemTaskSequence(item);
    });

    document.getElementById('btn-skip-item-tasks-video').addEventListener('click', () => {
      skipItemTasksWithVideo(item);
    });

    openModal();
  }

  function skipItemTasksWithVideo(item) {
    if (window.sounds) window.sounds.playError();
    state.itemTaskSequence = null;
    state.previousModalState = {
      type: 'ITEM_DETAIL',
      itemId: item.id
    };
    closeModal();
    showToast('⚠️ Video feed geopend! (Geen item behaald - tijd tikt door!)', 'warning');
    openAppFeed('TikTok', item.id);
  }

  function startItemTaskSequence(item) {
    state.itemTaskSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 8
    };
    renderCurrentItemTaskStep(item);
  }

  function renderCurrentItemTaskStep(item) {
    if (!state.itemTaskSequence) {
      startItemTaskSequence(item);
      return;
    }

    state.activeModal = 'ITEM_TASK';
    const currentStep = state.itemTaskSequence.currentStep;
    const totalSteps = state.itemTaskSequence.totalSteps || 8;

    const fullItem = ITEMS_DATA[item.id] || item;
    const taskList = (fullItem && fullItem.tasks) || [];
    const currentTask = taskList[currentStep - 1] || {
      tag: fullItem.tag || 'Thema Taak',
      scenario: fullItem.question || 'Lees de situatie nauwkeurig door:',
      question: fullItem.question,
      options: fullItem.options || []
    };

    let selectedOptionCorrect = null;

    // Header HTML met voortgang (1 t/m 8 bolletjes)
    const progressDotsHtml = [1, 2, 3, 4, 5, 6, 7, 8].map(s => \`
      <div class="w-2.5 h-2.5 rounded-full transition-all \${
        s < currentStep
          ? 'bg-emerald-600'
          : (s === currentStep ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-125' : 'bg-stone-300')
      }"></div>
    \`).join('');

    // Shuffled opties met A, B, C, D badges
    const letters = ['A', 'B', 'C', 'D'];
    const shuffledOptions = [...(currentTask.options || [])]
      .sort(() => Math.random() - 0.5)
      .map((opt, idx) => ({
        ...opt,
        letter: letters[idx] || String.fromCharCode(65 + idx)
      }));

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto">
        
        <!-- Header met stap & 8 voortgangsbollen -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
              \${currentStep}
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-900 block leading-tight">Taak \${currentStep} van \${totalSteps}</span>
              <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">\${currentTask.tag || fullItem.name}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            \${progressDotsHtml}
          </div>
        </div>

        <!-- Optionele afbeelding of sign SVG -->
        \${currentTask.signSvg ? \`<div class="flex justify-center p-2 bg-stone-50 rounded-2xl border border-stone-200">\${currentTask.signSvg}</div>\` : ''}
        \${currentTask.imageUrl ? \`
          <div class="w-full h-32 rounded-2xl overflow-hidden relative shadow-sm border border-stone-200">
            <img src="\${currentTask.imageUrl}" alt="Vraag afbeelding" class="w-full h-full object-cover">
          </div>
        \` : ''}

        <!-- Situatieschets -->
        \${currentTask.scenario ? \`
          <div class="w-full bg-stone-50 rounded-2xl p-3.5 border border-stone-200/90 text-left space-y-1 shadow-inner">
            <div class="flex items-center gap-1.5 text-[10px] font-black uppercase text-stone-500 tracking-wider">
              <span class="material-symbols-outlined text-xs text-primary">info</span>
              <span>Situatieschets</span>
            </div>
            <p class="text-xs text-stone-800 leading-relaxed font-medium">\${currentTask.scenario}</p>
          </div>
        \` : ''}

        <!-- Vraagstelling -->
        <div class="text-left pt-0.5">
          <h4 class="text-xs font-extrabold text-stone-900 leading-snug">\${currentTask.question}</h4>
        </div>

        <!-- Keuzelijst met A-D opties (Zonder weggeef-antwoorden!) -->
        <div class="flex flex-col gap-2 text-left" id="quiz-options-group">
          \${shuffledOptions.map(opt => \`
            <button type="button" class="task-quiz-btn w-full p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] transition flex items-center justify-between text-left cursor-pointer group" data-correct="\${opt.isCorrect}">
              <div class="flex items-start gap-2.5 min-w-0 pr-2">
                <span class="w-6 h-6 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 group-hover:bg-primary/20 transition">\${opt.letter}</span>
                <span class="text-xs font-medium text-stone-900 leading-snug">\${opt.text}</span>
              </div>
              <span class="material-symbols-outlined text-[18px] text-stone-300 status-icon shrink-0">radio_button_unchecked</span>
            </button>
          \`).join('')}
        </div>

        <!-- Actieknoppen & Verleiding (ZONDER valstrik!) -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-submit-task-step" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">\${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>\${currentStep === totalSteps ? 'Antwoord Bevestigen & Claim Item' : \`Volgende Taak (\${currentStep + 1}/\${totalSteps})\`}</span>
          </button>
          <button type="button" id="btn-step-skip-video" class="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
            <span class="material-symbols-outlined text-base text-amber-700">play_circle</span>
            <span>Te saai? Kijk video om te skippen</span>
          </button>
          <button type="button" id="btn-step-cancel" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Annuleren en terug naar item</span>
          </button>
        </div>

      </div>
    \`;

    // Event handlers voor keuze-opties
    const optionBtns = modalContent.querySelectorAll('.task-quiz-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        optionBtns.forEach(b => {
          b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
          const icon = b.querySelector('.status-icon');
          if (icon) {
            icon.textContent = 'radio_button_unchecked';
            icon.classList.remove('text-emerald-700');
            icon.classList.add('text-stone-300');
          }
        });

        btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
        const activeIcon = btn.querySelector('.status-icon');
        if (activeIcon) {
          activeIcon.textContent = 'check_circle';
          activeIcon.classList.remove('text-stone-300');
          activeIcon.classList.add('text-emerald-700');
        }

        selectedOptionCorrect = btn.getAttribute('data-correct') === 'true';
      });
    });

    // Bevestig knop
    document.getElementById('btn-submit-task-step').addEventListener('click', () => {
      if (selectedOptionCorrect === null) {
        showToast('Kies eerst een antwoord!');
        return;
      }

      if (selectedOptionCorrect === true) {
        if (currentStep < totalSteps) {
          if (window.sounds) window.sounds.playSuccess();
          showToast(\`Taak \${currentStep} goed! Nog \${totalSteps - currentStep} te gaan.\`, 'success');
          state.itemTaskSequence.currentStep++;
          renderCurrentItemTaskStep(item);
        } else {
          // Alle 8 taken succesvol afgerond!
          state.itemTaskSequence = null;
          submitTaskAnswer(item, true);
        }
      } else {
        // FOUT ANTWOORD -> Cooldown straftijd!
        if (window.sounds) window.sounds.playError();
        showToast('Helaas, fout antwoord! Je krijgt 45s straftijd.', 'error');
        state.itemTaskSequence = null;
        submitTaskAnswer(item, false);
      }
    });

    document.getElementById('btn-step-skip-video').onclick = () => skipItemTasksWithVideo(item);
    document.getElementById('btn-step-cancel').onclick = () => {
      state.itemTaskSequence = null;
      openItemDetailModal(fullItem);
    };
  }

  function renderQuestionModal(item) {
    openItemTaskConfirmationModal(item);
  }`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex + endMarker.length);
fs.writeFileSync(playerAppPath, content, 'utf8');
console.log('playerApp.js updated successfully!');

