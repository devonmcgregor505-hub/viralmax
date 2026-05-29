const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Force init _routineData in initApp before rendering
h = h.replace(
  `function initApp(){
  // Always pull from saved profile, fall back to hardcoded defaults
  const saved = JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const morning  = saved.morning  || MORNING;
  const night    = saved.night    || NIGHT;
  const nutrition= saved.nutrition|| NUTRITION_BLOCKS;
  const training = saved.training || TRAINING_DAYS;
  const habits   = saved.habits   || HABITS;
  window._customHabits = habits;
  window._customTraining = training;
  renderChecklist();
  renderRoutine('morningBlocks', morning);
  renderRoutine('nightBlocks', night);
  renderRoutine('nutritionBlocks', nutrition);
  renderTrainingFromData(training);
  updateGreeting();
  loadStreak();
  renderProgressPhotos();
}`,
  `function initApp(){
  const saved = JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const morning   = saved.morning   || MORNING;
  const night     = saved.night     || NIGHT;
  const nutrition = saved.nutrition || NUTRITION_BLOCKS;
  const training  = saved.training  || TRAINING_DAYS;
  const habits    = saved.habits    || HABITS;
  // Init _routineData globally so edit functions can always access it
  window._routineData = {
    morningBlocks:   JSON.parse(JSON.stringify(morning)),
    nightBlocks:     JSON.parse(JSON.stringify(night)),
    nutritionBlocks: JSON.parse(JSON.stringify(nutrition)),
  };
  window._customHabits   = habits;
  window._customTraining = training;
  renderChecklist();
  renderRoutine('morningBlocks',   morning);
  renderRoutine('nightBlocks',     night);
  renderRoutine('nutritionBlocks', nutrition);
  renderTrainingFromData(training);
  updateGreeting();
  loadStreak();
  renderProgressPhotos();
}`
);

// Also strip the _routineData init lines from inside renderRoutine to avoid overwriting
h = h.replace(
  `  if(!window._routineData) window._routineData={};
  if(!window._routineData[containerId]) window._routineData[containerId]=JSON.parse(JSON.stringify(data));
  data=window._routineData[containerId];`,
  `  if(!window._routineData) window._routineData={};
  if(!window._routineData[containerId]) window._routineData[containerId]=JSON.parse(JSON.stringify(data));`
);

fs.writeFileSync('app.html', h);
console.log('_routineData init in initApp:', h.includes('window._routineData = {'));
