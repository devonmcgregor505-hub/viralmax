const fs = require('fs');

// ── SERVER.JS ──
let s = fs.readFileSync('server.js', 'utf8');

const scoreRoutes = `
// ── Save daily score ──
app.post('/api/scores/save', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ ok: true });
  const { date, score, completed_items, total_items } = req.body;
  try {
    const { error } = await supabase.from('daily_scores').upsert({
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
      score,
      completed_items: completed_items || [],
      total_items: total_items || 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) {
    console.error('[scores/save]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get score history ──
app.get('/api/scores/history', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ scores: [] });
  try {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('date, score, completed_items, total_items')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90);
    if (error) throw error;
    res.json({ scores: data || [] });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});
`;

s = s.replace('// ══════════════════════════════════════════════════════════════════════════════\n// AUTH + USER ROUTES', scoreRoutes + '\n// ══════════════════════════════════════════════════════════════════════════════\n// AUTH + USER ROUTES');
fs.writeFileSync('server.js', s);
console.log('server.js updated');

// ── APP.HTML ──
let h = fs.readFileSync('app.html', 'utf8');

// 1. Add calendar + day planner CSS
const css = `
/* ── POPUPS ── */
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:24px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;position:relative;z-index:999;}
.popup-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;margin-bottom:4px;}
.popup-sub{font-size:12px;color:var(--t2);margin-bottom:20px;}
.popup-close{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--t2);font-size:18px;cursor:pointer;line-height:1;}
.popup-close:hover{color:var(--text);}

/* ── CALENDAR ── */
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.cal-month{font-size:14px;font-weight:700;color:var(--text);}
.cal-nav{background:none;border:1px solid var(--border);border-radius:6px;color:var(--t2);width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}
.cal-nav:hover{color:var(--text);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal-dow{font-size:10px;font-weight:700;color:var(--t3);text-align:center;padding:4px 0;letter-spacing:.06em;}
.cal-day{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--t2);cursor:default;position:relative;}
.cal-day.empty{background:none;}
.cal-day.today{box-shadow:0 0 0 2px #84cc16;color:#84cc16;}
.cal-day.score-100{background:rgba(249,115,22,0.2);box-shadow:0 0 0 2px #f97316;color:#f97316;}
.cal-day.score-75{background:rgba(255,200,0,0.15);box-shadow:0 0 0 2px var(--y);color:var(--y);}
.cal-day.score-50{background:rgba(148,163,184,0.15);box-shadow:0 0 0 2px #94a3b8;color:#94a3b8;}
.cal-day.score-25{background:rgba(59,130,246,0.15);box-shadow:0 0 0 2px #3b82f6;color:#3b82f6;}
.cal-day.score-low{background:rgba(239,68,68,0.15);box-shadow:0 0 0 2px var(--red);color:var(--red);}
.cal-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.cal-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--t2);}
.cal-legend-dot{width:10px;height:10px;border-radius:50%;}

/* ── DAY PLANNER ── */
.day-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;}
.day-tab{padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;background:var(--bg-panel);border:1px solid var(--border);color:var(--t2);cursor:pointer;transition:all .15s;}
.day-tab:hover{color:var(--text);}
.day-tab.active{background:var(--yd);border-color:var(--border-y);color:var(--y);}
.day-task-list{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.day-task{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);}
.day-task-name{flex:1;font-size:13px;font-weight:500;}
.day-task-toggle{width:36px;height:20px;border-radius:10px;background:var(--t4);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.day-task-toggle.on{background:var(--y);}
.day-task-toggle::after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:3px;left:3px;transition:left .2s;}
.day-task-toggle.on::after{left:19px;}
.dp-copy-btn{width:100%;padding:10px;background:var(--yd);border:1px solid var(--border-y);border-radius:var(--rs);color:var(--y);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.04em;transition:all .15s;}
.dp-copy-btn:hover{background:rgba(255,200,0,0.15);}
`;
h = h.replace('</style>', css + '</style>');

// 2. Add popup HTML before closing body
h = h.replace(
  '<!-- ONBOARDING OVERLAY -->',
  `<!-- CALENDAR POPUP -->
<div class="popup-overlay" id="calendarPopup" style="display:none" onclick="if(event.target===this)closeCalendar()">
  <div class="popup-box">
    <button class="popup-close" onclick="closeCalendar()">✕</button>
    <div class="popup-title">Streak Calendar</div>
    <div class="popup-sub">Your daily completion history</div>
    <div class="cal-header">
      <button class="cal-nav" onclick="calNav(-1)">‹</button>
      <div class="cal-month" id="calMonthLabel"></div>
      <button class="cal-nav" onclick="calNav(1)">›</button>
    </div>
    <div class="cal-grid" id="calGrid"></div>
    <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16;box-shadow:0 0 0 2px #84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75–99%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50–74%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25–49%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>1–24%</div>
    </div>
  </div>
</div>

<!-- DAY PLANNER POPUP -->
<div class="popup-overlay" id="dayPlannerPopup" style="display:none" onclick="if(event.target===this)closeDayPlanner()">
  <div class="popup-box">
    <button class="popup-close" onclick="closeDayPlanner()">✕</button>
    <div class="popup-title">Day Planner</div>
    <div class="popup-sub">Customise each day's routine</div>
    <div class="day-tabs" id="dayPlannerTabs"></div>
    <div class="day-task-list" id="dayPlannerTasks"></div>
    <button class="dp-copy-btn" onclick="copyDayToAll()">Apply this day's routine to every day</button>
  </div>
</div>

<!-- ONBOARDING OVERLAY -->`
);

