const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Find and fix the broken toggleLMGoal line
const lines = html.split('\n');
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('saveLMG(g); renderLMG();') && lines[i].includes('}); ')){
    lines[i] = '  item.done=!item.done; saveLMG(g); renderLMG();\n}';
    console.log('Fixed line', i+1);
  }
}
html = lines.join('\n');
fs.writeFileSync('app.html', html);
console.log('Done');
