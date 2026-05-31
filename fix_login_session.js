const fs = require('fs');
let html = fs.readFileSync('login.html', 'utf8');

// After signIn success, save session to localStorage manually
html = html.replace(
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  window.location.href = '/app';`,
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  localStorage.setItem('ascend_session', JSON.stringify(data.session));\n  window.location.href = '/app';`
);

// After Google OAuth, handle the callback in app.html instead
fs.writeFileSync('login.html', html);

// Now fix app.html to also check for saved session token
let app = fs.readFileSync('app.html', 'utf8');
app = app.replace(
  `    sb.auth.getSession().then(function(res){\n      var user = res.data.session?.user;\n      if(user){\n        localStorage.setItem('ascend_user_id', user.id);\n        console.log('[auth] session found:', user.id);\n      } else {\n        console.log('[auth] no session');\n      }\n    });`,
  `    // Try restoring session from saved token
    var savedSession = localStorage.getItem('ascend_session');
    if(savedSession){
      try{
        var parsed = JSON.parse(savedSession);
        sb.auth.setSession({access_token: parsed.access_token, refresh_token: parsed.refresh_token}).then(function(res){
          var user = res.data.session?.user;
          if(user){
            localStorage.setItem('ascend_user_id', user.id);
            console.log('[auth] session restored:', user.id);
            pushToCloud();
          }
        });
      }catch(e){ console.log('[auth] session restore failed', e); }
    }
    sb.auth.getSession().then(function(res){
      var user = res.data.session?.user;
      if(user){
        localStorage.setItem('ascend_user_id', user.id);
        localStorage.setItem('ascend_session', JSON.stringify(res.data.session));
        console.log('[auth] session found:', user.id);
      } else {
        console.log('[auth] no session');
      }
    });`
);

fs.writeFileSync('app.html', html);
console.log('Done');
