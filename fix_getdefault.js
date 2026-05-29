const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Inject getDefaultDayPlan right before renderDayPlanner
h = h.replace(
  `function renderDayPlanner(){`,
  `function getDefaultDayPlan(){
  const morning = (window._routineData && window._routineData.morningBlocks) ? JSON.parse(JSON.stringify(window._routineData.morningBlocks)) : JSON.parse(JSON.stringify(MORNING));
  const night = (window._routineData && window._routineData.nightBlocks) ? JSON.parse(JSON.stringify(window._routineData.nightBlocks)) : JSON.parse(JSON.stringify(NIGHT));
  return {
    morning: morning,
    day: [{title:'Drink 3L water',items:[]},{title:'Training or movement',items:[]}],
    night: night
  };
}

function renderDayPlanner(){`
);

fs.writeFileSync('app.html', h);
console.log('getDefaultDayPlan injected:', h.includes('function getDefaultDayPlan'));
