const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `  const orderedSections = isMorning\n    ? [daySection, morningSection, nightSection].filter(Boolean)\n    : [daySection, nightSection, morningSection].filter(Boolean);`,
  `  const orderedSections = isMorning\n    ? [morningSection, daySection, nightSection].filter(Boolean)\n    : [nightSection, daySection, morningSection].filter(Boolean);`
);

fs.writeFileSync('app.html', html);
console.log('✓ Section order patch done');
