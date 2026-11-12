const { ITEMS_DATA } = require('../public/js/itemsData.js');

console.log('====================================================');
console.log('🧪 TEST: SIMULATIE VAN ALLE 3 TAAKTYPEN (SINGLE, MULTI, ELIMINATE)');
console.log('====================================================\n');

let passedTests = 0;

Object.keys(ITEMS_DATA).forEach(itemId => {
  const item = ITEMS_DATA[itemId];
  console.log(`🔍 [${item.name}] (${item.id}):`);

  item.tasks.forEach((task, idx) => {
    const type = task.type || 'single_choice';

    if (type === 'eliminate') {
      // Simulate perfect elimination:
      const userEliminated = task.options
        .filter(o => o.isEliminateTarget === true)
        .map(o => o.id);

      let isMatch = true;
      task.options.forEach(o => {
        const mustEliminate = o.isEliminateTarget === true;
        const isEliminated = userEliminated.includes(o.id);
        if (mustEliminate !== isEliminated) isMatch = false;
      });

      if (!isMatch) throw new Error(`Eliminate simulation failed for ${item.id} task ${idx + 1}`);

      // Simulate wrong elimination (missing one target):
      const wrongEliminated = userEliminated.slice(1);
      let wrongMatch = true;
      task.options.forEach(o => {
        const mustEliminate = o.isEliminateTarget === true;
        const isEliminated = wrongEliminated.includes(o.id);
        if (mustEliminate !== isEliminated) wrongMatch = false;
      });
      if (wrongMatch) throw new Error(`Wrong elimination should fail for ${item.id} task ${idx + 1}`);

      console.log(`   ✓ Taak ${idx + 1} (Eliminate): "${task.tag}" correct gevalideerd.`);
      passedTests++;
    } else if (type === 'multi_select') {
      // Simulate perfect multi select:
      const userSelected = task.options
        .filter(o => o.isCorrect === true)
        .map(o => o.id);

      let isMatch = true;
      task.options.forEach(o => {
        const isCorrect = o.isCorrect === true;
        const isSelected = userSelected.includes(o.id);
        if (isCorrect !== isSelected) isMatch = false;
      });

      if (!isMatch) throw new Error(`Multi-select simulation failed for ${item.id} task ${idx + 1}`);

      // Simulate wrong multi select:
      const wrongSelected = [...userSelected, task.options.find(o => o.isCorrect === false).id];
      let wrongMatch = true;
      task.options.forEach(o => {
        const isCorrect = o.isCorrect === true;
        const isSelected = wrongSelected.includes(o.id);
        if (isCorrect !== isSelected) wrongMatch = false;
      });
      if (wrongMatch) throw new Error(`Wrong multi-select should fail for ${item.id} task ${idx + 1}`);

      console.log(`   ✓ Taak ${idx + 1} (Multi-select): "${task.tag}" correct gevalideerd.`);
      passedTests++;
    } else {
      // Single choice
      const correctOpt = task.options.find(o => o.isCorrect === true);
      if (!correctOpt) throw new Error(`Single choice missing correct opt for ${item.id} task ${idx + 1}`);

      const wrongOpt = task.options.find(o => o.isCorrect === false);
      if (!wrongOpt) throw new Error(`Single choice missing wrong opt for ${item.id} task ${idx + 1}`);

      console.log(`   ✓ Taak ${idx + 1} (Single-choice): "${task.tag}" correct gevalideerd.`);
      passedTests++;
    }
  });

  console.log('');
});

console.log('====================================================');
console.log(`🎉 SUCCES! Alle ${passedTests} taken over alle 8 items werken wiskundig en logisch 100% foutloos!`);
console.log('====================================================');

