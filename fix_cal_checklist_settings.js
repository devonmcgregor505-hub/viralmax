const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// ── 1. CALENDAR - simplify to orange/grey/green only ──
h = h.replace(
  `.cal-day.today{box-shadow:0 0 0 1.5px #84cc16;color:#84cc16;}
.cal-day.score-100{background:rgba(249,115,22,0.15);box-shadow:0 0 0 1.5px #f97316;color:#f97316;}
.cal-day.score-75{background:rgba(255,200,0,0.12);box-shadow:0 0 0 1.5px var(--y);color:var(--y);}
.cal-day.score-50{background:rgba(148,163,184,0.12);box-shadow:0 0 0 1.5px #94a3b8;color:#94a3b8;}
.cal-day.score-25{background:rgba(59,130,246,0.12);box-shadow:0 0 0 1.5px #3b82f6;color:#3b82f6;}
.cal-day.score-low{background:rgba(239,68,68,0.12);box-shadow:0 0 0 1.5px var(--red);color:var(--red);}`,
  `.cal-day.today{box-shadow:0 0 0 2px #84cc16;color:#84cc16;}
.cal-day.completed{background:rgba(249,115,22,0.15);box-shadow:0 0 0 2px #f97316;color:#f97316;}
.cal-day.incomplete{background:rgba(255,255,255,0.04);box-shadow:0 0 0 1px rgba(255,255,255,0.1);color:var(--t3);}`
);

// Remove legend CSS
h = h.replace(
  `.cal-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);}
.cal-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);font-weight:500;}
.cal-legend-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;}`,
  ``
);

// Remove legend HTML
h = h.replace(
  `      <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>0%</div>
    </div>`,
  ``
);

// Update renderCalendar to use new classes
h = h.replace(
  `    const score = _scoreHistory[dateStr];
    const isToday = dateStr===todayStr;
    let cls = 'cal-day';
    if(isToday) cls+=' today';
    else if(score>=100) cls+=' score-100';
    else if(score>=75)  cls+=' score-75';
    else if(score>=50)  cls+=' score-50';
    else if(score>=25)  cls+=' score-25';
    else if(score>0)    cls+=' score-low';
    html+=\`<div class="\${cls}" title="\${score!==undefined?score+'%':''}">\${d}</div>\`;`,
  `    const score = _scoreHistory[dateStr];
    const isToday = dateStr===todayStr;
    const isPast = new Date(dateStr) < new Date(todayStr);
    let cls = 'cal-day';
    if(isToday) cls+=' today';
    else if(score===100) cls+=' completed';
    else if(isPast) cls+=' incomplete';
    html+=\`<div class="\${cls}">\${d}</div>\`;`
);

// ── 2. CHECKLIST - time-based section ordering with collapse ──
// Add CSS for collapsible sections
const sectionCss = `
.cl-section-header{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:16px 0 8px;border-bottom:1px solid var(--border-y);margin-bottom:8px;user-select:none;}
.cl-section-label{font-size:16px;font-weight:800;letter-spacing:.04em;color:var(--y);}
.cl-section-arrow{font-size:12px;color:var(--t3);transition:transform .2s;}
.cl-section-arrow.collapsed{transform:rotate(-90deg);}
.cl-section-body{overflow:hidden;transition:max-height .3s ease;}
.cl-section-body.collapsed{max-height:0!important;}
`;
h = h.replace('</style>', sectionCss + '</style>');

