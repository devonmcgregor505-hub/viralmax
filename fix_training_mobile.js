const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const CSS = `
@media(max-width:600px){
  .exercise-row{flex-wrap:nowrap;gap:6px;align-items:center;}
  .exercise-name{font-size:13px;min-width:0;flex:1;}
  .exercise-weight{gap:3px;}
  .exercise-weight-label{display:none;}
  .exercise-weight-input{width:44px;font-size:16px;padding:3px 4px;}
  .exercise-weight-unit{font-size:10px;}
}`;

html = html.replace('</style>', CSS + '\n</style>');

fs.writeFileSync('app.html', html);
console.log('Done');
