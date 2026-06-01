const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Replace toggleCheck and checked init
html = html.replace(
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybeSaveScore();pushToCloud();}`,
  `function toggleCheck(i){
  checked.has(i)?checked.delete(i):checked.add(i);
  var _n=new Date(),_dk=_n.getFullYear()+'-'+String(_n.getMonth()+1).padStart(2,'0')+'-'+String(_n.getDate()).padStart(2,'0');
  localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
  localStorage.setItem('ascend_checked_date',_dk);
  renderChecklist();maybeSaveScore();pushToCloud();
}`
);

// Replace checked init to restore from localStorage
html = html.replace(
  `let checked = new Set();`,
  `let checked=(function(){try{var s=localStorage.getItem('ascend_checked_today'),d=localStorage.getItem('ascend_checked_date'),n=new Date(),k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');if(s&&d===k)return new Set(JSON.parse(s));}catch(e){}return new Set();})();`
);

// Add to sync keys
html = html.replace(
  `'ascend_score_history','ascend_settings','ascend_notifications',`,
  `'ascend_score_history','ascend_settings','ascend_notifications','ascend_checked_today','ascend_checked_date',`
);

// Restore checked after cloud pull
html = html.replace(
  `renderChecklist(); renderMacros(); renderMealsSection(); renderTrainingSection(); renderProgressPhotos();`,
  `try{var _sc=localStorage.getItem('ascend_checked_today'),_sd=localStorage.getItem('ascend_checked_date'),_n2=new Date(),_k2=_n2.getFullYear()+'-'+String(_n2.getMonth()+1).padStart(2,'0')+'-'+String(_n2.getDate()).padStart(2,'0');if(_sc&&_sd===_k2)checked=new Set(JSON.parse(_sc));}catch(e){}
  renderChecklist(); renderMacros(); renderMealsSection(); renderTrainingSection(); renderProgressPhotos();`
);

var c=(html.match(/ascend_checked_today/g)||[]).length;
console.log('ascend_checked_today occurrences:', c);
if(c<2){console.error('FAIL');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
