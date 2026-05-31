const fs = require('fs');
let app = fs.readFileSync('app.html', 'utf8');
app = app.replace(
  `// ── SUPABASE SESSION ──`,
  `// ── SUPABASE SESSION ──
// restore session from login.html`
);
app = app.replace(
  `    sb.auth.getSession().then(function(res){
      var user = res.data.session?.user;
      if(user){
        localStorage.setItem('ascend_user_id', user.id);
        console.log('[auth] session found:', user.id);
      } else {
        console.log('[auth] no session');
      }
    });`,
  `    var _ss = localStorage.getItem('ascend_session');
    if(_ss){ try{ var _sp=JSON.parse(_ss); sb.auth.setSession({access_token:_sp.access_token,refresh_token:_sp.refresh_token}).catch(function(){}); }catch(e){} }
    sb.auth.getSession().then(function(res){
      var user = res.data.session?.user;
      if(user){
        localStorage.setItem('ascend_user_id', user.id);
        localStorage.setItem('ascend_session', JSON.stringify(res.data.session));
        console.log('[auth] session found:', user.id);
        pullFromCloud().then(function(ok){ if(ok) console.log('[sync] cloud data loaded'); });
      } else {
        console.log('[auth] no session');
      }
    });`
);
fs.writeFileSync('app.html', app);
console.log('app.html done');
