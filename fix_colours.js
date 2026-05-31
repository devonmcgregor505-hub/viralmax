const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Brighter base text colours
html = html.replace('--text:#f0f0fa;--t2:#8888aa;--t3:#44446a;--t4:#2a2a48;', '--text:#f4f4ff;--t2:#a8a8cc;--t3:#6060a0;--t4:#3a3a62;');

// More visible section headers — higher opacity backgrounds, stronger borders
html = html.replace('.cl-section-morning{background:rgba(255,200,0,0.06);border:1px solid rgba(255,200,0,0.1);}', '.cl-section-morning{background:rgba(255,200,0,0.1);border:1px solid rgba(255,200,0,0.22);}');
html = html.replace('.cl-section-morning:hover{background:rgba(255,200,0,0.09);}', '.cl-section-morning:hover{background:rgba(255,200,0,0.14);}');
html = html.replace('.cl-section-day{background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.1);}', '.cl-section-day{background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.22);}');
html = html.replace('.cl-section-day:hover{background:rgba(96,165,250,0.09);}', '.cl-section-day:hover{background:rgba(96,165,250,0.14);}');
html = html.replace('.cl-section-night{background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.1);}', '.cl-section-night{background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.22);}');
html = html.replace('.cl-section-night:hover{background:rgba(167,139,250,0.09);}', '.cl-section-night:hover{background:rgba(167,139,250,0.14);}');

// Section label text brighter
html = html.replace('.cl-section-morning .cl-section-label{color:var(--morning);}', '.cl-section-morning .cl-section-label{color:#ffd740;font-size:14px;}');
html = html.replace('.cl-section-day .cl-section-label{color:var(--day);}', '.cl-section-day .cl-section-label{color:#7ab8ff;font-size:14px;}');
html = html.replace('.cl-section-night .cl-section-label{color:var(--night);}', '.cl-section-night .cl-section-label{color:#c4b0ff;font-size:14px;}');

// Check item cards — more visible
html = html.replace(
  '.check-item{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:all .18s ease;position:relative;overflow:hidden;}',
  '.check-item{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);cursor:pointer;transition:all .18s ease;position:relative;overflow:hidden;}'
);
html = html.replace(
  '.check-item:hover{background:rgba(255,255,255,0.045);border-color:rgba(255,255,255,0.09);transform:translateX(2px);}',
  '.check-item:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14);transform:translateX(2px);}'
);

// Brighter check name
html = html.replace('.check-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:1px;transition:all .18s;}', '.check-name{font-size:14px;font-weight:700;color:#f4f4ff;margin-bottom:1px;transition:all .18s;}');

// Step text much more readable
html = html.replace('.cl-step{font-size:12.5px;color:var(--t2);padding:3px 0;line-height:1.55;display:flex;gap:8px;}', '.cl-step{font-size:12.5px;color:#b0b0d8;padding:3px 0;line-height:1.55;display:flex;gap:8px;}');
html = html.replace('.cl-step::before{content:\'—\';color:var(--t3);flex-shrink:0;font-size:11px;margin-top:1px;}', '.cl-step::before{content:\'—\';color:#7070b0;flex-shrink:0;font-size:11px;margin-top:1px;}');

// Check time sub-text brighter
html = html.replace('.check-name .check-time{font-size:11px;font-weight:500;color:var(--t3);margin-left:6px;}', '.check-name .check-time{font-size:11px;font-weight:500;color:#8080c0;margin-left:6px;}');

// Check box default border more visible
html = html.replace('.check-box{width:22px;height:22px;border-radius:7px;border:1.5px solid rgba(255,255,255,0.12);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s ease;background:rgba(255,255,255,0.03);}', '.check-box{width:22px;height:22px;border-radius:7px;border:1.5px solid rgba(255,255,255,0.22);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s ease;background:rgba(255,255,255,0.04);}');

// Card background slightly more lifted
html = html.replace('--bg-card:#0e0e1a;', '--bg-card:#10101e;');
html = html.replace('--bg-panel:#111120;', '--bg-panel:#13132a;');

if(!html.includes('#b0b0d8')) { console.error('FAIL: step colour'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('✓ Colour patch done');
