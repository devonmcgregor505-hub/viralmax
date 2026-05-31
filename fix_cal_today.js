const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix line 1664 - calendar todayStr using UTC
html = html.replace(
  `  const todayStr = today.toISOString().split('T')[0];`,
  `  const _t=new Date(); const todayStr=_t.getFullYear()+'-'+String(_t.getMonth()+1).padStart(2,'0')+'-'+String(_t.getDate()).padStart(2,'0');`
);

// Fix score history key lines 1877 and 1897
html = html.replace(
  /const key = d\.toISOString\(\)\.split\('T'\)\[0\]/g,
  `const _dd=new Date(d); const key=_dd.getFullYear()+'-'+String(_dd.getMonth()+1).padStart(2,'0')+'-'+String(_dd.getDate()).padStart(2,'0')`
);

if(!html.includes('todayStr=_t.getFullYear')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
