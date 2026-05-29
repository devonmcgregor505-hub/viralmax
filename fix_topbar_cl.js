const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Add day + score to topbar right, before streak badge
h = h.replace(
  `  <div class="topbar-right">
    <div class="streak-badge" id="streakBadge">`,
  `  <div class="topbar-right">
    <div class="streak-badge" id="dayBadge" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);color:var(--t2);">Mon</div>
    <div class="streak-badge" id="scoreBadge" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);color:var(--text);">0%</div>
    <div class="streak-badge" id="streakBadge">`
);

// 2. Update renderChecklist to update day and score badges
h = h.replace(
  `  const sn=document.getElementById('scoreNum');
  if(sn)sn.textContent=score;
}`,
  `  const sn=document.getElementById('scoreNum');
  if(sn)sn.textContent=score;
  const sb=document.getElementById('scoreBadge');
  if(sb)sb.textContent=score+'%';
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const db=document.getElementById('dayBadge');
  if(db)db.textContent=days[new Date().getDay()];
}`
);

// 3. Make check-name (block title) editable and add underline
h = h.replace(
  `    const isDone=checked.has(i);
    const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map(s=>\`<div class="cl-step">— \${s}</div>\`).join('')}</div>\`:'';
    return \`<div class="check-item" onclick="toggleCheck(\${i})">
      <div class="check-box\${isDone?' done':''}"></div>
      <div class="check-text">
        <div class="check-name\${isDone?' done':''}">\${item.label}</div>
        \${stepsHtml}
      </div>
    </div>\`;`,
  `    const isDone=checked.has(i);
    const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map((s,si)=>\`<div class="cl-step" contenteditable="true" onclick="event.stopPropagation()" onblur="saveClStep(\${i},\${si},this.innerText)">— \${s}</div>\`).join('')}</div>\`:'';
    return \`<div class="check-item">
      <div class="check-box\${isDone?' done':''}" onclick="toggleCheck(\${i})"></div>
      <div class="check-text" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px;">
        <div class="check-name\${isDone?' done':''}" contenteditable="true" onclick="event.stopPropagation()" onblur="saveClLabel(\${i},this.innerText)">\${item.label}</div>
        \${stepsHtml}
      </div>
    </div>\`;`
);

// 4. Add saveClLabel and saveClStep functions
const fns = `
function saveClLabel(i,val){
  if(!window._allChecklistItems?.[i])return;
  window._allChecklistItems[i].label=val.trim();
  // Find which block this belongs to and save back
  syncChecklistToRoutine();
}
function saveClStep(i,si,val){
  if(!window._allChecklistItems?.[i]?.steps)return;
  window._allChecklistItems[i].steps[si]=val.replace(/^—\\s*/,'').trim();
  syncChecklistToRoutine();
}
function syncChecklistToRoutine(){
  // Rebuild morningBlocks and nightBlocks from _allChecklistItems
  if(!window._allChecklistItems||!window._routineData)return;
  const items=window._allChecklistItems;
  let section='';
  let mIdx=-1;let nIdx=-1;
  const morning=window._routineData.morningBlocks;
  const night=window._routineData.nightBlocks;
  items.forEach((item,i)=>{
    if(item.type==='section'){section=item.label;return;}
    if(item.type!=='task')return;
    if(section.includes('Morning')){
      mIdx++;
      if(morning[mIdx]){morning[mIdx].title=item.label.split('·')[0].trim();morning[mIdx].items=item.steps||[];}
    } else if(section.includes('Night')){
      nIdx++;
      if(night[nIdx]){night[nIdx].title=item.label.split('·')[0].trim();night[nIdx].items=item.steps||[];}
    }
  });
  persistRoutine('morningBlocks');
  persistRoutine('nightBlocks');
}
`;
h = h.replace('</script>', fns + '</script>');

// 5. Remove border-bottom from check-item since we moved it to check-text
h = h.replace(
  `.check-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.check-item:last-child{border-bottom:none;}`,
  `.check-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;}
.check-item:last-child .check-text{border-bottom:none!important;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
