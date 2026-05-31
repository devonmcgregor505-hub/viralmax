const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Replace both instances - strip leading dashes from step text AND remove the hardcoded "— "
html = html.split(`<div class="cl-step">— \${s}</div>`).join(`<div class="cl-step">\${s.replace(/^[\\u2014\\u2013\\-]+\\s*/,'')}</div>`);

var count = (html.match(/cl-step.*replace/g)||[]).length;
console.log('Replaced instances:', count);
if(count < 2) { console.error('FAIL - only replaced', count); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
