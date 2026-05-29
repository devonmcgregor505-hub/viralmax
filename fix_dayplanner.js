const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Replace the entire day planner popup HTML
h = h.replace(
  `<!-- DAY PLANNER POPUP -->
<div class="popup-overlay" id="dayPlannerPopup" style="display:none" onclick="if(event.target===this)closeDayPlanner()">
  <div class="popup-box">
    <button class="popup-close" onclick="closeDayPlanner()">✕</button>
    <div class="popup-title">Day Planner</div>
    <div class="popup-sub">Customise each day's routine</div>
    <div class="day-tabs" id="dayPlannerTabs"></div>
    <div class="day-task-list" id="dayPlannerTasks"></div>
    <button class="dp-copy-btn" onclick="copyDayToAll()">Apply this day's routine to every day</button>
  </div>
</div>`,
  `<!-- DAY PLANNER POPUP -->
<div class="popup-overlay" id="dayPlannerPopup" style="display:none" onclick="if(event.target===this)closeDayPlanner()">
  <div class="popup-box" style="max-width:600px;">
    <button class="popup-close" onclick="closeDayPlanner()">✕</button>
    <div class="popup-title">Day Planner</div>
    <div class="popup-sub">Edit each day's routine — changes show on your checklist</div>
    <div class="day-tabs" id="dayPlannerTabs"></div>
    <div id="dayPlannerContent"></div>
    <button class="dp-copy-btn" onclick="copyDayToAll()">Set for all days</button>
  </div>
</div>`
);

// Add CSS for day planner editor
const css = `
.dp-section{font-size:15px;font-weight:800;letter-spacing:.04em;color:var(--y);padding:16px 0 8px;border-bottom:1px solid var(--border-y);margin-bottom:8px;}
.dp-block{margin-bottom:16px;background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);padding:12px 14px;}
.dp-block-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.dp-block-title{flex:1;font-size:14px;font-weight:700;color:var(--text);background:transparent;border:none;border-bottom:1px solid transparent;outline:none;font-family:inherit;transition:border-color .15s;padding:2px 0;}
.dp-block-title:focus{border-bottom-color:var(--t3);}
.dp-del-block{background:none;border:none;color:var(--t4);font-size:13px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color .15s;}
.dp-del-block:hover{color:var(--red);}
.dp-step-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);}
.dp-step-row:last-child{border-bottom:none;}
.dp-step-dash{color:var(--t3);font-size:13px;flex-shrink:0;}
.dp-step-input{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;outline:none;font-family:inherit;font-size:13px;color:var(--text);padding:2px 0;transition:border-color .15s;}
.dp-step-input:focus{border-bottom-color:var(--t3);}
.dp-del-step{background:none;border:none;color:var(--t4);font-size:11px;cursor:pointer;padding:2px 4px;flex-shrink:0;transition:color .15s;}
.dp-del-step:hover{color:var(--red);}
.dp-add-step{background:none;border:1px dashed var(--t4);border-radius:var(--rxs);color:var(--t3);font-size:11px;padding:4px 10px;cursor:pointer;margin-top:8px;font-family:inherit;transition:all .15s;width:100%;}
.dp-add-step:hover{border-color:var(--y);color:var(--y);}
.dp-add-block{width:100%;padding:10px;background:transparent;border:1px dashed var(--t3);border-radius:var(--rs);color:var(--t2);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;margin-bottom:12px;transition:all .15s;}
.dp-add-block:hover{border-color:var(--y);color:var(--y);}
`;
h = h.replace('</style>', css + '</style>');

