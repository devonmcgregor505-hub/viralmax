const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  '<div id="nutritionBlocks"></div>',
  '<div id="mealsSection"></div>'
);

fs.writeFileSync('app.html', html);
console.log('Done');
