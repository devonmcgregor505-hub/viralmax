const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Push to cloud after every checkbox tick
html = html.replace(
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybySaveScore();}`,
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybySaveScore();pushToCloud();}`
);

// Handle both spellings (maybySaveScore vs maybeSaveScore)
html = html.replace(
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybeSaveScore();}`,
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybeSaveScore();pushToCloud();}`
);

// 2. Pull from cloud when tab becomes visible again
html = html.replace(
  `document.addEventListener('visibilitychange', function(){\n  if(document.visibilityState === 'hidden') pushToCloud();\n});`,
  `document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'hidden'){
    pushToCloud();
  } else {
    // Pull latest when tab becomes visible
    pullFromCloud().then(function(ok){
      if(ok){ renderChecklist(); renderMacros(); renderMealsSection(); renderTrainingSection(); renderProgressPhotos(); }
    });
  }
});`
);

if(!html.includes('pushToCloud();')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
