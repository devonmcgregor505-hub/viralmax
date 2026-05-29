const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

h = h.replace(
  `.cl-section{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--y);padding:20px 0 8px;border-bottom:1px solid var(--border-y);margin-bottom:4px;}
.cl-section:first-child{padding-top:4px;}
.cl-subheader{font-size:12px;font-weight:700;color:var(--t2);padding:12px 0 4px;letter-spacing:.03em;}`,
  `.cl-section{font-size:16px;font-weight:800;letter-spacing:.04em;color:var(--y);padding:24px 0 10px;border-bottom:1px solid var(--border-y);margin-bottom:8px;}
.cl-section:first-child{padding-top:4px;}
.cl-subheader{font-size:12px;font-weight:700;color:var(--t2);padding:12px 0 4px;letter-spacing:.03em;}`
);

h = h.replace(
  `.cl-steps{margin-top:5px;padding-left:4px;}
.cl-step{font-size:11px;color:var(--t3);padding:2px 0;line-height:1.5;}
.cl-steps-done .cl-step{text-decoration:line-through;opacity:0.4;}`,
  `.cl-steps{margin-top:6px;padding-left:4px;}
.cl-step{font-size:13px;color:var(--t2);padding:3px 0;line-height:1.6;}
.cl-steps-done .cl-step{text-decoration:line-through;opacity:0.35;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
