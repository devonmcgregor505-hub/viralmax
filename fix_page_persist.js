const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Save page on switch
html = html.replace(
  `function showPage(name,linkEl){`,
  `function showPage(name,linkEl){\n  localStorage.setItem('ascend_page', name);`
);

// Restore page on boot — find the DOMContentLoaded boot block
html = html.replace(
  `  const saved=localStorage.getItem('ascend_profile');\n  if(saved){\n    profile=JSON.parse(saved);\n    document.getElementById('onboardingOverlay').style.display='none';\n    initApp();\n  } else {`,
  `  const saved=localStorage.getItem('ascend_profile');\n  if(saved){\n    profile=JSON.parse(saved);\n    document.getElementById('onboardingOverlay').style.display='none';\n    initApp();\n    var lastPage=localStorage.getItem('ascend_page');\n    if(lastPage && lastPage!=='checklist') showPage(lastPage, null);\n  } else {`
);

if(!html.includes('ascend_page')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
