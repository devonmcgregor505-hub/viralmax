const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix duplicate sn, sb, days2, db declarations in new rendering block
h = h.replace(
  `  const sb=document.getElementById('scoreBadge'); if(sb)sb.textContent=score2+'%';
  const sn=document.getElementById('scoreNum'); if(sn)sn.textContent=score2;
  const days2=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const db=document.getElementById('dayBadge'); if(db)db.textContent=days2[new Date().getDay()];
  if(!window._dayTimer) window._dayTimer=setInterval(()=>{const d=document.getElementById('dayBadge');if(d)d.textContent=days2[new Date().getDay()];},60000);`,
  `  const _sb=document.getElementById('scoreBadge'); if(_sb)_sb.textContent=score2+'%';
  const _sn=document.getElementById('scoreNum'); if(_sn)_sn.textContent=score2;
  const _days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const _db=document.getElementById('dayBadge'); if(_db)_db.textContent=_days[new Date().getDay()];
  if(!window._dayTimer) window._dayTimer=setInterval(()=>{const _d=document.getElementById('dayBadge');if(_d)_d.textContent=_days[new Date().getDay()];},60000);`
);

fs.writeFileSync('app.html', h);

const script = h.match(/<script>([\s\S]*?)<\/script>/g);
const s = script[script.length-1].replace(/<\/?script>/g,'');
try{ new Function(s); console.log('JS OK'); }
catch(e){ console.log('JS ERROR:', e.message); }
