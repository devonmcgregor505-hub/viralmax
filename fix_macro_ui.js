const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix macro card layout CSS
html = html.replace(
  `.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;transition:border-color .15s;}
.macro-card:hover{border-color:rgba(255,255,255,0.1);}
.macro-card-left{display:flex;flex-direction:column;}
.macro-edit-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;color:var(--t2);font-size:11px;font-weight:600;padding:5px 11px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;}
.macro-edit-btn:hover{border-color:rgba(255,200,0,0.3);color:var(--y);}
.macro-edit-row{display:flex;align-items:center;gap:6px;margin-top:6px;}
.macro-input{width:80px;background:var(--bg-input);border:1px solid var(--border-y);border-radius:7px;color:var(--y);font-family:'Bebas Neue',sans-serif;font-size:22px;padding:4px 10px;outline:none;letter-spacing:1px;}
.macro-input:focus{border-color:var(--y);}
.macro-input-unit{font-size:12px;color:var(--t2);font-weight:600;}`,
  `.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);padding:20px 22px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;transition:border-color .15s;}
.macro-card:hover{border-color:rgba(255,255,255,0.1);}
.macro-card-left{display:flex;flex-direction:column;gap:4px;}
.macro-edit-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;color:var(--t2);font-size:11px;font-weight:600;padding:5px 11px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;flex-shrink:0;}
.macro-edit-btn:hover{border-color:rgba(255,200,0,0.3);color:var(--y);}
.macro-edit-row{display:flex;align-items:center;gap:8px;margin-top:4px;}
.macro-input{width:100px;background:var(--bg-input);border:1px solid var(--border-y);border-radius:7px;color:var(--y);font-family:'Bebas Neue',sans-serif;font-size:28px;padding:6px 12px;outline:none;letter-spacing:1px;}
.macro-input:focus{border-color:var(--y);box-shadow:0 0 0 3px rgba(255,200,0,0.08);}
.macro-input-unit{font-size:13px;color:var(--t2);font-weight:600;}`
);

// Fix macro-val size
html = html.replace(
  '.macro-val{font-family:\'Bebas Neue\',sans-serif;font-size:28px;letter-spacing:1px;color:var(--y);}',
  `.macro-val{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;color:var(--y);line-height:1;}`
);

// Fix macro-lbl
html = html.replace(
  '.macro-lbl{font-size:11px;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;margin-top:2px;}',
  `.macro-lbl{font-size:10px;font-weight:800;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:2px;}`
);

fs.writeFileSync('app.html', html);
console.log('Done');
