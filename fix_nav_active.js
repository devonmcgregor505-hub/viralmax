const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix showPage to always activate the matching sidebar nav-item by page name
html = html.replace(
  `function showPage(name,linkEl){\n  document.querySelectorAll('.panel-page').forEach(p=>p.classList.remove('active'));\n  document.getElementById('page-'+name)?.classList.add('active');\n  document.querySelectorAll('.topbar-nav a').forEach(a=>a.classList.remove('active'));\n  document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));\n  if(linkEl) linkEl.classList.add('active');\n}`,
  `function showPage(name,linkEl){\n  document.querySelectorAll('.panel-page').forEach(p=>p.classList.remove('active'));\n  document.getElementById('page-'+name)?.classList.add('active');\n  document.querySelectorAll('.topbar-nav a').forEach(a=>a.classList.remove('active'));\n  document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));\n  if(linkEl){ linkEl.classList.add('active'); }\n  // Always sync sidebar by matching onclick attribute\n  document.querySelectorAll('.nav-item').forEach(function(a){\n    if(a.getAttribute('onclick') && a.getAttribute('onclick').includes("'"+name+"'")) a.classList.add('active');\n  });\n}`
);

if(!html.includes('sync sidebar')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
