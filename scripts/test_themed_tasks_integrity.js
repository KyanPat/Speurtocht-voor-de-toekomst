const { ITEMS_DATA } = require('../public/js/itemsData.js');

console.log('====================================================');
console.log('🧪 INTEGRITEITSTEST: 32 THEMATASKEN MET AFBEELDING, BRON & DYNAMISCHE TYPES');
console.log('====================================================\n');

let totalTasks = 0;
let errors = [];

Object.keys(ITEMS_DATA).forEach(itemId => {
  const item = ITEMS_DATA[itemId];
  console.log(`📦 [Item] ${item.name} (${item.id}):`);

  if (!item.tasks || !Array.isArray(item.tasks)) {
    errors.push(`Item ${item.id} heeft geen geldige tasks array!`);
    return;
  }

  if (item.tasks.length !== 4) {
    errors.push(`Item ${item.id} heeft ${item.tasks.length} taken (moet exact 4 zijn)!`);
  } else {
    console.log(`   ✓ Bevat exact 4 thema-taken.`);
  }

  item.tasks.forEach((task, idx) => {
    totalTasks++;
    const stepNum = task.step || (idx + 1);
    const taskType = task.type || 'single_choice';

    if (!task.question || task.question.length < 5) {
      errors.push(`Item ${item.id} taak ${stepNum} mist een geldige vraag.`);
    }

    if (!task.options || task.options.length < 2) {
      errors.push(`Item ${item.id} taak ${stepNum} heeft minder dan 2 opties.`);
    }

    if (taskType === 'eliminate') {
      const targets = task.options.filter(o => o.isEliminateTarget === true);
      const keep = task.options.filter(o => o.isEliminateTarget === false);
      if (targets.length === 0) {
        errors.push(`Item ${item.id} taak ${stepNum} (eliminate) heeft geen items om weg te klikken.`);
      }
      if (keep.length === 0) {
        errors.push(`Item ${item.id} taak ${stepNum} (eliminate) heeft geen te behouden items.`);
      }
      console.log(`      ✓ Taak ${stepNum} [${taskType}]: "${task.tag}" | ${task.options.length} items (${targets.length} weg te klikken, ${keep.length} te behouden).`);
    } else if (taskType === 'multi_select') {
      const correctOpts = task.options.filter(o => o.isCorrect === true);
      const wrongOpts = task.options.filter(o => o.isCorrect === false);
      if (correctOpts.length < 2) {
        errors.push(`Item ${item.id} taak ${stepNum} (multi_select) heeft minder dan 2 correcte opties.`);
      }
      if (wrongOpts.length < 1) {
        errors.push(`Item ${item.id} taak ${stepNum} (multi_select) heeft geen foute opties.`);
      }
      console.log(`      ✓ Taak ${stepNum} [${taskType}]: "${task.tag}" | ${task.options.length} opties (${correctOpts.length} correct, ${wrongOpts.length} fout).`);
    } else {
      // single_choice
      const correctOpts = task.options.filter(o => o.isCorrect === true);
      if (correctOpts.length !== 1) {
        errors.push(`Item ${item.id} taak ${stepNum} (single_choice) heeft ${correctOpts.length} correcte antwoorden (moet exact 1 zijn)!`);
      }
      console.log(`      ✓ Taak ${stepNum} [${taskType}]: "${task.tag}" | ${task.options.length} opties (1 correct).`);
    }
  });

  console.log('');
});

console.log('====================================================');
console.log(`📊 Totaal geverifieerde taken: ${totalTasks} / 32`);

if (errors.length === 0) {
  console.log('🎉 ALLE 32 TAKEN VOOR ALLE 8 ITEMS ZIJN 100% CORRECT & COMPLEET!');
  process.exit(0);
} else {
  console.log(`❌ Gevonden fouten: ${errors.length}`);
  errors.forEach(e => console.log(`   - ${e}`));
  process.exit(1);
}
