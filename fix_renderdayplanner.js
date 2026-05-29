const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Remove old renderDayPlanner + switchPlanDay + toggleDayTask functions
const oldFns = h.match(/function renderDayPlanner\(\)\{[\s\S]*?function switchPlanDay/);
if(oldFns){
  h = h.replace(oldFns[0], 'function switchPlanDay');
  console.log('removed old renderDayPlanner');
} else {
  console.log('WARNING: could not find old renderDayPlanner');
}

// Insert new renderDayPlanner before switchPlanDay
const newFn = `function renderDayPlanner(){
  const short=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  document.getElementById('dayPlannerTabs').innerHTML=short.map((d,i)=>
    \`<div class="day-tab\${i===_activePlanDay?' active':''}" onclick="switchPlanDay(\${i})">\${d}</div>\`
  ).join('');
  const plan=_dayPlans[_activePlanDay];
  let html='';
  html+=\`<div class="dp-section">☀️ Morning</div>\`;
  plan.morning.forEach((block,bi)=>{ html+=renderDpBlock('morning',bi,block); });
  html+=\`<button class="dp-add-block" onclick="dpAddBlock('morning')">+ Add morning block</button>\`;
  html+=\`<div class="dp-section">⚡ During the day</div>\`;
  plan.day.forEach((block,bi)=>{ html+=renderDpBlock('day',bi,block); });
  html+=\`<button class="dp-add-block" onclick="dpAddBlock('day')">+ Add task</button>\`;
  html+=\`<div class="dp-section">🌙 Night</div>\`;
  plan.night.forEach((block,bi)=>{ html+=renderDpBlock('night',bi,block); });
  html+=\`<button class="dp-add-block" onclick="dpAddBlock('night')">+ Add night block</button>\`;
  document.getElementById('dayPlannerContent').innerHTML=html;
}

function switchPlanDay`;

h = h.replace('function switchPlanDay', newFn);

fs.writeFileSync('app.html', h);
console.log('Done');
