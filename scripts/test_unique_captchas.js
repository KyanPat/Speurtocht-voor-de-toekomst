const fs = require('fs');
const assert = require('assert');

const code = fs.readFileSync('public/js/playerApp.js', 'utf8');

// Extract internal functions by running a slice in a small module
const funcDefs = `
${code.substring(code.indexOf('const CAPTCHA_WORDS'), code.indexOf('function bindCaptchaWidgetEvents'))}
${code.substring(code.indexOf('function verifyActiveCaptchaChallenge'), code.indexOf('function renderCurrentLocationCaptchaStep'))}
${code.substring(code.indexOf('function createPlayer2DModelSvg'), code.indexOf('function renderMobilePodium'))}
module.exports = {
  generateUniqueCaptchaSequence,
  renderCaptchaWidgetHtml,
  verifyActiveCaptchaChallenge,
  createPlayer2DModelSvg
};
`;

fs.writeFileSync('scripts/temp_captcha_test_module.js', funcDefs, 'utf8');
const {
  generateUniqueCaptchaSequence,
  renderCaptchaWidgetHtml,
  verifyActiveCaptchaChallenge,
  createPlayer2DModelSvg
} = require('./temp_captcha_test_module.js');

console.log('Testing 8 unique captchas with 0 duplicates across 100 iterations...');

const expectedTypes = [
  'direction_match',
  'slider_puzzle',
  'dice_match',
  'shadow_match',
  'odd_one_out',
  'audio_captcha',
  'distorted_word',
  'distorted_code'
];

for (let iter = 1; iter <= 100; iter++) {
  const seq = generateUniqueCaptchaSequence(8);
  assert.strictEqual(seq.length, 8, `Sequence length must be 8 at iter ${iter}`);

  const types = seq.map(c => c.uiType);
  const uniqueTypes = new Set(types);
  assert.strictEqual(uniqueTypes.size, 8, `Sequence must have 8 unique types at iter ${iter}. Got: ${types.join(', ')}`);

  // Ensure no robot_checkbox or grid_select or maze_cheese
  assert.strictEqual(types.includes('robot_checkbox'), false, 'Must not include robot_checkbox');
  assert.strictEqual(types.includes('grid_select'), false, 'Must not include grid_select');
  assert.strictEqual(types.includes('maze_cheese'), false, 'Must not include maze_cheese');

  // Verify each expected type is present exactly once
  for (const expected of expectedTypes) {
    assert(types.includes(expected), `Missing type ${expected} in sequence at iter ${iter}`);
  }

  // Check direction_match prompt
  const dirMatch = seq.find(c => c.uiType === 'direction_match');
  assert(dirMatch.subTitle.includes('tot deze oriëntatie:'), `direction_match subtitle must say "tot deze oriëntatie:". Got: ${dirMatch.subTitle}`);
}

console.log('✅ 100 sequences generated: 100% unique, zero duplicates, exactly 8 distinct types every time!');

// Test HTML generation for all 8 types
for (const type of expectedTypes) {
  const seq = generateUniqueCaptchaSequence(8);
  const challenge = seq.find(c => c.uiType === type);
  const html = renderCaptchaWidgetHtml(challenge, 'test');
  assert(typeof html === 'string' && html.length > 50, `HTML generation failed for ${type}`);
  assert(!html.includes('https://images.unsplash.com'), `Must not contain external photos for ${type}`);
  assert(!html.includes('https://picsum.photos'), `Must not contain external photos for ${type}`);
}
console.log('✅ HTML generated successfully for all 8 captcha types without external photos!');

// Test 2D character models for places 1, 2, 3
for (const place of [1, 2, 3]) {
  const svg = createPlayer2DModelSvg(place, '🦊');
  assert(typeof svg === 'string' && svg.includes('<svg'), `2D model SVG failed for place ${place}`);
  assert(svg.includes('🦊'), `2D model must contain player avatar for place ${place}`);
  if (place === 3) {
    assert(svg.includes('mScreenBeam3'), 'Place 3 must have phone screen beam');
  } else if (place === 1) {
    assert(svg.includes('Diploma') || svg.includes('lint') || svg.includes('Baret'), 'Place 1 must have graduation cap or diploma');
  }
}
console.log('✅ 2D character models for 3rd, 2nd, and 1st place validated!');

// Cleanup temp file
fs.unlinkSync('scripts/temp_captcha_test_module.js');

console.log('🎉 ALL 100 TESTS PASSED SUCCESSFULLY!');
