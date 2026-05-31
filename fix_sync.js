const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const SYNC_JS = `
// ── CLOUD SYNC ──
var SYNC_KEYS = [
  'ascend_profile','ascend_day_plans','ascend_meal_plans','ascend_macros',
  'ascend_meals','ascend_workouts','ascend_bodyweight','ascend_lmg',
  'ascend_checkins','ascend_score_history','ascend_settings','ascend_notifications',
  'ascend_notif_seen','ascend_macros'
];

function getSyncPayload(){
  var obj = {};
  SYNC_KEYS.forEach(function(k){
    var v = localStorage.getItem(k);
    if(v) obj[k] = v;
  });
  return obj;
}

function applySyncPayload(obj){
  if(!obj) return;
  SYNC_KEYS.forEach(function(k){
    if(obj[k] !== undefined && obj[k] !== null){
      localStorage.setItem(k, obj[k]);
    }
  });
}

async function pushToCloud(){
  var userId = localStorage.getItem('ascend_user_id');
  if(!userId) return;
  var payload = getSyncPayload();
  fetch('/api/profile/save', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-user-id':userId},
    body:JSON.stringify({profile: payload})
  }).catch(function(){});
}

async function pullFromCloud(){
  var userId = localStorage.getItem('ascend_user_id');
  if(!userId) return false;
  try{
    var res = await fetch('/api/credits', {headers:{'x-user-id':userId}});
    var data = await res.json();
    if(data.profile && typeof data.profile === 'object'){
      applySyncPayload(data.profile);
      return true;
    }
  }catch(e){}
  return false;
}

// Auto-push every 30 seconds if logged in
setInterval(function(){
  if(localStorage.getItem('ascend_user_id')) pushToCloud();
}, 30000);

// Push on page hide (tab close / switch)
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'hidden') pushToCloud();
});
`;

html = html.replace('</script>', SYNC_JS + '\n</script>');

// On boot — pull from cloud before initApp
html = html.replace(
  `  const saved=localStorage.getItem('ascend_profile');\n  if(saved){\n    profile=JSON.parse(saved);\n    document.getElementById('onboardingOverlay').style.display='none';\n    initApp();\n    var lastPage=localStorage.getItem('ascend_page');\n    if(lastPage && lastPage!=='checklist') showPage(lastPage, null);\n  } else {`,
  `  pullFromCloud().then(function(synced){
    var saved=localStorage.getItem('ascend_profile');
    if(saved){
      profile=JSON.parse(saved);
      document.getElementById('onboardingOverlay').style.display='none';
      initApp();
      var lastPage=localStorage.getItem('ascend_page');
      if(lastPage && lastPage!=='checklist') showPage(lastPage, null);
      if(synced) console.log('[sync] pulled from cloud');
    } else {`
);

// Close the extra brace from the promise
html = html.replace(
  `    renderOB();\n  }\n});`,
  `    renderOB();\n    }\n  });\n});`
);

// Push after launchApp saves profile
html = html.replace(
  `function launchApp(){\n  document.getElementById('onboardingOverlay').style.display='none';\n  localStorage.setItem('ascend_profile',JSON.stringify(profile));\n  initApp();\n}`,
  `function launchApp(){\n  document.getElementById('onboardingOverlay').style.display='none';\n  localStorage.setItem('ascend_profile',JSON.stringify(profile));\n  initApp();\n  pushToCloud();\n}`
);

if(!html.includes('pushToCloud')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
