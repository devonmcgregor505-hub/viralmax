const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Move getDefaultDayPlan to before renderDayPlanner and loadDayPlans
// Find it and remove from current location
const fnMatch = h.match(/function getDefaultDayPlan\(\)\{[\s\S]*?\n\}/);
if(fnMatch){
  h = h.replace(fnMatch[0], '// getDefaultDayPlan moved');
  // Insert before renderDayPlanner
  h = h.replace(
    'function renderDayPlanner(){',
    fnMatch[0] + '\n\nfunction renderDayPlanner(){'
  );
  console.log('moved getDefaultDayPlan');
} else {
  console.log('WARNING: getDefaultDayPlan not found');
}

// Also clear old format in loadDayPlans — wipe if it's an array of objects with 'name' and 'on'
h = h.replace(
  `    const isOldFormat = Array.isArray(_dayPlans[0]);
    const hasMorning = _dayPlans[0] && _dayPlans[0].morning;
    if(isOldFormat || !hasMorning){`,
  `    const isOldFormat = Array.isArray(_dayPlans[0]);
    const hasNameOn = _dayPlans[0] && Array.isArray(_dayPlans[0]) === false && _dayPlans[0].name !== undefined;
    const hasMorning = _dayPlans[0] && _dayPlans[0].morning;
    if(isOldFormat || hasNameOn || !hasMorning){`
);

fs.writeFileSync('app.html', h);
console.log('Done');
