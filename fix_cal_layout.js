const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix overall popup sizing and padding
h = h.replace(
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px;width:95%;max-width:720px;max-height:92vh;overflow-y:auto;position:relative;z-index:999;}`,
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:32px;width:90%;max-width:540px;max-height:92vh;overflow-y:auto;position:relative;z-index:999;}`
);

// Fix calendar grid to fill available space properly
h = h.replace(
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;}`,
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;width:100%;}`
);

// Fix day cells to fill column width not fixed px
h = h.replace(
  `.cal-day{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--t2);cursor:default;margin:0 auto;}`,
  `.cal-day{width:100%;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--t2);cursor:default;max-width:52px;margin:0 auto;}`
);

// Fix dow labels to match grid
h = h.replace(
  `.cal-dow{font-size:12px;font-weight:700;color:var(--t3);text-align:center;padding:8px 0;letter-spacing:.06em;}`,
  `.cal-dow{font-size:11px;font-weight:700;color:var(--t3);text-align:center;padding:6px 0 10px;letter-spacing:.05em;}`
);

// Tighter cal header
h = h.replace(
  `.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}`,
  `.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}`
);

// Fix cal month label size
h = h.replace(
  `.cal-month{font-size:14px;font-weight:700;color:var(--text);}`,
  `.cal-month{font-size:16px;font-weight:700;color:var(--text);letter-spacing:-.01em;}`
);

// Fix legend spacing
h = h.replace(
  `.cal-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}`,
  `.cal-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);}`
);

h = h.replace(
  `.cal-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--t2);}`,
  `.cal-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);font-weight:500;}`
);

h = h.replace(
  `.cal-legend-dot{width:10px;height:10px;border-radius:50%;}`,
  `.cal-legend-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
