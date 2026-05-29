const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Update renderRoutine to include editable items and add/delete buttons
h = h.replace(
  `  el.innerHTML=d.map((item,idx)=>\`
    <div class="routine-item" id="ri-\${containerId}-\${idx}">
      <div class="routine-head">
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
    </div>\`).join('');`,
  `  el.innerHTML=d.map((item,idx)=>\`
    <div class="routine-item" id="ri-\${containerId}-\${idx}">
      <div class="routine-head">
        \${item.time?\`<span class="routine-time">\${item.time}</span>\`:''}
        <span class="routine-title" contenteditable="true" onblur="saveRoutineTitle('\${containerId}',\${idx},this.innerText)">\${item.title}</span>
        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
      </div>
      <div class="routine-body">
        <ul id="rul-\${containerId}-\${idx}">\${item.items.map((it,li)=>\`
          <li>
            <span contenteditable="true" onblur="saveRoutineItem('\${containerId}',\${idx},\${li},this.innerText)">\${it}</span>
            <button class="ri-del" onclick="deleteRoutineItem('\${containerId}',\${idx},\${li})">✕</button>
          </li>\`).join('')}
        </ul>
        <button class="ri-add" onclick="addRoutineItem('\${containerId}',\${idx})">+ Add step</button>
      </div>
    </div>\`).join('');`
);

fs.writeFileSync('app.html', h);
console.log('Done - checking for ri-add...');
console.log(h.includes('ri-add') ? 'ri-add found' : 'MISSING ri-add');
console.log(h.includes('contenteditable') ? 'contenteditable found' : 'MISSING contenteditable');
