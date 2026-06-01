const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Replace the entire toggleCheck + sync with Supabase-first approach
html = html.replace(
  /function toggleCheck\(i\)\{[\s\S]*?\}/,
  `function toggleCheck(i){
  checked.has(i)?checked.delete(i):checked.add(i);
  var n=new Date(),dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
  localStorage.setItem('ascend_checked_date',dk);
  renderChecklist();
  maybeSaveScore();
  saveChecklistToServer(dk);
}`
);

// Add server sync functions
const SYNC_FNS = `
// Save checked state to Supabase directly
async function saveChecklistToServer(date){
  var userId=localStorage.getItem('ascend_user_id'); if(!userId)return;
  fetch('/api/checklist/save',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-user-id':userId},
    body:JSON.stringify({checked:[...checked],date:date})
  }).catch(function(){});
  // Also push full profile blob
  pushToCloud();
}

// Load today's checked state from Supabase
async function loadChecklistFromServer(){
  var userId=localStorage.getItem('ascend_user_id'); if(!userId)return false;
  var n=new Date(),dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  try{
    var res=await fetch('/api/checklist/history',{headers:{'x-user-id':userId}});
    var data=await res.json();
    if(data.logs&&data.logs.length){
      var todayLog=data.logs.find(function(l){return l.date===dk;});
      if(todayLog&&todayLog.checked){
        checked=new Set(todayLog.checked);
        localStorage.setItem('ascend_checked_today',JSON.stringify([...checked]));
        localStorage.setItem('ascend_checked_date',dk);
        return true;
      }
    }
  }catch(e){}
  return false;
}
`;
html = html.replace('</script>', SYNC_FNS + '\n</script>');

// On app boot — load from server first
html = html.replace(
  `function initApp(){`,
  `function initApp(){
  // Load today's checklist from Supabase
  loadChecklistFromServer().then(function(loaded){
    if(loaded) renderChecklist();
  });`
);

// On visibility change — reload from server
html = html.replace(
  `  } else {\n    // Pull latest when tab becomes visible\n    pullFromCloud().then(function(ok){\n      if(ok){ renderChecklist(); renderMacros(); renderMealsSection(); renderTrainingSection(); renderProgressPhotos(); }\n    });\n  }`,
  `  } else {
    // Pull latest checklist from server when tab becomes visible
    loadChecklistFromServer().then(function(loaded){
      if(loaded) renderChecklist();
    });
    pullFromCloud().then(function(ok){
      if(ok){ renderMacros(); renderMealsSection(); renderTrainingSection(); renderProgressPhotos(); }
    });
  }`
);

if(!html.includes('saveChecklistToServer')){console.error('FAIL');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
