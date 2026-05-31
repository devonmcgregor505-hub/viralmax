const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `      <div class="panel-page" id="page-training">
        <div class="section-header">
          <div class="section-title">Training</div>
          <div class="section-sub">Your workout split — tap exercises to log starting weight.</div>
        </div>
        <div id="trainingSection"></div>
      </div>`,
  `      <div class="panel-page" id="page-training">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;">
          <div>
            <div class="section-title">Training</div>
            <div class="section-sub">Your workout split — tap exercises to log starting weight.</div>
          </div>
          <div id="weightCards" style="display:flex;gap:8px;flex-shrink:0;"></div>
        </div>
        <div id="trainingSection"></div>
      </div>`
);

if(!html.includes('weightCards')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
