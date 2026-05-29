const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Move + Add step button into the header, next to the title
h = h.replace(
  `        <span class="routine-title" contenteditable="true" onblur="saveRoutineTitle(containerId,idx,this.innerText)">\${item.title}</span>
        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
      </div>
      <div class="routine-body">
        <ul id="rul-\${containerId}-\${idx}">\${item.items.map((it,li)=>\`<li><span contenteditable="true" onblur="saveRoutineItem(containerId,idx,li,this.innerText)">\${it}</span><button class="ri-del" onclick="deleteRoutineItem(containerId,\${idx},\${li})">✕</button></li>\`).join('')}</ul>
        <button class="ri-add" onclick="addRoutineItem(containerId,\${idx})">+ Add step</button>`,
  `        <span class="routine-title" contenteditable="true" onblur="saveRoutineTitle(containerId,idx,this.innerText)">\${item.title}</span>
        <button class="ri-add-inline" onclick="addRoutineItem(containerId,\${idx})">+ Add step</button>
        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
      </div>
      <div class="routine-body">
        <ul id="rul-\${containerId}-\${idx}">\${item.items.map((it,li)=>\`<li><span contenteditable="true" onblur="saveRoutineItem(containerId,idx,li,this.innerText)">\${it}</span><button class="ri-del" onclick="deleteRoutineItem(containerId,\${idx},\${li})">✕</button></li>\`).join('')}</ul>`
);

// 2. Add CSS for inline add button
const css = `
.ri-add-inline{background:none;border:1px dashed var(--t4);border-radius:var(--rxs);color:var(--t3);font-size:11px;padding:3px 10px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;flex-shrink:0;}
.ri-add-inline:hover{border-color:var(--y);color:var(--y);}
`;
h = h.replace('</style>', css + '</style>');

// 3. Fix addRoutineItem — init _routineData if missing
h = h.replace(
  `function addRoutineItem(cid,idx){
  if(!window._routineData?.[cid]?.[idx]) return;`,
  `function addRoutineItem(cid,idx){
  if(!window._routineData) window._routineData={};
  if(!window._routineData[cid]) return;
  if(!window._routineData[cid][idx]) return;`
);

fs.writeFileSync('app.html', h);
console.log('ri-add-inline:', h.includes('ri-add-inline'));
