const fs = require('fs');
const html = fs.readFileSync('app.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if(!match){ console.log('NO SCRIPT TAG FOUND'); process.exit(1); }
fs.writeFileSync('/tmp/test_script.js', match[1]);
console.log('Script extracted, length:', match[1].length);
