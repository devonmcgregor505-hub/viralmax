const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Remove ALL copies of tickAllSection
html = html.replace(/function tickAllSection[\s\S]*?\n\}/g, '');

// Add one clean version before </script>
const FN = `function tickAllSection(key,e){
  if(e)e.stopPropagation();
  var allItems=window._allChecklistItems||[];
  var indices=[];var inSec=false;
  for(var i=0;i<allItems.length;i++){
    if(allItems[i].type==='section'){inSec=(allItems[i].key===key);continue;}
    if(inSec)indices.push(i);
  }
  var allDone=indices.length>0&&indices.every(function(i){return checked.has(i);});
  indices.forEach(function(i){allDone?checked.delete(i):checked.add(i);});
  var n=new Date(),dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
  localStorage.setItem('ascend_checked_date',dk);
  renderChecklist();maybeSaveScore();pushToCloud();
}`;

// Also ensure section items have key when pushed
html = html.replace(
  `allItems.push({type:'section',label:`,
  `allItems.push({type:'section',key:section.key,label:`
);

html = html.replace('</script>', FN + '\n</script>');

var count = (html.match(/function tickAllSection/g)||[]).length;
console.log('tickAllSection count:', count);
if(count!==1){console.error('FAIL: '+count+' copies');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
