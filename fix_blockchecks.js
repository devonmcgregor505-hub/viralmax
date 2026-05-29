const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

h = h.replace(
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
}`,
  `function renderChecklist(){
  const el=document.getElementById('bigChecklist');
  if(!el)return;
  const morning=window._routineData?.morningBlocks||MORNING;
  const night=window._routineData?.nightBlocks||NIGHT;
  const allItems=[];
  // Morning — one checkbox per block
  allItems.push({type:'section',label:'☀️  Morning'});
  morning.forEach(block=>{
    allItems.push({type:'task',label:block.title+(block.time?' · '+block.time:''),steps:block.items});
  });
  // Day habits
  allItems.push({type:'section',label:'⚡  During the day'});
  allItems.push({type:'task',label:'Drink 3L water'});
  allItems.push({type:'task',label:'Training or movement'});
  // Night — one checkbox per block
  allItems.push({type:'section',label:'🌙  Night'});
  night.forEach(block=>{
    allItems.push({type:'task',label:block.title+(block.time?' · '+block.time:''),steps:block.items});
  });
  window._allChecklistItems=allItems;
  el.innerHTML=allItems.map((item,i)=>{
    if(item.type==='section') return \`<div class="cl-section">\${item.label}</div>\`;
    const isDone=checked.has(i);
    const stepsHtml=item.steps?.length?\`<div class="cl-steps\${isDone?' cl-steps-done':''}">\${item.steps.map(s=>\`<div class="cl-step">— \${s}</div>\`).join('')}</div>\`:'';
    return \`<div class="check-item" onclick="toggleCheck(\${i})">
      <div class="check-box\${isDone?' done':''}"></div>
      <div class="check-text">
        <div class="check-name\${isDone?' done':''}">\${item.label}</div>
        \${stepsHtml}
      </div>
    </div>\`;
  }).join('');
  const tasks=allItems.filter(it=>it.type==='task');
  const done=[...checked].filter(i=>allItems[i]?.type==='task').length;
  const score=tasks.length?Math.round(done/tasks.length*100):0;
  const sn=document.getElementById('scoreNum');
  if(sn)sn.textContent=score;
}`
);

// Add CSS for steps preview
const css = `
.cl-steps{margin-top:5px;padding-left:4px;}
.cl-step{font-size:11px;color:var(--t3);padding:2px 0;line-height:1.5;}
.cl-steps-done .cl-step{text-decoration:line-through;opacity:0.4;}
`;
h = h.replace('</style>', css + '</style>');

fs.writeFileSync('app.html', h);
console.log('Done');
