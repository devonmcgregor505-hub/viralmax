const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `      <span id="streakCount">0</span>&nbsp;streak`,
  `      <span id="streakCount">0</span>`
);

if(!html.includes('<span id="streakCount">')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
