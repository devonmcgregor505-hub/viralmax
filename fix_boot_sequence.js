const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Replace the entire DOMContentLoaded block
html = html.replace(
  `window.addEventListener('DOMContentLoaded',()=>{
  pullFromCloud().then(function(synced){
    var saved=localStorage.getItem('ascend_profile');
    if(saved){
      profile=JSON.parse(saved);
      document.getElementById('onboardingOverlay').style.display='none';
      initApp();
      var lastPage=localStorage.getItem('ascend_page');
      if(lastPage && lastPage!=='checklist') showPage(lastPage, null);
      if(synced) console.log('[sync] pulled from cloud');
    } else {
    renderOB();
    }
  });
});`,
  `window.addEventListener('DOMContentLoaded',()=>{
  // Wait for Supabase session before booting
  function bootApp(){
    var saved=localStorage.getItem('ascend_profile');
    if(saved){
      profile=JSON.parse(saved);
      document.getElementById('onboardingOverlay').style.display='none';
      initApp();
      var lastPage=localStorage.getItem('ascend_page');
      if(lastPage && lastPage!=='checklist') showPage(lastPage,null);
    } else {
      renderOB();
    }
  }
  // Give Supabase 2s to set session, then boot regardless
  var booted=false;
  function tryBoot(fromCloud){
    if(booted)return; booted=true;
    if(fromCloud){
      var saved=localStorage.getItem('ascend_profile');
      if(saved){
        profile=JSON.parse(saved);
        document.getElementById('onboardingOverlay').style.display='none';
        initApp();
        var lastPage=localStorage.getItem('ascend_page');
        if(lastPage && lastPage!=='checklist') showPage(lastPage,null);
        return;
      }
    }
    bootApp();
  }
  // If already have user id, pull immediately
  var uid=localStorage.getItem('ascend_user_id');
  if(uid){
    pullFromCloud().then(function(ok){ tryBoot(ok); });
  } else {
    // Wait up to 3s for auth
    setTimeout(function(){ tryBoot(false); }, 3000);
  }
});`
);

// Fix SIGNED_IN handler to always boot if not yet booted
html = html.replace(
  `        if(event === 'SIGNED_IN') pullFromCloud().then(function(synced){\n          if(synced){ console.log('[sync] loaded cloud data'); initApp(); }\n        });`,
  `        if(event === 'SIGNED_IN'){
          pullFromCloud().then(function(synced){
            console.log('[sync] SIGNED_IN pull:', synced);
            var saved=localStorage.getItem('ascend_profile');
            if(saved && synced){
              profile=JSON.parse(saved);
              document.getElementById('onboardingOverlay').style.display='none';
              initApp();
              var lp=localStorage.getItem('ascend_page');
              if(lp&&lp!=='checklist') showPage(lp,null);
            }
          });
        }`
);

if(!html.includes('tryBoot')){console.error('FAIL');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
