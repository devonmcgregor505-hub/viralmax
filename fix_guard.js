const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

h = h.replace(
  `  const plan=_dayPlans[_activePlanDay];
  let html='';
  html+=\`<div class="dp-section">☀️ Morning</div>\`;
  plan.morning.forEach`,
  `  let plan=_dayPlans[_activePlanDay];
  if(!plan || !plan.morning){
    console.error('Bad plan structure:', JSON.stringify(plan));
    plan = getDefaultDayPlan();
    _dayPlans[_activePlanDay] = plan;
    saveDayPlans();
  }
  let html='';
  html+=\`<div class="dp-section">☀️ Morning</div>\`;
  plan.morning.forEach`
);

fs.writeFileSync('app.html', h);
console.log('replaced:', h.includes('Bad plan structure'));
