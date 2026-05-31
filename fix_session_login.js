const fs = require('fs');
let login = fs.readFileSync('login.html', 'utf8');
login = login.replace(
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  window.location.href = '/app';`,
  `  localStorage.setItem('ascend_user_id', data.user.id);\n  localStorage.setItem('ascend_session', JSON.stringify(data.session));\n  window.location.href = '/app';`
);
fs.writeFileSync('login.html', login);
console.log('login.html done');
