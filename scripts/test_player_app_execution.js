const fs = require('fs');
const path = require('path');

// Mock a browser environment
const domMock = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    notifications: {
      init: () => {},
      stopAmbientDistractions: () => {},
      startAmbientDistractions: () => {},
      clearActive: () => {}
    }
  },
  document: {
    readyState: 'complete',
    addEventListener: (ev, fn) => {},
    getElementById: (id) => {
      return {
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        style: {},
        innerHTML: '',
        value: 'Test',
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null
      };
    },
    querySelectorAll: () => [],
    createElement: () => ({
      classList: { add: () => {}, remove: () => {} },
      style: {},
      addEventListener: () => {}
    })
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};

global.window = domMock.window;
global.document = domMock.document;
global.localStorage = domMock.localStorage;
global.navigator = { serviceWorker: { register: () => Promise.resolve() } };
global.location = { origin: 'http://localhost:3000' };
global.io = () => ({
  on: () => {},
  emit: () => {},
  data: {}
});
global.ITEMS_DATA = require('../public/js/itemsData.js').ITEMS_DATA;

try {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'playerApp.js'), 'utf8');
  eval(code);
  console.log('✅ playerApp.js evaluated successfully without any runtime error!');
  console.log('window.playerApp keys:', Object.keys(global.window.playerApp));
  if (typeof global.window.playerApp.joinGame === 'function') {
    console.log('✅ window.playerApp.joinGame is a valid function!');
    // Try calling joinGame
    global.window.playerApp.joinGame();
    console.log('✅ joinGame executed successfully without throwing!');
  } else {
    console.error('❌ window.playerApp.joinGame is NOT a function!');
  }
} catch(err) {
  console.error('❌ RUNTIME ERROR IN playerApp.js:', err);
}
