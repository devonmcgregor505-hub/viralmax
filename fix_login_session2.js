const fs = require('fs');

// Fix login.html — save full session after email login
let login = fs.readFileSync('login.html', 'utf8');
login = login.replace(
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  window.location.href = '/app';`,
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  localStorage.setItem('ascend_session', JSON.stringify(data.session));\n  window.location.href = '/app';`
);
fs.writeFileSync('login.html', login);

// Fix app.html — restore session from saved token
let app = fs.readFileSync('app.html', 'utf8');
app = app.replace(
  `    sb.auth.getSession().then(function(res){\n      var user = res.data.session?.user;\n      if(user){\n        localStorage.setItem('ascend_user_id', user.id);\n        console.log('[auth] session found:', user.id);\n      } else {\n        console.log('[auth] no session');\n      }\n    });`,
  `    var _savedSess = localStorage.getItem('ascend_session');
    if(_savedSess){
      try{
        var _sp = JSON.parse(_savedSess);
        sb.auth.setSession({access_token:_sp.access_token,refresh_token:_sp.refresh_token}).then(function(r){
          if(r.data.session?.user){
            localStorage.setItem('ascend_user_id', r.data.session.user.id);
            localStorage.setItem('ascend_session', JSON.stringify(r.data.session));
            console.log('[auth] session restored:', r.data.session.user.id);
          }
        });
      }catch(e){}
    }
    sb.auth.getSession().then(function(res){
      var user = res.data.session?.user;
      if(user){
        localStorage.setItem('ascend_user_id', user.id);
        localStorage.setItem('ascend_session', JSON.stringify(res.data.session));
        console.log('[auth] session found:', user.id);
      }
    });`
);
fs.writeFileSync('app.html', app);
console.log('Done');