// 3. Make streak badge open calendar, day badge open day planner
h = h.replace(
  `    <div class="streak-badge" id="streakBadge">`,
  `    <div class="streak-badge" id="streakBadge" onclick="openCalendar()" style="cursor:pointer">`
);
h = h.replace(
  `    <div class="streak-badge" id="dayBadge" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);color:var(--t2);">Mon</div>`,
  `    <div class="streak-badge" id="dayBadge" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);color:var(--t2);cursor:pointer;" onclick="openDayPlanner()">Mon</div>`
);

// 4. Add all the JS
const js = `
// ── SCORE SAVING ──
let _lastSavedScore = -1;
function maybeSaveScore(){
  const items = window._allChecklistItems||[];
  const tasks = items.filter(it=>it.type==='task');
  const done = [...checked].filter(i=>items[i]?.type==='task').length;
  const score = tasks.length ? Math.round(done/tasks.length*100) : 0;
  if(score === _lastSavedScore) return;
  _lastSavedScore = score;
  const today = new Date().toISOString().split('T')[0];
  // Save to localStorage for guests
  const hist = JSON.parse(localStorage.getItem('ascend_score_history')||'{}');
  hist[today] = score;
  localStorage.setItem('ascend_score_history', JSON.stringify(hist));
  // Save to server if logged in
  const userId = localStorage.getItem('ascend_user_id');
  if(userId){
    fetch('/api/scores/save',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-user-id':userId},
      body:JSON.stringify({date:today,score,completed_items:[...checked],total_items:tasks.length})
    }).catch(()=>{});
  }
}

// ── CALENDAR ──
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let _scoreHistory = {};

async function openCalendar(){
  // Load score history
  const local = JSON.parse(localStorage.getItem('ascend_score_history')||'{}');
  _scoreHistory = {...local};
  const userId = localStorage.getItem('ascend_user_id');
  if(userId){
    try{
      const res = await fetch('/api/scores/history',{headers:{'x-user-id':userId}});
      const data = await res.json();
      (data.scores||[]).forEach(s=>{ _scoreHistory[s.date]=s.score; });
    }catch(e){}
  }
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  renderCalendar();
  document.getElementById('calendarPopup').style.display='flex';
}

function closeCalendar(){
  document.getElementById('calendarPopup').style.display='none';
}

function calNav(dir){
  calMonth += dir;
  if(calMonth > 11){calMonth=0;calYear++;}
  if(calMonth < 0){calMonth=11;calYear--;}
  renderCalendar();
}

function renderCalendar(){
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = months[calMonth]+' '+calYear;
  const grid = document.getElementById('calGrid');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = dows.map(d=>\`<div class="cal-dow">\${d}</div>\`).join('');
  // First day of month (0=Sun, shift to Mon=0)
  const first = new Date(calYear, calMonth, 1);
  let startDow = first.getDay()-1; if(startDow<0)startDow=6;
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  for(let i=0;i<startDow;i++) html+=\`<div class="cal-day empty"></div>\`;
  for(let d=1;d<=daysInMonth;d++){
    const dateStr = calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const score = _scoreHistory[dateStr];
    const isToday = dateStr===todayStr;
    let cls = 'cal-day';
    if(isToday) cls+=' today';
    else if(score>=100) cls+=' score-100';
    else if(score>=75)  cls+=' score-75';
    else if(score>=50)  cls+=' score-50';
    else if(score>=25)  cls+=' score-25';
    else if(score>0)    cls+=' score-low';
    html+=\`<div class="\${cls}" title="\${score!==undefined?score+'%':''}">\${d}</div>\`;
  }
  grid.innerHTML = html;
}

// ── DAY PLANNER ──
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_TASKS = [
  {name:'Morning routine',daily:true},
  {name:'Gym',daily:false},
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
}
`;
h = h.replace('</script>', js + '</script>');

// 5. Call maybeSaveScore inside toggleCheck
h = h.replace(
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();}`,
  `function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();maybeSaveScore();}`
);

fs.writeFileSync('app.html', h);
console.log('app.html done');
console.log('calendar popup:', h.includes('calendarPopup'));
console.log('day planner popup:', h.includes('dayPlannerPopup'));
console.log('score saving:', h.includes('maybeSaveScore'));