// Replace the JS day planner functions
h = h.replace(
  `// ── DAY PLANNER ──
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_TASKS = [
  {name:'Morning routine',daily:true},
  {name:'Walking',daily:false},
  {name:'Biking',daily:false},
  {name:'Sport',daily:false},
  {name:'Microneedling',daily:false},
  {name:'Drink 3L water',daily:true},
  {name:'Night routine',daily:true},
  {name:'Stretching',daily:false},
];
let _dayPlans = null;
let _activePlanDay = 0;

function loadDayPlans(){
  const saved = localStorage.getItem('ascend_day_plans');
  if(saved){ _dayPlans=JSON.parse(saved); return; }
  // Default — daily tasks on every day, optional tasks off
  _dayPlans = DAY_NAMES.map(()=>DEFAULT_TASKS.map(t=>({name:t.name,on:t.daily})));
}

function saveDayPlans(){
  localStorage.setItem('ascend_day_plans',JSON.stringify(_dayPlans));
}

function openDayPlanner(){
  loadDayPlans();
  _activePlanDay = new Date().getDay()-1; if(_activePlanDay<0)_activePlanDay=6;
  renderDayPlanner();
  document.getElementById('dayPlannerPopup').style.display='flex';
}

function closeDayPlanner(){
  document.getElementById('dayPlannerPopup').style.display='none';
  // Refresh checklist to reflect any changes for today
  renderChecklist();
}

function renderDayPlanner(){
  const tabs = document.getElementById('dayPlannerTabs');
  const short = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  tabs.innerHTML = short.map((d,i)=>\`<div class="day-tab\${i===_activePlanDay?' active':''}" onclick="switchPlanDay(\${i})">\${d}</div>\`).join('');
  const taskList = document.getElementById('dayPlannerTasks');
  taskList.innerHTML = _dayPlans[_activePlanDay].map((task,i)=>\`
    <div class="day-task">
      <div class="day-task-name">\${task.name}</div>
      <button class="day-task-toggle\${task.on?' on':''}" onclick="toggleDayTask(\${i})"></button>
    </div>
  \`).join('');
}

function switchPlanDay(i){
  _activePlanDay=i;
  renderDayPlanner();
}

function toggleDayTask(i){
  _dayPlans[_activePlanDay][i].on=!_dayPlans[_activePlanDay][i].on;
  saveDayPlans();
  renderDayPlanner();
}

function copyDayToAll(){
  const current = JSON.parse(JSON.stringify(_dayPlans[_activePlanDay]));
  _dayPlans = DAY_NAMES.map(()=>JSON.parse(JSON.stringify(current)));
  saveDayPlans();
  renderDayPlanner();
}`,

  `// ── DAY PLANNER ──
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let _dayPlans = null;
let _activePlanDay = 0;

function getDefaultDayPlan(){
  const morning = window._routineData?.morningBlocks || MORNING;
  const night   = window._routineData?.nightBlocks   || NIGHT;
  return {
    morning: JSON.parse(JSON.stringify(morning)),
    day: [{title:'Drink 3L water',items:[]},{title:'Training or movement',items:[]}],
    night: JSON.parse(JSON.stringify(night))
  };
}

function loadDayPlans(){
  const saved = localStorage.getItem('ascend_day_plans');
  if(saved){
    _dayPlans = JSON.parse(saved);
    // Backfill any missing days
    for(let i=0;i<7;i++) if(!_dayPlans[i]) _dayPlans[i]=getDefaultDayPlan();
    return;
  }
  const def = getDefaultDayPlan();
  _dayPlans = Array.from({length:7},()=>JSON.parse(JSON.stringify(def)));
}

function saveDayPlans(){
  localStorage.setItem('ascend_day_plans',JSON.stringify(_dayPlans));
}

function openDayPlanner(){
  loadDayPlans();
  _activePlanDay = new Date().getDay()-1;
  if(_activePlanDay<0) _activePlanDay=6;
  renderDayPlanner();
  document.getElementById('dayPlannerPopup').style.display='flex';
}

function closeDayPlanner(){
  // Save any focused inputs first
  document.activeElement?.blur();
  saveDayPlans();
  document.getElementById('dayPlannerPopup').style.display='none';
  renderChecklist();
}

function switchPlanDay(i){
  document.activeElement?.blur();
  saveDayPlans();
  _activePlanDay=i;
  renderDayPlanner();
}

function renderDayPlanner(){
  const short=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  document.getElementById('dayPlannerTabs').innerHTML=short.map((d,i)=>
    \`<div class="day-tab\${i===_activePlanDay?' active':''}" onclick="switchPlanDay(\${i})">\${d}</div>\`
  ).join('');
  const plan = _dayPlans[_activePlanDay];
  let html = '';
  // Morning section
  html += \`<div class="dp-section">☀️ Morning</div>\`;
  plan.morning.forEach((block,bi)=>{
    html += renderDpBlock('morning',bi,block);
  });
  html += \`<button class="dp-add-block" onclick="dpAddBlock('morning')">+ Add morning block</button>\`;
  // During the day
  html += \`<div class="dp-section">⚡ During the day</div>\`;
  plan.day.forEach((block,bi)=>{
    html += renderDpBlock('day',bi,block);
  });
  html += \`<button class="dp-add-block" onclick="dpAddBlock('day')">+ Add task</button>\`;
  // Night section
  html += \`<div class="dp-section">🌙 Night</div>\`;
  plan.night.forEach((block,bi)=>{
    html += renderDpBlock('night',bi,block);
  });
  html += \`<button class="dp-add-block" onclick="dpAddBlock('night')">+ Add night block</button>\`;
  document.getElementById('dayPlannerContent').innerHTML = html;
}

function renderDpBlock(section,bi,block){
  const steps = block.items||[];
  return \`<div class="dp-block" id="dpblock-\${section}-\${bi}">
    <div class="dp-block-head">
      <input class="dp-block-title" value="\${block.title||''}" placeholder="Block title"
        onchange="dpSaveTitle('\${section}',\${bi},this.value)"/>
      <button class="dp-del-block" onclick="dpDelBlock('\${section}',\${bi})" title="Remove block">✕</button>
    </div>
    \${steps.map((s,si)=>\`
      <div class="dp-step-row">
        <span class="dp-step-dash">—</span>
        <input class="dp-step-input" value="\${s}" placeholder="Step..."
          onchange="dpSaveStep('\${section}',\${bi},\${si},this.value)"/>
        <button class="dp-del-step" onclick="dpDelStep('\${section}',\${bi},\${si})">✕</button>
      </div>\`).join('')}
    <button class="dp-add-step" onclick="dpAddStep('\${section}',\${bi})">+ Add step</button>
  </div>\`;
}

function dpSaveTitle(section,bi,val){
  _dayPlans[_activePlanDay][section][bi].title=val.trim();
  saveDayPlans();
}
function dpSaveStep(section,bi,si,val){
  _dayPlans[_activePlanDay][section][bi].items[si]=val.trim();
  saveDayPlans();
}
function dpDelBlock(section,bi){
  _dayPlans[_activePlanDay][section].splice(bi,1);
  saveDayPlans();
  renderDayPlanner();
}
function dpAddBlock(section){
  _dayPlans[_activePlanDay][section].push({title:'New block',items:[]});
  saveDayPlans();
  renderDayPlanner();
  setTimeout(()=>{
    const blocks=document.querySelectorAll(\`.dp-block\`);
    const last=blocks[blocks.length-1];
    last?.querySelector('.dp-block-title')?.focus();
  },50);
}
function dpDelStep(section,bi,si){
  _dayPlans[_activePlanDay][section][bi].items.splice(si,1);
  saveDayPlans();
  renderDayPlanner();
}
function dpAddStep(section,bi){
  _dayPlans[_activePlanDay][section][bi].items.push('');
  saveDayPlans();
  renderDayPlanner();
  setTimeout(()=>{
    const block=document.getElementById(\`dpblock-\${section}-\${bi}\`);
    const inputs=block?.querySelectorAll('.dp-step-input');
    if(inputs?.length) inputs[inputs.length-1].focus();
  },50);
}
function copyDayToAll(){
  const current=JSON.parse(JSON.stringify(_dayPlans[_activePlanDay]));
  _dayPlans=Array.from({length:7},()=>JSON.parse(JSON.stringify(current)));
  saveDayPlans();
  alert('Applied to all days.');
}`
);

