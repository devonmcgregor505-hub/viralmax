const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Nuke everything between page-nutrition opening and nutritionBlocks, rebuild clean
html = html.replace(
  /(<div class="panel-page"[^>]*id="page-nutrition">)([\s\S]*?)(<div id="nutritionBlocks")/,
  `$1
        <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px;flex-wrap:nowrap;">
          <div style="flex:1;min-width:0;">
            <div class="section-title">Nutrition</div>
            <div class="section-sub">Daily targets built around your goals.</div>
          </div>
          <div id="macroGrid" style="display:flex;gap:8px;flex-shrink:0;"></div>
        </div>
        $3`
);

fs.writeFileSync('app.html', html);
console.log('Done');
