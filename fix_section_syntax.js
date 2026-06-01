const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Find and fix the broken section body line
const lines = html.split('\n');
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('cl-section-body') && lines[i].includes('sectionBodyClass') && !lines[i].includes('`')){
    lines[i] = '    <div class="cl-section-body ${sectionBodyClass}" id="body-${section.key}" style="padding-bottom:10px;">`.trim();
    // Actually just rewrite it properly
    lines[i] = '    \`<div class="cl-section-body \${sectionBodyClass}" id="body-\${section.key}" style="padding-bottom:10px;">';
    console.log('Fixed line', i+1);
  }
}
html = lines.join('\n');
fs.writeFileSync('app.html', html);
console.log('Done');