// Update renderChecklist to use day plan for today if available
h = h.replace(
  `function renderChecklist(){
  const el=document.getElementById('bigChecklist');
  if(!el)return;
  const morning=window._routineData?.morningBlocks||MORNING;
  const night=window._routineData?.nightBlocks||NIGHT;`,
  `function renderChecklist(){
  const el=document.getElementById('bigChecklist');
  if(!el)return;
  // Use today's day plan if available
  let morning, night, dayTasks;
  const todayIdx = new Date().getDay()-1<0?6:new Date().getDay()-1;
  const savedPlans = localStorage.getItem('ascend_day_plans');
  if(savedPlans){
    const plans = JSON.parse(savedPlans);
    const todayPlan = plans[todayIdx];
    morning   = todayPlan?.morning   || window._routineData?.morningBlocks || MORNING;
    night     = todayPlan?.night     || window._routineData?.nightBlocks   || NIGHT;
    dayTasks  = todayPlan?.day       || null;
  } else {
    morning   = window._routineData?.morningBlocks || MORNING;
    night     = window._routineData?.nightBlocks   || NIGHT;
    dayTasks  = null;
  }`
);

// Update the day tasks part of renderChecklist to use plan
h = h.replace(
  `  // Day habits
  allItems.push({type:'section',label:'⚡  During the day'});
  allItems.push({type:'task',label:'Drink 3L water'});
  allItems.push({type:'task',label:'Training or movement'});`,
  `  // Day habits — use day plan or defaults
  allItems.push({type:'section',label:'⚡  During the day'});
  if(dayTasks && dayTasks.length){
    dayTasks.forEach(t=>allItems.push({type:'task',label:t.title,steps:t.items?.length?t.items:undefined}));
  } else {
    allItems.push({type:'task',label:'Drink 3L water'});
    allItems.push({type:'task',label:'Training or movement'});
  }`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('dpAddBlock:', h.includes('function dpAddBlock'));
console.log('renderDpBlock:', h.includes('function renderDpBlock'));
