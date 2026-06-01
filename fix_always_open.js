const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Always keep sections open
html = html.replace(
  `  if(window._sectionCollapsed===undefined){\n    window._sectionCollapsed = {morning: !isMorning, night: isMorning};\n  }`,
  `  window._sectionCollapsed = {morning:false,night:false,day:false};`
);

// 2. Remove arrow from section header, add tick-all button
html = html.replace(
  `onclick="toggleSection('\${section.key}')">`,
  `style="cursor:default;">`
);
html = html.replace(
  `<span class="cl-section-arrow\${collapsed?' collapsed':''}\" id="arrow-\${section.key}">▼</span>`,
  `<button class="cl-tick-all" id="tickall-\${section.key}" onclick="tickAllSection('\${section.key}',event)">Tick all</button>`
);

// 3. Always show body open
html = html.replace(
  `"cl-section-body \${sectionBodyClass}\${collapsed?' collapsed':''}\" id="body-\${section.key}" style="max-height:\${collapsed?'0':'2000px'}; padding-bottom: \${collapsed?'0':'10px'};"`,
  `"cl-section-body \${sectionBodyClass}" id="body-\${section.key}" style="padding-bottom:10px;"`
);

// 4. CSS
const CSS = [
  '.cl-tick-all{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--t2);font-size:11px;font-weight:700;padding:5px 12px;cursor:pointer;font-family:inherit;transition:all .15s;}',
  '.cl-tick-all:hover{border-color:rgba(255,200,0,0.3);color:var(--y);}',
  '.cl-tick-all.done{background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.25);color:#22c55e;}',
  '.cl-section-arrow{display:none;}',
  '.cl-section-body.collapsed{max-height:none!important;}'
].join('\n');
html = html.replace('</style>', CSS + '\n</style>');

// 5. tickAllSection function
const FN = [
  'function tickAllSection(key,e){',
  '  if(e)e.stopPropagation();',
  '  var allItems=window._allChecklistItems||[];',
  '  var indices=[];var inSec=false;',
  '  for(var i=0;i<allItems.length;i++){',
  '    if(allItems[i].type==="section"){inSec=allItems[i].key===key;continue;}',
  '    if(inSec&&allItems[i].type!=="section")indices.push(i);',
  '  }',
  '  var allDone=indices.length>0&&indices.every(function(i){return checked.has(i);});',
  '  indices.forEach(function(i){allDone?checked.delete(i):checked.add(i);});',
  '  var n=new Date(),dk=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");',
  '  localStorage.setItem("ascend_checked_today",JSON.stringify([...checked]));',
  '  localStorage.setItem("ascend_checked_date",dk);',
  '  renderChecklist();maybeSaveScore();pushToCloud();',
  '}'
].join('\n');
html = html.replace('</script>', FN + '\n</script>');

if(!html.includes('tickAllSection')){console.error('FAIL');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