// Replace renderChecklist section rendering to support collapsing
h = h.replace(
  `  el.innerHTML=allItems.map((item,i)=>{
    if(item.type==='section') return \`<div class="cl-section">\${item.label}</div>\`;`,
  `  // Determine which sections are collapsed based on time
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  if(window._sectionCollapsed===undefined){
    window._sectionCollapsed = {morning: !isMorning, night: isMorning};
  }
  el.innerHTML='';
  // Build sections separately
  const sections = [];
  let currentSection = null;
  allItems.forEach((item,i)=>{
    if(item.type==='section'){
      if(currentSection) sections.push(currentSection);
      currentSection={label:item.label, key:item.label.includes('Morning')?'morning':item.label.includes('Night')?'night':'day', items:[], startIdx:i};
    } else if(currentSection){
      currentSection.items.push({...item, globalIdx:i});
    }
  });
  if(currentSection) sections.push(currentSection);
  // Reorder: after midday put night first
  const orderedSections = isMorning ? sections : [sections[2], sections[1], sections[0]].filter(Boolean);
  orderedSections.forEach(section=>{
    const collapsed = window._sectionCollapsed[section.key];
    const sectionHtml = \`<div class="cl-section-header" onclick="toggleSection('\${section.key}')">
      <span class="cl-section-label">\${section.label}</span>
      <span class="cl-section-arrow\${collapsed?' collapsed':''}" id="arrow-\${section.key}">▼</span>
    </div>
    <div class="cl-section-body\${collapsed?' collapsed':''}" id="body-\${section.key}" style="max-height:\${collapsed?'0':'2000px'}">
      \${section.items.map(item=>{
        if(item.type==='section') return '';
        const i=item.globalIdx;
        const isDone=checked.has(i);
        const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map(s=>\`<div class="cl-step">— \${s}</div>\`).join('')}</div>\`:'';
        return \`<div class="check-item" onclick="toggleCheck(\${i})">
          <div class="check-box\${isDone?' done':''}"></div>
          <div class="check-text" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px;">
            <div class="check-name\${isDone?' done':''}">\${item.label}</div>
            \${stepsHtml}
          </div>
        </div>\`;
      }).join('')}
    </div>\`;
    const div=document.createElement('div');
    div.innerHTML=sectionHtml;
    el.appendChild(div);
  });
  // Early return since we handled rendering above
  const tasks=allItems.filter(it=>it.type==='task');
  const done2=[...checked].filter(i=>allItems[i]?.type==='task').length;
  const score2=tasks.length?Math.round(done2/tasks.length*100):0;
  const sb=document.getElementById('scoreBadge'); if(sb)sb.textContent=score2+'%';
  const sn=document.getElementById('scoreNum'); if(sn)sn.textContent=score2;
  const days2=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const db=document.getElementById('dayBadge'); if(db)db.textContent=days2[new Date().getDay()];
  if(!window._dayTimer) window._dayTimer=setInterval(()=>{const d=document.getElementById('dayBadge');if(d)d.textContent=days2[new Date().getDay()];},60000);
  return; // skip old rendering below
  el.innerHTML=allItems.map((item,i)=>{
    if(item.type==='section') return \`<div class="cl-section">\${item.label}</div>\`;`
);

// Add toggleSection function
const toggleFn = `
function toggleSection(key){
  if(window._sectionCollapsed===undefined) window._sectionCollapsed={};
  window._sectionCollapsed[key]=!window._sectionCollapsed[key];
  const body=document.getElementById('body-'+key);
  const arrow=document.getElementById('arrow-'+key);
  if(body){
    body.classList.toggle('collapsed');
    body.style.maxHeight=body.classList.contains('collapsed')?'0':'2000px';
  }
  if(arrow) arrow.classList.toggle('collapsed');
}
`;
h = h.replace('</script>', toggleFn + '</script>');

// ── 3. SETTINGS POPUP ──
const settingsHtml = `
<!-- SETTINGS POPUP -->
<div class="popup-overlay" id="settingsPopup" style="display:none" onclick="if(event.target===this)closeSettings()">
  <div class="popup-box" style="max-width:480px;">
    <button class="popup-close" onclick="closeSettings()">✕</button>
    <div class="popup-title">Settings</div>
    <div class="popup-sub">Personalise your Ascend experience</div>

    <div class="settings-group">
      <div class="settings-label">Timezone</div>
      <select class="settings-select" id="settingTimezone" onchange="saveSetting('timezone',this.value)">
        <option value="auto">Auto-detect</option>
        <option value="Pacific/Auckland">New Zealand (Auckland)</option>
        <option value="Pacific/Chatham">New Zealand (Chatham)</option>
        <option value="Australia/Sydney">Australia (Sydney)</option>
        <option value="Australia/Melbourne">Australia (Melbourne)</option>
        <option value="Australia/Perth">Australia (Perth)</option>
        <option value="Asia/Tokyo">Japan (Tokyo)</option>
        <option value="Asia/Singapore">Singapore</option>
        <option value="Europe/London">UK (London)</option>
        <option value="Europe/Paris">Europe (Paris)</option>
        <option value="America/New_York">US (New York)</option>
        <option value="America/Los_Angeles">US (Los Angeles)</option>
        <option value="America/Chicago">US (Chicago)</option>
      </select>
    </div>

    <div class="settings-group">
      <div class="settings-label">Wake time</div>
      <input class="settings-input" type="time" id="settingWakeTime" onchange="saveSetting('wakeTime',this.value)" value="07:00"/>
      <div class="settings-hint">Used to time your morning routine</div>
    </div>

    <div class="settings-group">
      <div class="settings-label">Sleep time</div>
      <input class="settings-input" type="time" id="settingSleepTime" onchange="saveSetting('sleepTime',this.value)" value="22:30"/>
      <div class="settings-hint">Used to time your night routine</div>
    </div>

    <div class="settings-group">
      <div class="settings-label">Midday switch time</div>
      <input class="settings-input" type="time" id="settingMidday" onchange="saveSetting('middayTime',this.value)" value="12:00"/>
      <div class="settings-hint">When checklist switches from morning to night view</div>
    </div>

    <div class="settings-group">
      <div class="settings-label">Name</div>
      <input class="settings-input" type="text" id="settingName" onchange="saveSetting('name',this.value)" placeholder="Your name"/>
    </div>

    <div class="settings-group">
      <div class="settings-label">Daily reminder</div>
      <select class="settings-select" id="settingReminder" onchange="saveSetting('reminder',this.value)">
        <option value="off">Off</option>
        <option value="morning">Morning only</option>
        <option value="night">Night only</option>
        <option value="both">Morning and night</option>
      </select>
    </div>

    <div class="settings-group">
      <div class="settings-label">Account</div>
      <button class="settings-btn" onclick="window.location.href='/checkout'">Upgrade to Pro</button>
      <button class="settings-btn danger" onclick="if(confirm('Reset all data?')){localStorage.clear();location.reload();}">Reset all data</button>
    </div>
  </div>
</div>
`;
h = h.replace('<!-- CALENDAR POPUP -->', settingsHtml + '\n<!-- CALENDAR POPUP -->');

