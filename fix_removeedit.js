const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Remove contenteditable from block title and step items, restore simple onclick on whole item
h = h.replace(
  `    const isDone=checked.has(i);
    const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map((s,si)=>\`<div class="cl-step" contenteditable="true" onclick="event.stopPropagation()" onblur="saveClStep(\${i},\${si},this.innerText)">— \${s}</div>\`).join('')}</div>\`:'';
    return \`<div class="check-item">
      <div class="check-box\${isDone?' done':''}" onclick="toggleCheck(\${i})"></div>
      <div class="check-text" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px;">
        <div class="check-name\${isDone?' done':''}" contenteditable="true" onclick="event.stopPropagation()" onblur="saveClLabel(\${i},this.innerText)">\${item.label}</div>
        \${stepsHtml}
      </div>
    </div>\`;`,
  `    const isDone=checked.has(i);
    const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map(s=>\`<div class="cl-step">— \${s}</div>\`).join('')}</div>\`:'';
    return \`<div class="check-item" onclick="toggleCheck(\${i})">
      <div class="check-box\${isDone?' done':''}"></div>
      <div class="check-text" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px;">
        <div class="check-name\${isDone?' done':''}">\${item.label}</div>
        \${stepsHtml}
      </div>
    </div>\`;`
);

// 2. Fix day badge to use user's local timezone (browser Date() is already local)
h = h.replace(
  `  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const db=document.getElementById('dayBadge');
  if(db)db.textContent=days[new Date().getDay()];`,
  `  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const db=document.getElementById('dayBadge');
  if(db)db.textContent=days[new Date().getDay()];
  // Update day every minute in case app is left open overnight
  if(!window._dayTimer) window._dayTimer=setInterval(()=>{
    const d=document.getElementById('dayBadge');
    if(d)d.textContent=days[new Date().getDay()];
  },60000);`
);

fs.writeFileSync('app.html', h);
console.log('Done');
