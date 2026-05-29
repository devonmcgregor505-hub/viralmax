const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Make popup wider and calendar bigger
h = h.replace(
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:24px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;position:relative;z-index:999;}`,
  `.popup-box{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:24px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;position:relative;z-index:999;}`
);

// 2. Make calendar day circles smaller and tighter
h = h.replace(
  `.cal-day{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--t2);cursor:default;position:relative;}`,
  `.cal-day{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--t2);cursor:default;margin:0 auto;}`
);

// 3. Tighten the circle ring size
h = h.replace(
  `.cal-day.today{box-shadow:0 0 0 2px #84cc16;color:#84cc16;}
.cal-day.score-100{background:rgba(249,115,22,0.2);box-shadow:0 0 0 2px #f97316;color:#f97316;}
.cal-day.score-75{background:rgba(255,200,0,0.15);box-shadow:0 0 0 2px var(--y);color:var(--y);}
.cal-day.score-50{background:rgba(148,163,184,0.15);box-shadow:0 0 0 2px #94a3b8;color:#94a3b8;}
.cal-day.score-25{background:rgba(59,130,246,0.15);box-shadow:0 0 0 2px #3b82f6;color:#3b82f6;}
.cal-day.score-low{background:rgba(239,68,68,0.15);box-shadow:0 0 0 2px var(--red);color:var(--red);}`,
  `.cal-day.today{box-shadow:0 0 0 1.5px #84cc16;color:#84cc16;}
.cal-day.score-100{background:rgba(249,115,22,0.15);box-shadow:0 0 0 1.5px #f97316;color:#f97316;}
.cal-day.score-75{background:rgba(255,200,0,0.12);box-shadow:0 0 0 1.5px var(--y);color:var(--y);}
.cal-day.score-50{background:rgba(148,163,184,0.12);box-shadow:0 0 0 1.5px #94a3b8;color:#94a3b8;}
.cal-day.score-25{background:rgba(59,130,246,0.12);box-shadow:0 0 0 1.5px #3b82f6;color:#3b82f6;}
.cal-day.score-low{background:rgba(239,68,68,0.12);box-shadow:0 0 0 1.5px var(--red);color:var(--red);}`
);

// 4. Update legend labels
h = h.replace(
  `      <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16;box-shadow:0 0 0 2px #84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75–99%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50–74%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25–49%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>1–24%</div>
    </div>`,
  `      <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>0%</div>
    </div>`
);

// 5. Make cal-grid cells bigger
h = h.replace(
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}`,
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}`
);

// 6. Bigger day of week labels
h = h.replace(
  `.cal-dow{font-size:10px;font-weight:700;color:var(--t3);text-align:center;padding:4px 0;letter-spacing:.06em;}`,
  `.cal-dow{font-size:11px;font-weight:700;color:var(--t3);text-align:center;padding:6px 0;letter-spacing:.06em;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
