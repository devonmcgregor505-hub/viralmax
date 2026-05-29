const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Replace HABITS array with new 6-item checklist
h = h.replace(
  /const HABITS = \[[\s\S]*?\];/,
  `const HABITS = [
  {name:'Awake by ' + (JSON.parse(localStorage.getItem('ascend_profile')||'{}').wake||'7am'), desc:'Start your day on time', cat:'mind'},
  {name:'Morning routine', desc:'Complete your full morning routine', cat:'skin'},
  {name:'Training or movement', desc:'Gym, walk, sport or mobility', cat:'body'},
  {name:'Drink 3L water', desc:'Track across the day', cat:'body'},
  {name:'Night routine', desc:'Complete your full night routine', cat:'skin'},
  {name:'Sleep by 10:30pm', desc:'7.5–9h sleep target', cat:'sleep'},
];`
);

// 2. Remove notes/italic text from routine blocks CSS rendering
h = h.replace(
  `        \${item.note?'<div class="routine-note">'+item.note+'</div>':''}`,
  ``
);

// Also remove note from the other renderRoutine call
h = h.replace(
  `        \${item.note?\`<div class="routine-note">\${item.note}</div>\`:''}`,
  ``
);

// 3. Remove supplements and coffee from MORNING data
h = h.replace(
  `  {time:'8:00',title:'Breakfast & supplements',tag:'body',tagLabel:'Nutrition',items:['30–40g protein breakfast (eggs, Greek yogurt, cottage cheese)','Creatine 5g daily — most evidence-backed supplement you can take','Coffee after food, not before — stabilises cortisol']},`,
  `  {time:'8:00',title:'Breakfast',tag:'body',tagLabel:'Nutrition',items:['30–40g protein breakfast — eggs, Greek yogurt, cottage cheese, or similar','Eat within 1h of waking']},`
);

// 4. Replace renderRoutine to support inline editing
h = h.replace(
  `function renderRoutine(containerId,data){
  const el=document.getElementById(containerId);
  if(!el)return;
  el.innerHTML=data.map((item,idx)=>\`
    <div class="routine-item" id="ri-\${containerId}-\${idx}">
      <div class="routine-head" onclick="toggleRoutine('\${containerId}',\${idx})">
        \${item.time?\`<span class="routine-time">\${item.time}</span>\`:''}
        <span class="routine-title">\${item.title}</span>
        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
        <span class="routine-chevron">▼</span>
      </div>
      <div class="routine-body">
        <ul>\${item.items.map(it=>\`<li>\${it}</li>\`).join('')}</ul>
        \${item.note?\`<div class="routine-note">\${item.note}</div>\`:''}
      </div>
    </div>\`).join('');
}`,
  `function renderRoutine(containerId, data){
  const el=document.getElementById(containerId);
  if(!el)return;
  // Store editable copy in window
  if(!window._routineData) window._routineData={};
  if(!window._routineData[containerId]) window._routineData[containerId]=JSON.parse(JSON.stringify(data));
  const d=window._routineData[containerId];
  el.innerHTML=d.map((item,idx)=>\`
    <div class="routine-item" id="ri-\${containerId}-\${idx}">
      <div class="routine-head" onclick="toggleRoutine('\${containerId}',\${idx})">
        \${item.time?\`<span class="routine-time">\${item.time}</span>\`:''}
        <span class="routine-title" contenteditable="true" onclick="event.stopPropagation()" onblur="saveRoutineTitle('\${containerId}',\${idx},this.innerText)">\${item.title}</span>
        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
        <span class="routine-chevron">▼</span>
      </div>
      <div class="routine-body">
        <ul id="rul-\${containerId}-\${idx}">\${item.items.map((it,li)=>\`
          <li>
            <span contenteditable="true" onblur="saveRoutineItem('\${containerId}',\${idx},\${li},this.innerText)">\${it}</span>
            <button class="ri-del" onclick="deleteRoutineItem('\${containerId}',\${idx},\${li})" title="Remove">✕</button>
          </li>\`).join('')}
        </ul>
        <button class="ri-add" onclick="addRoutineItem('\${containerId}',\${idx})">+ Add step</button>
      </div>
    </div>\`).join('');
}

function toggleRoutine(cid,idx){
  const el=document.getElementById('ri-'+cid+'-'+idx);
  el.classList.toggle('open');
}
function saveRoutineTitle(cid,idx,val){
  if(window._routineData[cid][idx]) window._routineData[cid][idx].title=val.trim();
  persistRoutine(cid);
}
function saveRoutineItem(cid,idx,li,val){
  if(window._routineData[cid]?.[idx]?.items) window._routineData[cid][idx].items[li]=val.trim();
  persistRoutine(cid);
}
function deleteRoutineItem(cid,idx,li){
  window._routineData[cid][idx].items.splice(li,1);
  persistRoutine(cid);
  renderRoutine(cid, window._routineData[cid]);
  document.getElementById('ri-'+cid+'-'+idx)?.classList.add('open');
}
function addRoutineItem(cid,idx){
  window._routineData[cid][idx].items.push('New step — tap to edit');
  persistRoutine(cid);
  renderRoutine(cid, window._routineData[cid]);
  document.getElementById('ri-'+cid+'-'+idx)?.classList.add('open');
  // Focus the new item
  setTimeout(()=>{
    const ul=document.getElementById('rul-'+cid+'-'+idx);
    const last=ul?.querySelectorAll('li span[contenteditable]');
    if(last?.length) last[last.length-1].focus();
  },50);
}
function persistRoutine(cid){
  const saved=JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const keyMap={'morningBlocks':'morning','nightBlocks':'night','nutritionBlocks':'nutrition'};
  const key=keyMap[cid];
  if(key){saved[key]=window._routineData[cid];localStorage.setItem('ascend_profile',JSON.stringify(saved));}
}`
);

// 5. Remove the old toggleRoutine function since it's now inside renderRoutine
h = h.replace(
  `function toggleRoutine(cid,idx){
  const el=document.getElementById(\`ri-\${cid}-\${idx}\`);
  el.classList.toggle('open');
}`,
  ``
);

// 6. Add CSS for edit controls
const editCss = `
.routine-body li{display:flex;align-items:flex-start;gap:6px;padding:4px 0;}
.routine-body li span[contenteditable]{flex:1;outline:none;border-bottom:1px solid transparent;transition:border-color .15s;border-radius:2px;padding:1px 2px;}
.routine-body li span[contenteditable]:focus{border-bottom-color:var(--t3);background:rgba(255,255,255,0.02);}
.ri-del{background:none;border:none;color:var(--t4);font-size:10px;cursor:pointer;padding:2px 4px;border-radius:4px;flex-shrink:0;margin-top:2px;transition:color .15s;}
.ri-del:hover{color:var(--red);}
.ri-add{background:none;border:1px dashed var(--t4);border-radius:var(--rxs);color:var(--t3);font-size:11px;padding:5px 12px;cursor:pointer;margin-top:8px;font-family:inherit;transition:all .15s;width:100%;}
.ri-add:hover{border-color:var(--t2);color:var(--t2);}
.routine-title[contenteditable]{outline:none;}
.routine-title[contenteditable]:focus{border-bottom:1px solid var(--t3);}
`;
h = h.replace('</style>', editCss + '</style>');

fs.writeFileSync('app.html', h);
console.log('Done');
