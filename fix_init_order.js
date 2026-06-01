const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Move checklist load to BEFORE renderChecklist in initApp
html = html.replace(
  `function initApp(){
  // Load today's checklist from Supabase
  loadChecklistFromServer().then(function(loaded){
    if(loaded) renderChecklist();
  });`,
  `function initApp(){`
);

// Instead, make renderChecklist wait for server load on first call
html = html.replace(
  `  renderChecklist(); // must come after _routineData is set`,
  `  // Load checklist from server then render
  loadChecklistFromServer().then(function(){
    renderChecklist();
  });`
);

if(!html.includes('loadChecklistFromServer().then')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
