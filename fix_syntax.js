const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(
  `list.innerHTML = '<div class="notif-empty">You\\'re all caught up \\u2713</div>';`,
  `list.innerHTML = '<div class="notif-empty">All caught up \\u2713</div>';`
);
fs.writeFileSync('app.html', html);
console.log('Fixed');
