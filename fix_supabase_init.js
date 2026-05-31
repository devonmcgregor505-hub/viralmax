const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const SB_INIT = `
// ── SUPABASE SESSION ──
(function initSupabaseSession(){
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(function(mod){
    var sb = mod.createClient(
      'https://asvpzsnncbxkpycsgfnj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdnB6c25uY2J4a3B5Y3NnZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTksImV4cCI6MjA5MTM2OTA5OX0.S1poy30uv9R6_xG8d-wi27eIgeXbvlVIaLbgAljM4j0'
    );
    window._sb = sb;
    sb.auth.getSession().then(function(res){
      var user = res.data.session?.user;
      if(user){
        localStorage.setItem('ascend_user_id', user.id);
        console.log('[auth] session found:', user.id);
      } else {
        console.log('[auth] no session');
      }
    });
    // Listen for auth changes (e.g. OAuth redirect)
    sb.auth.onAuthStateChange(function(event, session){
      if(session?.user){
        localStorage.setItem('ascend_user_id', session.user.id);
        console.log('[auth] state change:', event, session.user.id);
        // Pull cloud data if just signed in
        if(event === 'SIGNED_IN') pullFromCloud().then(function(synced){
          if(synced){ console.log('[sync] loaded cloud data'); initApp(); }
        });
      } else {
        localStorage.removeItem('ascend_user_id');
      }
    });
  });
})();
`;

html = html.replace('// ── CLOUD SYNC ──', SB_INIT + '\n// ── CLOUD SYNC ──');

// Also fix signOut to use window._sb
html = html.replace(
  `function signOut(){ document.getElementById('avatarDropdown').classList.remove('open'); sb && sb.auth.signOut(); localStorage.removeItem('ascend_user_id'); window.location.href='/login'; }`,
  `function signOut(){ document.getElementById('avatarDropdown').classList.remove('open'); if(window._sb) window._sb.auth.signOut(); localStorage.removeItem('ascend_user_id'); window.location.href='/login'; }`
);

if(!html.includes('initSupabaseSession')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
