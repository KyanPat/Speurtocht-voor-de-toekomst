const fs = require('fs');
const path = require('path');

const itemsDataPath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');
let content = fs.readFileSync(itemsDataPath, 'utf8');

// Load ITEMS_DATA to get current tasks
const { ITEMS_DATA } = require(itemsDataPath);

// Pick top 4 tasks for each item and renumber step 1..4
const UPDATED_4_TASKS = {};

for (const [itemId, item] of Object.entries(ITEMS_DATA)) {
  if (!item.tasks || item.tasks.length === 0) continue;
  // Select 4 best tasks:
  let selected = item.tasks.slice(0, 4);
  // Renumber step 1..4
  selected = selected.map((t, idx) => ({
    ...t,
    step: idx + 1
  }));
  UPDATED_4_TASKS[itemId] = selected;
}

// Re-inject tasks into itemsData.js
Object.keys(UPDATED_4_TASKS).forEach(itemId => {
  const tasksJson = JSON.stringify(UPDATED_4_TASKS[itemId], null, 4);
  const indentedTasks = tasksJson.split('\n').map((line, idx) => idx === 0 ? line : '    ' + line).join('\n');

  // Replace existing tasks array for itemId
  // Search for `tasks: [\s\S]*?\],` inside item block
  const itemRegex = new RegExp(`(${itemId}:\\s*\\{[\\s\\S]*?tasks:\\s*\\[)[\\s\\S]*?(\\]\\s*,)`, 'm');
  if (itemRegex.test(content)) {
    content = content.replace(itemRegex, `$1\n${indentedTasks.substring(indentedTasks.indexOf('['))},`);
    console.log(`Updated ${itemId} with 4 tasks!`);
  } else {
    console.log(`Could not find tasks regex for ${itemId}`);
  }
});

fs.writeFileSync(itemsDataPath, content, 'utf8');
console.log('itemsData.js updated to 4 tasks successfully!');

