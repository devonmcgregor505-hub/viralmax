const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
const lines = html.split('\n');
for(let i=0;i<lines.length;i++){
  if(lines[i].includes("notif-empty") && lines[i].includes("You")){
    lines[i] = lines[i].replace(/You.re all caught up [^<]*/, "All caught up \u2713");
    console.log('Fixed line', i+1, ':', lines[i].trim().slice(0,80));
  }
}
fs.writeFileSync('app.html', lines.join('\n'));
