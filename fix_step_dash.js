const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Remove the hardcoded "— " prefix from step render since steps already contain it
html = html.replace(
  /\`<div class=\\"cl-step\\">— \${s}<\/div>\`/g,
  '`<div class="cl-step">${s.replace(/^[—–-]+\\s*/,"")}</div>`'
);

// Also fix the line-through bottom line — remove bottom border if any
html = html.replace(
  `.cl-step{font-size:13px;color:var(--text);opacity:0.75;padding:3px 0;line-height:1.6;}`,
  `.cl-step{font-size:13px;color:var(--text);opacity:0.75;padding:2px 0;line-height:1.55;border:none;}`
);

if(!html.includes('replace(/^[')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
