const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix: use actual string interpolation for containerId in the button onclick
h = h.replace(
  `        <button class="ri-add-inline" onclick="addRoutineItem(containerId,\${idx})">+ Add step</button>`,
  `        <button class="ri-add-inline" onclick="addRoutineItem('\${containerId}',\${idx})">+ Add step</button>`
);

// Also fix deleteRoutineItem call same issue
h = h.replace(
  `<button class="ri-del" onclick="deleteRoutineItem(containerId,\${idx},\${li})">✕</button>`,
  `<button class="ri-del" onclick="deleteRoutineItem('\${containerId}',\${idx},\${li})">✕</button>`
);

// Also fix saveRoutineTitle and saveRoutineItem same issue
h = h.replace(
  `onblur="saveRoutineTitle(containerId,idx,this.innerText)"`,
  `onblur="saveRoutineTitle('\${containerId}',\${idx},this.innerText)"`
);
h = h.replace(
  `onblur="saveRoutineItem(containerId,idx,li,this.innerText)"`,
  `onblur="saveRoutineItem('\${containerId}',\${idx},\${li},this.innerText)"`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('addRoutineItem fix:', h.includes(`addRoutineItem('\${containerId}',\${idx})`));
