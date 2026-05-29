const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix initApp to load morning/night into _routineData even without DOM elements
h = h.replace(
  `  // morningBlocks/nightBlocks no longer in DOM — data lives in _routineData only
  renderRoutine('nutritionBlocks', nutrition);`,
  `  // Load morning/night into _routineData directly (no DOM elements needed)
  window._routineData['morningBlocks'] = JSON.parse(JSON.stringify(morning));
  window._routineData['nightBlocks']   = JSON.parse(JSON.stringify(night));
  renderRoutine('nutritionBlocks', nutrition);`
);

fs.writeFileSync('app.html', h);
console.log('Done:', h.includes(`window._routineData['morningBlocks']`));
