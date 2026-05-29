const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

h = h.replace(
  `      <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25%+</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>0%</div>
    </div>`,
  `      <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#84cc16"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f97316"></div>100%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--y)"></div>75%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#94a3b8"></div>50%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#3b82f6"></div>25%</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--red)"></div>0%</div>
    </div>`
);

fs.writeFileSync('app.html', h);
console.log('Done');
