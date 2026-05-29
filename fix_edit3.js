const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

const fns = `
function saveRoutineTitle(cid,idx,val){
  if(!window._routineData) window._routineData={};
  if(!window._routineData[cid]?.[idx]) return;
  window._routineData[cid][idx].title=val.trim();
  persistRoutine(cid);
}
function saveRoutineItem(cid,idx,li,val){
  if(!window._routineData?.[cid]?.[idx]?.items) return;
  window._routineData[cid][idx].items[li]=val.trim();
  persistRoutine(cid);
}
function deleteRoutineItem(cid,idx,li){
  if(!window._routineData?.[cid]?.[idx]?.items) return;
  window._routineData[cid][idx].items.splice(li,1);
  persistRoutine(cid);
  renderRoutine(cid,window._routineData[cid]);
}
function addRoutineItem(cid,idx){
  if(!window._routineData?.[cid]?.[idx]) return;
  window._routineData[cid][idx].items.push('Tap to edit');
  persistRoutine(cid);
  renderRoutine(cid,window._routineData[cid]);
  setTimeout(()=>{
    const ul=document.getElementById('rul-'+cid+'-'+idx);
    const spans=ul?.querySelectorAll('li span[contenteditable]');
    if(spans?.length) spans[spans.length-1].focus();
  },50);
}
function persistRoutine(cid){
  const saved=JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const keyMap={morningBlocks:'morning',nightBlocks:'night',nutritionBlocks:'nutrition'};
  const key=keyMap[cid];
  if(key){saved[key]=window._routineData[cid];localStorage.setItem('ascend_profile',JSON.stringify(saved));}
}
`;

h = h.replace('</script>', fns + '</script>');

fs.writeFileSync('app.html', h);
console.log('saveRoutineTitle fn:', h.includes('function saveRoutineTitle'));
console.log('persistRoutine fn:', h.includes('function persistRoutine'));
