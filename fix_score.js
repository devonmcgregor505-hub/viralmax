const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Remove the two-col score/streak cards
h = h.replace(
  /        <div class="two-col" style="margin-bottom:12px;">[\s\S]*?<\/div>\n        <\/div>\n/,
  ''
);

fs.writeFileSync('app.html', h);
console.log('Done');
