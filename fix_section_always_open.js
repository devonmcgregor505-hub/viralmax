const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Always open — remove collapsed logic from init
html = html.replace(
  `  if(window._sectionCollapsed===undefined){\n    window._sectionCollapsed = {morning: !isMorning, night: isMorning};\n  }`,
  `  window._sectionCollapsed = {morning: false, night: false, day: false};`
);

// 2. Replace section header — remove onclick collapse, add "tick all" button instead
html = html.replace(
  `    const sectionHtml = \`<div class="cl-section-header \${sectionColorClass}" onclick="toggleSection('\${section.key}')">\n      <span class="cl-section-label">\${section.label} <span class="count">\${section.items.length}</span></span>\n      <span class="cl-section-arrow\${collapsed?' collapsed':''}\" id="arrow-\${section.key}">▼</span>\n    </div>`,
  `    const allDone = section.items.every((_,si)=>{ const globalIdx=allItems.findIndex(x=>x===section.items[si]); return checked.has(globalIdx); });
    const sectionHtml = \`<div class="cl-section-header \${sectionColorClass}" style="cursor:default;">
      <span class="cl-section-label">\${section.label} <span class="count">\${section.items.length}</span></span>
      <button class="cl-tick-all\${allDone?' done':''}" onclick="tickAllSection('\${section.key}',event)">\${allDone?'✓ Done':'Tick all'}</button>
    </div>\``
);

// 3. Always show body — remove collapsed class
html = html.replace(
  `    <div class="cl-section-body \${sectionBodyClass}\${collapsed?' collapsed':''}\" id="body-\${section.key}" style="max-height:\${collapsed?'0':'2000px'}; padding-bottom: \${collapsed?'0':'10px'};">`,
  `    <div class="cl-section-body \${sectionBodyClass}" id="body-\${section.key}" style="padding-bottom:10px;">`
);

// 4. Add tickAllSection function
const TICK_JS = `
function tickAllSection(key, e){
  e && e.stopPropagation();
  var sectionItems = window._allChecklistItems ? window._allChecklistItems.filter(function(x,i){ return x._sectionKey===key; }) : [];
  // Find indices of items in this section
  var allItems = window._allChecklistItems || [];
  var indices = [];
  var inSection = false;
  for(var i=0;i<allItems.length;i++){
    if(allItems[i].type==='section'){ inSection = allItems[i].key===key; continue; }
    if(inSection) indices.push(i);
  }
  var allDone = indices.every(function(i){ return checked.has(i); });
  indices.forEach(function(i){ allDone ? checked.delete(i) : checked.add(i); });
  var _n=new Date(),_dk=_n.getFullYear()+'-'+String(_n.getMonth()+1).padStart(2,'0')+'-'+String(_n.getDate()).padStart(2,'0');
  localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
  localStorage.setItem('ascend_checked_date',_dk);
  renderChecklist(); maybeSaveScore(); pushToCloud();
}
`;
html = html.replace('</script>', TICK_JS + '\n</script>');

// 5. Tag each item with its section key during render (add to allItems)
html = html.replace(
  `  allItems.push({type:'section',key:section.key,label:\`\${sectionEmoji[section.key]||''}`,
  `  allItems.push({type:'section',key:section.key,_sectionKey:section.key,label:\`\${sectionEmoji[section.key]||''}`
);

// 6. CSS for tick-all button
const CSS = `
.cl-tick-all{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--t2);font-size:11px;font-weight:700;padding:5px 12px;cursor:pointer;font-family:inherit;transition:all .15s;letter-spacing:.03em;}
.cl-tick-all:hover{border-color:rgba(255,200,0,0.3);color:var(--y);}
.cl-tick-all.done{background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.25);color:#22c55e;}
.cl-section-arrow{display:none;}`;

html = html.replace('</style>', CSS + '\n</style>');

if(!html.includes('tickAllSection')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
