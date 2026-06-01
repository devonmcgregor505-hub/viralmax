const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `  allItems.push({type:'section',key:section.key,label:'☀️  Morning'});`,
  `  allItems.push({type:'section',key:'morning',label:'☀️  Morning'});`
);

if(!html.includes("key:'morning'")) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
