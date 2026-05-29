const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Replace the entire checklist page HTML
h = h.replace(
  `      <div class="panel-page active" id="page-checklist">
        <div class="card" style="margin-bottom:12px;">
          <div class="card-label">Daily habits</div>
          <div class="checklist-wrap" id="checklistItems"></div>
        </div>
        <div class="card" style="margin-bottom:12px;">
          <div class="card-label">Morning routine</div>
          <div id="morningBlocks"></div>
        </div>
        <div class="card">
          <div class="card-label">Night routine</div>
          <div id="nightBlocks"></div>
        </div>
      </div>`,
  `      <div class="panel-page active" id="page-checklist">
        <div id="bigChecklist"></div>
      </div>`
);

// Replace renderChecklist and initApp to build the big checklist
h = h.replace(
  `function renderChecklist(){
  const habitsToUse=window._customHabits||HABITS;
  const el=document.getElementById('checklistItems');
  el.innerHTML=habitsToUse.map((h,i)=>\`
    <div class="check-item" onclick="toggleCheck(\${i})">
      <div class="check-box\${checked.has(i)?' done':''}"></div>
      <div class="check-text">
        <div class="check-name\${checked.has(i)?' done':''}">\${h.name}</div>
        <div class="check-desc">\${h.desc}</div>
      </div>
    </div>\`).join('');
  const score=Math.round(checked.size/(window._customHabits||HABITS).length*100);
  document.getElementById('scoreNum').textContent=score;
  const prog=document.getElementById('page-progress');
  if(prog) prog.querySelectorAll('.stat-val')[1].textContent=score;
}

function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();}`,
  `function renderChecklist(){
  const el=document.getElementById('bigChecklist');
  if(!el)return;
  const morning=window._routineData?.morningBlocks||MORNING;
  const night=window._routineData?.nightBlocks||NIGHT;
  // Build flat item list: morning steps + day habits + night steps
  const allItems=[];
  // Morning
  allItems.push({type:'section',label:'☀️  Morning'});
  morning.forEach(block=>{
    allItems.push({type:'subheader',label:block.title+(block.time?' · '+block.time:'')});
    block.items.forEach(item=>allItems.push({type:'task',label:item}));
  });
  // Day habits
  allItems.push({type:'section',label:'⚡  During the day'});
  allItems.push({type:'task',label:'Drink 3L water'});
  allItems.push({type:'task',label:'Training or movement'});
  // Night
  allItems.push({type:'section',label:'🌙  Night'});
  night.forEach(block=>{
    allItems.push({type:'subheader',label:block.title+(block.time?' · '+block.time:'')});
    block.items.forEach(item=>allItems.push({type:'task',label:item}));
  });
  window._allChecklistItems=allItems;
  el.innerHTML=allItems.map((item,i)=>{
    if(item.type==='section') return \`<div class="cl-section">\${item.label}</div>\`;
    if(item.type==='subheader') return \`<div class="cl-subheader">\${item.label}</div>\`;
    return \`<div class="check-item" onclick="toggleCheck(\${i})">
      <div class="check-box\${checked.has(i)?' done':''}"></div>
      <div class="check-text">
        <div class="check-name\${checked.has(i)?' done':''}">\${item.label}</div>
      </div>
    </div>\`;
  }).join('');
  // Score based on tasks only
  const tasks=allItems.filter(it=>it.type==='task');
  const done=[...checked].filter(i=>allItems[i]?.type==='task').length;
  const score=tasks.length?Math.round(done/tasks.length*100):0;
  const sn=document.getElementById('scoreNum');
  if(sn)sn.textContent=score;
}

function toggleCheck(i){checked.has(i)?checked.delete(i):checked.add(i);renderChecklist();}`
);

// Add CSS for section headers and subheaders
const css = `
.cl-section{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--y);padding:20px 0 8px;border-bottom:1px solid var(--border-y);margin-bottom:4px;}
.cl-section:first-child{padding-top:4px;}
.cl-subheader{font-size:12px;font-weight:700;color:var(--t2);padding:12px 0 4px;letter-spacing:.03em;}
.check-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.check-item:last-child{border-bottom:none;}
`;
h = h.replace('</style>', css + '</style>');

// Make sure morningBlocks and nightBlocks divs still exist somewhere (hidden) for _routineData init
// They're no longer in the DOM so renderRoutine won't find them — init data directly in initApp instead
h = h.replace(
  `  renderRoutine('morningBlocks',   morning);
  renderRoutine('nightBlocks',     night);
  renderRoutine('nutritionBlocks', nutrition);`,
  `  // morningBlocks/nightBlocks no longer in DOM — data lives in _routineData only
  renderRoutine('nutritionBlocks', nutrition);`
);

// Update initApp to call renderChecklist after _routineData is set
h = h.replace(
  `  renderChecklist();`,
  `  renderChecklist(); // must come after _routineData is set`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('bigChecklist:', h.includes('bigChecklist'));
console.log('cl-section:', h.includes('cl-section'));
