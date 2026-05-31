const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Add override to remove bottom border from last check-item and all check-items
const CSS = `
.check-item{border-bottom:none!important;}`;

html = html.replace('</style>', CSS + '\n</style>');
fs.writeFileSync('app.html', html);
console.log('Done');
