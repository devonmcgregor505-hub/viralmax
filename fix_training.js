const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace training page HTML
html = html.replace(
  `      <div class="panel-page" id="page-training">
        <div class="section-header">
          <div class="section-title">Training Split</div>
          <div class="section-sub">5 days active · Mixed training · Built for physique.</div>
        </div>
        <div id="trainingDays"></div>
        <div class="card" style="margin-top:16px;">
          <div class="card-label">Daily frame work</div>
          <div id="frameBlocks"></div>
        </div>
        <div style="margin-top:16px;">
          <button class="btn-y" onclick="askAI('Give me a detailed gym workout — full exercises, sets, reps for upper push, upper pull, and legs day')">Full workout breakdown ✦</button>
        </div>
      </div>`,
  `      <div class="panel-page" id="page-training">
        <div class="section-header">
          <div class="section-title">Training</div>
          <div class="section-sub">Your workout split — tap exercises to log starting weight.</div>
        </div>
        <div id="trainingSection"></div>
      </div>`
);

// 2. CSS
const CSS = `
.workout-day{background:var(--bg-panel);border:1px solid var(--border);border-radius:14px;margin-bottom:10px;overflow:hidden;}
.workout-day-head{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;transition:background .15s;}
.workout-day-head:hover{background:rgba(255,255,255,0.02);}
.workout-day-label{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);min-width:28px;}
.workout-day-name{font-size:15px;font-weight:800;color:var(--text);flex:1;}
.workout-day-tag{font-size:9px;font-weight:800;letter-spacing:.08em;padding:3px 9px;border-radius:20px;text-transform:uppercase;flex-shrink:0;}
.wtag-push{background:rgba(255,200,0,0.1);color:var(--y);border:1px solid rgba(255,200,0,0.15);}
.wtag-pull{background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.15);}
.wtag-arms{background:rgba(167,139,250,0.1);color:#a78bfa;border:1px solid rgba(167,139,250,0.15);}
.wtag-legs{background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.15);}
.wtag-cardio{background:rgba(249,115,22,0.1);color:#f97316;border:1px solid rgba(249,115,22,0.15);}
.wtag-rest{background:rgba(255,255,255,0.05);color:var(--t2);border:1px solid rgba(255,255,255,0.08);}
.workout-day-arrow{font-size:11px;color:var(--t3);transition:transform .2s;}
.workout-day-arrow.open{transform:rotate(180deg);}
.workout-exercises{padding:0 18px 14px;}
.exercise-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.exercise-row:last-child{border-bottom:none;}
.exercise-name{font-size:14px;font-weight:600;color:var(--text);flex:1;}
.exercise-weight{display:flex;align-items:center;gap:6px;}
.exercise-weight-label{font-size:10px;font-weight:700;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;}
.exercise-weight-input{width:64px;background:rgba(255,200,0,0.06);border:1px solid rgba(255,200,0,0.15);border-radius:8px;color:var(--y);font-family:'Bebas Neue',sans-serif;font-size:18px;padding:4px 8px;outline:none;text-align:center;letter-spacing:1px;}
.exercise-weight-input:focus{border-color:var(--y);background:rgba(255,200,0,0.1);}
.exercise-weight-unit{font-size:11px;color:var(--t2);font-weight:600;}
.workout-add-btn{width:100%;padding:10px;background:transparent;border:1px dashed rgba(255,255,255,0.08);border-radius:10px;color:var(--t2);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;margin-top:10px;}
.workout-add-btn:hover{border-color:var(--y);color:var(--y);}`;

html = html.replace('</style>', CSS + '\n</style>');

