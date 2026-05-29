const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Find and replace the exact template line by line
h = h.replace(
  `        <span class="routine-title">\${item.title}</span>`,
  `        <span class="routine-title" contenteditable="true" onblur="saveRoutineTitle(containerId,idx,this.innerText)">\${item.title}</span>`
);

// Replace routine-body ul with editable version
h = h.replace(
  `        <ul>\${item.items.map(it=>\`<li>\${it}</li>\`).join('')}</ul>`,
  `        <ul id="rul-\${containerId}-\${idx}">\${item.items.map((it,li)=>\`<li><span contenteditable="true" onblur="saveRoutineItem(containerId,idx,li,this.innerText)">\${it}</span><button class="ri-del" onclick="deleteRoutineItem(containerId,\${idx},\${li})">✕</button></li>\`).join('')}</ul>
        <button class="ri-add" onclick="addRoutineItem(containerId,\${idx})">+ Add step</button>`
);

// Make sure _routineData init and save functions exist
if(!h.includes('saveRoutineTitle')){
  h = h.replace(
    `function toggleRoutine(cid,idx){`,
    `function saveRoutineTitle(cid,idx,val){
  if(!window._routineData?.[cid]?.[idx])return;
  window._routineData[cid][idx].title=val.trim();
  persistRoutine(cid);
}
function saveRoutineItem(cid,idx,li,val){
  if(!window._routineData?.[cid]?.[idx]?.items)return;
  window._routineData[cid][idx].items[li]=val.trim();
  persistRoutine(cid);
}
function deleteRoutineItem(cid,idx,li){
  if(!window._routineData?.[cid]?.[idx]?.items)return;
  window._routineData[cid][idx].items.splice(li,1);
  persistRoutine(cid);
  renderRoutine(cid,window._routineData[cid]);
}
function addRoutineItem(cid,idx){
  if(!window._routineData?.[cid]?.[idx])return;
  window._routineData[cid][idx].items.push('Tap to edit');
  persistRoutine(cid);
  renderRoutine(cid,window._routineData[cid]);
  setTimeout(()=>{
    const ul=document.getElementById('rul-'+cid+'-'+idx);
    const spans=ul?.querySelectorAll('li span[contenteditable]');
    if(spans?.length) spans[spans.length-1].focus();
  },50);
}
function persistRoutine(cid){
  const saved=JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const keyMap={morningBlocks:'morning',nightBlocks:'night',nutritionBlocks:'nutrition'};
  const key=keyMap[cid];
  if(key){saved[key]=window._routineData[cid];localStorage.setItem('ascend_profile',JSON.stringify(saved));}
}
function toggleRoutine(cid,idx){`
  );
}

// Init _routineData in renderRoutine
if(!h.includes('_routineData')){
  h = h.replace(
    `function renderRoutine(containerId, data){
  const el=document.getElementById(containerId);
  if(!el)return;`,
    `function renderRoutine(containerId, data){
  const el=document.getElementById(containerId);
  if(!el)return;
  if(!window._routineData) window._routineData={};
  if(!window._routineData[containerId]) window._routineData[containerId]=JSON.parse(JSON.stringify(data));
  data=window._routineData[containerId];`
  );
}

fs.writeFileSync('app.html', h);
console.log('contenteditable in template:', h.includes('contenteditable="true" onblur="saveRoutineTitle'));
console.log('ri-add in template:', h.includes('ri-add" onclick="addRoutineItem'));
console.log('saveRoutineTitle fn:', h.includes('function saveRoutineTitle'));
