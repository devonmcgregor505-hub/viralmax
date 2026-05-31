const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `  const _settings=JSON.parse(localStorage.getItem('ascend_settings')||'{}');\n  const _middayStr=_settings.middayTime||'12:00';\n  const _middayHour=parseInt(_middayStr.split(':')[0]);\n  const hour = new Date().getHours();\n  const isMorning = hour < _middayHour;`,
  `  const _settings=JSON.parse(localStorage.getItem('ascend_settings')||'{}');\n  const _middayStr=_settings.middayTime||'12:00';\n  const _middayHour=parseInt(_middayStr.split(':')[0]);\n  const _tz=_settings.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;\n  const hour=parseInt(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hour12:false,timeZone:_tz}).format(new Date()));\n  const isMorning = hour < _middayHour;`
);

if(!html.includes('Intl.DateTimeFormat')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('✓ Timezone fix done');
