const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `  allItems.push({type:'section',label:'⚡  During the day'});`,
  `  allItems.push({type:'section',key:'day',label:'⚡  During the day'});`
);
html = html.replace(
  `  allItems.push({type:'section',label:'🌙  Night'});`,
  `  allItems.push({type:'section',key:'night',label:'🌙  Night'});`
);

var count = (html.match(/type:'section',key:/g)||[]).length;
console.log('section keys:', count);
if(count < 3){console.error('FAIL');process.exit(1);}
fs.writeFileSync('app.html', html);
console.log('Done');
