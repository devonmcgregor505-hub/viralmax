const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix signOut to go to /login not /
html = html.replace(
  `function signOut(){ document.getElementById('avatarDropdown').classList.remove('open'); window.location.href='/login'; }`,
  `function signOut(){ document.getElementById('avatarDropdown').classList.remove('open'); sb && sb.auth.signOut(); localStorage.removeItem('ascend_user_id'); window.location.href='/login'; }`
);

fs.writeFileSync('app.html', html);
console.log('Done');
