const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Replace tickAllSection with a version that matches by label/emoji
html = html.replace(
  /function tickAllSection\(key,e\)\{[\s\S]*?\}/,
  `function tickAllSection(key,e){
  if(e)e.stopPropagation();
  var allItems=window._allChecklistItems||[];
  var indices=[];var inSec=false;
  for(var i=0;i<allItems.length;i++){
    if(allItems[i].type==='section'){
      inSec = (allItems[i].key===key || allItems[i].sectionKey===key);
      continue;
    }
    if(inSec) indices.push(i);
  }
  var allDone=indices.length>0&&indices.every(function(i){return checked.has(i);});
  indices.forEach(function(i){allDone?checked.delete(i):checked.add(i);});
  var n=new Date(),dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
  localStorage.setItem('ascend_checked_date',dk);
  renderChecklist();maybeSaveScore();pushToCloud();
}`
);

// Make sure section items have key saved when pushed to allItems
// Find where section items are pushed and add key
html = html.replace(
  `allItems.push({type:'section',label:`,
  `allItems.push({type:'section',key:section.key,sectionKey:section.key,label:`
);

fs.writeFileSync('app.html', html);
console.log('Done');
