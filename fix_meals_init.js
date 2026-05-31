const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Make sure renderMealsSection is called in initApp
if(!html.includes('renderMealsSection()')) {
  html = html.replace(
    `  renderTrainingFromData(training);`,
    `  renderTrainingFromData(training);\n  renderMealsSection();`
  );
} else {
  // It's there but maybe in wrong place — ensure it's inside initApp after DOM is ready
  console.log('renderMealsSection already present, checking placement...');
}

// Also call it when nutrition page is shown
html = html.replace(
  `function showPage(name,linkEl){`,
  `function showPage(name,linkEl){\n  if(name==='nutrition') setTimeout(renderMealsSection,10);`
);

fs.writeFileSync('app.html', html);
console.log('Done');
