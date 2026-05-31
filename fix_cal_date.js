const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix today's date using local time not UTC
html = html.replace(
  `  const today = new Date().toISOString().split('T')[0];`,
  `  const _now = new Date(); const today = _now.getFullYear()+'-'+String(_now.getMonth()+1).padStart(2,'0')+'-'+String(_now.getDate()).padStart(2,'0');`
);

// Also fix renderCalendar today highlight if it uses toISOString
html = html.replace(
  /const todayStr = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g,
  `const _td=new Date(); const todayStr=_td.getFullYear()+'-'+String(_td.getMonth()+1).padStart(2,'0')+'-'+String(_td.getDate()).padStart(2,'0')`
);

if(!html.includes('padStart(2,')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
