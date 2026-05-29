const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix loadDayPlans to always ensure correct structure
h = h.replace(
  `function loadDayPlans(){
  const saved = localStorage.getItem('ascend_day_plans');
  if(saved){
    _dayPlans = JSON.parse(saved);
    // Backfill any missing days
    for(let i=0;i<7;i++) if(!_dayPlans[i]) _dayPlans[i]=getDefaultDayPlan();
    return;
  }
  const def = getDefaultDayPlan();
  _dayPlans = Array.from({length:7},()=>JSON.parse(JSON.stringify(def)));
}`,
  `function loadDayPlans(){
  const saved = localStorage.getItem('ascend_day_plans');
  if(saved){
    _dayPlans = JSON.parse(saved);
    // Validate structure — if old format (array of {name,on}) wipe and regenerate
    const isOldFormat = Array.isArray(_dayPlans[0]);
    const hasMorning = _dayPlans[0] && _dayPlans[0].morning;
    if(isOldFormat || !hasMorning){
      localStorage.removeItem('ascend_day_plans');
      const def = getDefaultDayPlan();
      _dayPlans = Array.from({length:7},()=>JSON.parse(JSON.stringify(def)));
      return;
    }
    // Backfill any missing days
    for(let i=0;i<7;i++) if(!_dayPlans[i]) _dayPlans[i]=getDefaultDayPlan();
    return;
  }
  const def = getDefaultDayPlan();
  _dayPlans = Array.from({length:7},()=>JSON.parse(JSON.stringify(def)));
}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