// 3. JS
const JS = `
// TRAINING
var DEFAULT_WORKOUTS = [
  {id:'A', label:'Day A', name:'Push', tag:'push', open:false, exercises:[
    {name:'Chest Press', weight:25},
    {name:'Chest Flys', weight:30},
    {name:'Tricep Pulldowns', weight:20},
    {name:'Overhead Extensions', weight:10}
  ]},
  {id:'B', label:'Day B', name:'Pull', tag:'pull', open:false, exercises:[
    {name:'Lat Pull Downs', weight:40},
    {name:'Rows', weight:40},
    {name:'Bar Bicep Curls', weight:20},
    {name:'Hammer Curls', weight:6}
  ]},
  {id:'C', label:'Day C', name:'Arms', tag:'arms', open:false, exercises:[
    {name:'Lateral Raises', weight:6},
    {name:'Shoulder Press', weight:20},
    {name:'Bar Bicep Curls', weight:20},
    {name:'Tricep Pulldowns', weight:20}
  ]}
];
function loadWorkouts(){ return JSON.parse(localStorage.getItem("ascend_workouts")||JSON.stringify(DEFAULT_WORKOUTS)); }
function saveWorkouts(w){ localStorage.setItem("ascend_workouts",JSON.stringify(w)); }

function renderTrainingSection(){
  var el=document.getElementById("trainingSection"); if(!el)return;
  var workouts=loadWorkouts();
  var html="";
  workouts.forEach(function(day){
    html+="<div class=\\"workout-day\\">"
      +"<div class=\\"workout-day-head\\" onclick=\\"toggleWorkoutDay('"+day.id+"')\\">"
      +"<span class=\\"workout-day-label\\">"+day.label+"</span>"
      +"<span class=\\"workout-day-name\\">"+day.name+"</span>"
      +"<span class=\\"workout-day-tag wtag-"+day.tag+"\\">"+day.tag.toUpperCase()+"</span>"
      +"<span class=\\"workout-day-arrow"+(day.open?" open":"")+"\\">▼</span>"
      +"</div>";
    if(day.open){
      html+="<div class=\\"workout-exercises\\">";
      day.exercises.forEach(function(ex,ei){
        html+="<div class=\\"exercise-row\\">"
          +"<input class=\\"exercise-name\\" value=\\""+ex.name+"\\" style=\\"background:transparent;border:none;outline:none;font-family:inherit;font-size:14px;font-weight:600;color:var(--text);flex:1;\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'name',this.value)\\"/>"
          +"<div class=\\"exercise-weight\\">"
          +"<span class=\\"exercise-weight-label\\">Start</span>"
          +"<input class=\\"exercise-weight-input\\" type=\\"number\\" value=\\""+ex.weight+"\\" onchange=\\"updateExercise('"+day.id+"',"+ei+",'weight',+this.value)\\"/>"
          +"<span class=\\"exercise-weight-unit\\">kg</span>"
          +"</div>"
          +"<button style=\\"background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 6px;\\" onmouseover=\\"this.style.color='#ef4444'\\" onmouseout=\\"this.style.color='var(--t4)'\\" onclick=\\"deleteExercise('"+day.id+"',"+ei+")\\" >✕</button>"
          +"</div>";
      });
      html+="<button class=\\"workout-add-btn\\" onclick=\\"addExercise('"+day.id+"')\\">+ Add exercise</button>"
        +"</div>";
    }
    html+="</div>";
  });
  el.innerHTML=html;
}
function toggleWorkoutDay(id){
  var w=loadWorkouts();
  var day=w.find(function(d){return d.id===id;}); if(!day)return;
  day.open=!day.open; saveWorkouts(w); renderTrainingSection();
}
function updateExercise(dayId,ei,field,val){
  var w=loadWorkouts();
  var day=w.find(function(d){return d.id===dayId;}); if(!day)return;
  day.exercises[ei][field]=val; saveWorkouts(w);
}
function deleteExercise(dayId,ei){
  var w=loadWorkouts();
  var day=w.find(function(d){return d.id===dayId;}); if(!day)return;
  day.exercises.splice(ei,1); saveWorkouts(w); renderTrainingSection();
}
function addExercise(dayId){
  var w=loadWorkouts();
  var day=w.find(function(d){return d.id===dayId;}); if(!day)return;
  day.exercises.push({name:"New exercise",weight:0}); saveWorkouts(w); renderTrainingSection();
  setTimeout(function(){
    var inputs=document.querySelectorAll(".exercise-name");
    if(inputs.length) inputs[inputs.length-1].focus();
  },50);
}`;

html = html.replace('</script>', JS + '\n</script>');

// 4. Call renderTrainingSection in initApp + showPage
html = html.replace(
  `  renderTrainingFromData(training);`,
  `  renderTrainingSection();`
);
html = html.replace(
  `  if(name==='nutrition') setTimeout(renderMealsSection,10);`,
  `  if(name==='nutrition') setTimeout(renderMealsSection,10);\n  if(name==='training') setTimeout(renderTrainingSection,10);`
);

fs.writeFileSync('app.html', html);
console.log('Done');
