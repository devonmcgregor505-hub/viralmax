const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Remove bottom border from check-item and cl-step
html = html.replace(
  `.cl-step{font-size:13px;color:var(--text);opacity:0.75;padding:2px 0;line-height:1.55;border:none;}`,
  `.cl-step{font-size:13px;color:var(--text);opacity:0.75;padding:2px 0;line-height:1.55;border:none;margin:0;}`
);

// Remove any border-bottom from cl-steps
html = html.replace(
  `.cl-steps{margin-top:6px;padding-left:4px;}`,
  `.cl-steps{margin-top:6px;padding-left:4px;border:none;}`
);

// The line is likely the check-item bottom border — add override
const CSS = `
.cl-steps *{border:none!important;}
.check-item .cl-steps{border-bottom:none!important;}`;

html = html.replace('</style>', CSS + '\n</style>');
fs.writeFileSync('app.html', html);
console.log('Done');
