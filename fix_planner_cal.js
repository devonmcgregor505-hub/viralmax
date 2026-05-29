const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Fix loadDayPlans to not crash if _routineData is null
h = h.replace(
  `function getDefaultDayPlan(){
  const morning = window._routineData?.morningBlocks || MORNING;
  const night   = window._routineData?.nightBlocks   || NIGHT;
  return {
    morning: JSON.parse(JSON.stringify(morning)),
    day: [{title:'Drink 3L water',items:[]},{title:'Training or movement',items:[]}],
    night: JSON.parse(JSON.stringify(night))
  };
}`,
  `function getDefaultDayPlan(){
  try{
    const morning = (window._routineData && window._routineData.morningBlocks) || MORNING;
    const night   = (window._routineData && window._routineData.nightBlocks)   || NIGHT;
    return {
      morning: JSON.parse(JSON.stringify(morning)),
      day: [{title:'Drink 3L water',items:[]},{title:'Training or movement',items:[]}],
      night: JSON.parse(JSON.stringify(night))
    };
  }catch(e){
    return {
      morning: JSON.parse(JSON.stringify(MORNING)),
      day: [{title:'Drink 3L water',items:[]},{title:'Training or movement',items:[]}],
      night: JSON.parse(JSON.stringify(NIGHT))
    };
  }
}`
);

// 2. Wrap openDayPlanner in try/catch so errors surface in console
h = h.replace(
  `function openDayPlanner(){
  loadDayPlans();
  _activePlanDay = new Date().getDay()-1;
  if(_activePlanDay<0) _activePlanDay=6;
  renderDayPlanner();
  document.getElementById('dayPlannerPopup').style.display='flex';
}`,
  `function openDayPlanner(){
  try{
    loadDayPlans();
    _activePlanDay = new Date().getDay()-1;
    if(_activePlanDay<0) _activePlanDay=6;
    renderDayPlanner();
    document.getElementById('dayPlannerPopup').style.display='flex';
  }catch(e){
    console.error('Day planner error:',e);
    alert('Error opening day planner: '+e.message);
  }
}`
);

// 3. Make calendar popup bigger
h = h.replace(
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:24px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;position:relative;z-index:999;}`,
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px;width:95%;max-width:720px;max-height:92vh;overflow-y:auto;position:relative;z-index:999;}`
);

// 4. Make calendar day cells bigger
h = h.replace(
  `.cal-day{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--t2);cursor:default;margin:0 auto;}`,
  `.cal-day{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--t2);cursor:default;margin:0 auto;}`
);

// 5. Bigger day of week labels
h = h.replace(
  `.cal-dow{font-size:11px;font-weight:700;color:var(--t3);text-align:center;padding:6px 0;letter-spacing:.06em;}`,
  `.cal-dow{font-size:12px;font-weight:700;color:var(--t3);text-align:center;padding:8px 0;letter-spacing:.06em;}`
);

// 6. Bigger gap in grid
h = h.replace(
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}`,
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
