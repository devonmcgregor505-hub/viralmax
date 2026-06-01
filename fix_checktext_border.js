const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `<div class="check-text" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px;">`,
  `<div class="check-text">`
);

if(!html.includes('<div class="check-text">')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
