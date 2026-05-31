const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Add goal to DEFAULT_WORKOUTS exercises
html = html.replace(
  `    {name:'Chest Press', weight:25},
    {name:'Chest Flys', weight:30},
    {name:'Tricep Pulldowns', weight:20},
    {name:'Overhead Extensions', weight:10}`,
  `    {name:'Chest Press', weight:25, goal:60},
    {name:'Chest Flys', weight:30, goal:50},
    {name:'Tricep Pulldowns', weight:20, goal:45},
    {name:'Overhead Extensions', weight:10, goal:30}`
);
html = html.replace(
  `    {name:'Lat Pull Downs', weight:40},
    {name:'Rows', weight:40},
    {name:'Bar Bicep Curls', weight:20},
    {name:'Hammer Curls', weight:6}`,
  `    {name:'Lat Pull Downs', weight:40, goal:80},
    {name:'Rows', weight:40, goal:75},
    {name:'Bar Bicep Curls', weight:20, goal:40},
    {name:'Hammer Curls', weight:6, goal:16}`
);
html = html.replace(
  `    {name:'Lateral Raises', weight:6},
    {name:'Shoulder Press', weight:20},
    {name:'Bar Bicep Curls', weight:20},
    {name:'Tricep Pulldowns', weight:20}`,
  `    {name:'Lateral Raises', weight:6, goal:16},
    {name:'Shoulder Press', weight:20, goal:50},
    {name:'Bar Bicep Curls', weight:20, goal:40},
    {name:'Tricep Pulldowns', weight:20, goal:45}`
);

// 2. Replace exercise row render to include goal + progress bar
html = html.replace(
  `      day.exercises.forEach(function(ex,ei){
        html+="<div class=\\"exercise-row\\">"
          +"<input class=\\"exercise-name\\" value=\\""+ex.name+"\\" style=\\"background:transparent;border:none;outline:none;font-family:inherit;font-size:14px;font-weight:600;color:var(--text);flex:1;\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'name',this.value)\\"/>"
          +"<div class=\\"exercise-weight\\">"
          +"<span class=\\"exercise-weight-label\\">Start</span>"
          +"<input class=\\"exercise-weight-input\\" type=\\"number\\" value=\\""+ex.weight+"\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'weight',+this.value)\\"/>"
          +"<span class=\\"exercise-weight-unit\\">kg</span>"
          +"</div>"
          +"<button style=\\"background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 6px;\\" onmouseover=\\"this.style.color='#ef4444'\\" onmouseout=\\"this.style.color='var(--t4)'\\" onclick=\\"deleteExercise('"+day.id+"',"+ei+")\\" >✕</button>"
          +"</div>";
      });`,
  `      day.exercises.forEach(function(ex,ei){
        var pct = ex.goal ? Math.min(100, Math.round((ex.weight/ex.goal)*100)) : 0;
        var barColor = pct>=100 ? '#22c55e' : pct>=60 ? 'var(--y)' : '#60a5fa';
        html+="<div class=\\"exercise-row\\">"
          +"<div style=\\"flex:1;min-width:0;\\">"
          +"<input class=\\"exercise-name\\" value=\\""+ex.name+"\\" style=\\"background:transparent;border:none;outline:none;font-family:inherit;font-size:14px;font-weight:600;color:var(--text);width:100%;\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'name',this.value)\\"/>"
          +(ex.goal ? "<div style=\\"display:flex;align-items:center;gap:6px;margin-top:5px;\\">"
            +"<div style=\\"flex:1;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;\\">"
            +"<div style=\\"width:"+pct+"%;height:100%;background:"+barColor+";border-radius:2px;transition:width .3s;\\"></div></div>"
            +"<span style=\\"font-size:10px;color:var(--t3);white-space:nowrap;\\">"+ex.weight+"→"+ex.goal+"kg</span>"
            +"</div>" : "")
          +"</div>"
          +"<div class=\\"exercise-weight\\">"
          +"<span class=\\"exercise-weight-label\\">Now</span>"
          +"<input class=\\"exercise-weight-input\\" type=\\"number\\" value=\\""+ex.weight+"\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'weight',+this.value)\\"/>"
          +"<span class=\\"exercise-weight-unit\\">kg</span>"
          +"</div>"
          +"<div class=\\"exercise-weight\\" style=\\"margin-left:4px;\\">"
          +"<span class=\\"exercise-weight-label\\">Goal</span>"
          +"<input class=\\"exercise-weight-input\\" style=\\"border-color:rgba(34,197,94,0.25);color:#22c55e;\\" type=\\"number\\" value=\\""+( ex.goal||0)+"\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'goal',+this.value)\\"/>"
          +"<span class=\\"exercise-weight-unit\\">kg</span>"
          +"</div>"
          +"<button style=\\"background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 6px;\\" onmouseover=\\"this.style.color='#ef4444'\\" onmouseout=\\"this.style.color='var(--t4)'\\" onclick=\\"deleteExercise('"+day.id+"',"+ei+")\\" >✕</button>"
          +"</div>";
      });`
);

// 3. Add goal:0 to new exercises
html = html.replace(
  `  day.exercises.push({name:"New exercise",weight:0}); saveWorkouts(w); renderTrainingSection();`,
  `  day.exercises.push({name:"New exercise",weight:0,goal:0}); saveWorkouts(w); renderTrainingSection();`
);

if(!html.includes('goal:60')) { console.error('FAIL: defaults'); process.exit(1); }
if(!html.includes('Now</span>')) { console.error('FAIL: row render'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
