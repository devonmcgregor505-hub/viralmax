const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `.check-name{font-size:14px;font-weight:700;color:#f4f4ff;margin-bottom:1px;transition:all .18s;}`,
  `.check-name{font-size:14px;font-weight:700;color:#f4f4ff;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);transition:all .18s;}`
);

if(!html.includes('padding-bottom:8px;border-bottom')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
