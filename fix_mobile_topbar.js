const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const CSS = `
@media(max-width:600px){
  .topbar{padding:0 10px;gap:4px;}
  .tb-badge-day{padding:5px 8px;font-size:11px;}
  .tb-badge-score{padding:5px 8px;font-size:11px;}
  .streak-badge{padding:5px 8px;font-size:11px;gap:3px;}
  .notif-dropdown{right:-8px;left:auto;width:280px;margin:0;}
  .avatar-dropdown{right:-8px;left:auto;width:180px;margin:0;}
  .topbar-right{gap:4px;flex-shrink:0;}
}`;

html = html.replace('</style>', CSS + '\n</style>');
fs.writeFileSync('app.html', html);
console.log('Done');