// Add settings CSS
const settingsCss = `
.settings-group{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);}
.settings-group:last-child{border-bottom:none;}
.settings-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);margin-bottom:8px;}
.settings-select{width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:inherit;font-size:13px;padding:10px 12px;outline:none;cursor:pointer;}
.settings-select:focus{border-color:rgba(255,200,0,0.3);}
.settings-input{width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:inherit;font-size:13px;padding:10px 12px;outline:none;box-sizing:border-box;}
.settings-input:focus{border-color:rgba(255,200,0,0.3);}
.settings-hint{font-size:11px;color:var(--t3);margin-top:5px;}
.settings-btn{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:inherit;font-size:13px;font-weight:500;padding:10px 16px;cursor:pointer;margin-right:8px;margin-top:4px;transition:all .15s;}
.settings-btn:hover{border-color:rgba(255,255,255,0.15);}
.settings-btn.danger{color:var(--red);border-color:rgba(239,68,68,0.2);}
.settings-btn.danger:hover{background:rgba(239,68,68,0.08);}
`;
h = h.replace('</style>', settingsCss + '</style>');

// Wire up settings button in dropdown
h = h.replace(
  `function openSettings(){ document.getElementById('avatarDropdown').classList.remove('open'); alert('Settings coming soon'); }`,
  `function openSettings(){
  document.getElementById('avatarDropdown').classList.remove('open');
  // Load saved settings into form
  const s=JSON.parse(localStorage.getItem('ascend_settings')||'{}');
  const tz=document.getElementById('settingTimezone'); if(tz) tz.value=s.timezone||'auto';
  const wt=document.getElementById('settingWakeTime'); if(wt) wt.value=s.wakeTime||'07:00';
  const st=document.getElementById('settingSleepTime'); if(st) st.value=s.sleepTime||'22:30';
  const mt=document.getElementById('settingMidday'); if(mt) mt.value=s.middayTime||'12:00';
  const nm=document.getElementById('settingName'); if(nm) nm.value=s.name||'';
  const rm=document.getElementById('settingReminder'); if(rm) rm.value=s.reminder||'off';
  document.getElementById('settingsPopup').style.display='flex';
}
function closeSettings(){
  document.getElementById('settingsPopup').style.display='none';
  renderChecklist();
}
function saveSetting(key,val){
  const s=JSON.parse(localStorage.getItem('ascend_settings')||'{}');
  s[key]=val;
  localStorage.setItem('ascend_settings',JSON.stringify(s));
}`
);

// Update isMorning check in renderChecklist to use settings
h = h.replace(
  `  const hour = new Date().getHours();
  const isMorning = hour < 12;`,
  `  const _settings=JSON.parse(localStorage.getItem('ascend_settings')||'{}');
  const _middayStr=_settings.middayTime||'12:00';
  const _middayHour=parseInt(_middayStr.split(':')[0]);
  const hour = new Date().getHours();
  const isMorning = hour < _middayHour;`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('settingsPopup:', h.includes('settingsPopup'));
console.log('toggleSection:', h.includes('function toggleSection'));
console.log('completed class:', h.includes('cal-day.completed'));
