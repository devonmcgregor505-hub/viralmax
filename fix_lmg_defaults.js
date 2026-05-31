const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  /var DEFAULT_LMG = \[[\s\S]*?\];/,
  `var DEFAULT_LMG = [
  {id:1, text:'Hair', done:false, notes:'', images:[]},
  {id:2, text:'Skin', done:false, notes:'', images:[]},
  {id:3, text:'Bloating', done:false, notes:'', images:[]},
  {id:4, text:'Teeth', done:false, notes:'', images:[]},
  {id:5, text:'Eyebrows', done:false, notes:'', images:[]},
  {id:6, text:'Posture', done:false, notes:'', images:[]},
  {id:7, text:'Physique', done:false, notes:'', images:[]},
  {id:8, text:'Smell', done:false, notes:'', images:[]},
  {id:9, text:'Voice', done:false, notes:'', images:[]},
];`
);

if(!html.includes("text:'Hair'")) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
