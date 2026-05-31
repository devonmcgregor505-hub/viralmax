const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Fix: replace the nutrition-header div structure that's still stacking
html = html.replace(
  `        <div class="nutrition-header">
          <div>
            <div class="section-title">Nutrition</div>
            <div class="section-sub">Daily targets built around your goals.</div>
          </div>
          <div id="macroGrid" class="macro-grid"></div>
        </div>`,
  `        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;">
          <div>
            <div class="section-title">Nutrition</div>
            <div class="section-sub">Daily targets built around your goals.</div>
          </div>
          <div id="macroGrid" style="display:flex;gap:8px;flex-shrink:0;"></div>
        </div>`
);

fs.writeFileSync('app.html', html);
console.log('Done');
