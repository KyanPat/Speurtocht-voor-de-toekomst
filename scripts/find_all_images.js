const fs = require('fs');

const files = [
  'public/index.html',
  'public/digibord.html',
  'public/js/itemsData.js',
  'public/js/playerApp.js',
  'public/js/digibordApp.js',
  'public/js/notifications.js'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const urls = content.match(/https?:\/\/[^\s'"`,;)]+/g) || [];
  const uniqueUrls = [...new Set(urls)];
  console.log(`\n=== ${file} (${uniqueUrls.length} external URLs) ===`);
  uniqueUrls.forEach(u => console.log('  ', u));
});

