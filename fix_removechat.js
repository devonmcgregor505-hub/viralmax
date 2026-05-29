const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Remove ai-panel HTML
h = h.replace(
  /\n  <!-- AI PANEL -->[\s\S]*?<\/aside>\n/,
  '\n'
);

// Remove ai-panel CSS
h = h.replace(
  /\.ai-panel\{[\s\S]*?\}[\s\S]*?\.ai-thinking span:nth-child\(3\)\{animation-delay:\.3s\}\n/,
  ''
);

fs.writeFileSync('app.html', h);
console.log('ai-panel remaining:', h.includes('ai-panel'));
