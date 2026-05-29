const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Remove onclick from routine-head and chevron
h = h.replace(
  `        <div class="routine-head" onclick="toggleRoutine('\${containerId}',\${idx})">`,
  `        <div class="routine-head">`
);

// 2. Remove chevron arrow entirely
h = h.replace(
  `        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>
        <span class="routine-chevron">▼</span>`,
  `        <span class="routine-tag tag-\${item.tag}">\${item.tagLabel}</span>`
);

// 3. Make routine-body always visible
h = h.replace(
  `.routine-body{display:none;padding:0 16px 14px 72px;}`,
  `.routine-body{display:block;padding:0 16px 14px 72px;}`
);

// 4. Remove routine-item.open rule since it's no longer needed
h = h.replace(
  `.routine-item.open .routine-body{display:block;}`,
  ``
);

// 5. Remove chevron CSS
h = h.replace(
  `.routine-chevron{color:var(--t3);font-size:12px;transition:transform .2s;}
.routine-item.open .routine-chevron{transform:rotate(180deg);}`,
  ``
);

// 6. Remove the note still showing on face & skin block in MORNING data
h = h.replace(
  `4 minutes. Consistency beats expensive products every time.`,
  ``
);

fs.writeFileSync('app.html', h);
console.log('Done');
