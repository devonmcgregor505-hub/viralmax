const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

h = h.replace(
  `.cl-step{font-size:13px;color:var(--t2);padding:3px 0;line-height:1.6;}`,
  `.cl-step{font-size:13px;color:var(--text);opacity:0.75;padding:3px 0;line-height:1.6;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
