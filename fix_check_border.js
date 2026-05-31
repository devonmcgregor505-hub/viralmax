const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `.check-item{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);cursor:pointer;transition:all .18s ease;position:relative;overflow:hidden;}`,
  `.check-item{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.045);border:none;outline:1px solid rgba(255,255,255,0.09);cursor:pointer;transition:all .18s ease;position:relative;overflow:hidden;}`
);

html = html.replace(
  `.check-item:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14);transform:translateX(2px);}`,
  `.check-item:hover{background:rgba(255,255,255,0.07);outline-color:rgba(255,255,255,0.14);transform:translateX(2px);}`
);

if(!html.includes('outline:1px solid')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
