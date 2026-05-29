const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Remove Morning and Night from sidebar
h = h.replace(
  `    <a class="nav-item" onclick="showPage('morning',null);return false;" href="#">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      Morning
    </a>
    <a class="nav-item" onclick="showPage('night',null);return false;" href="#">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      Night
    </a>`,
  ``
);

// 2. Replace checklist page content to include morning + habits + night inline
h = h.replace(
  `      <div class="panel-page active" id="page-checklist">
        <div class="card">
          <div class="card-label">Daily habits</div>
          <div class="checklist-wrap" id="checklistItems"></div>
        </div>
      </div>`,
  `      <div class="panel-page active" id="page-checklist">
        <div class="card" style="margin-bottom:12px;">
          <div class="card-label">Daily habits</div>
          <div class="checklist-wrap" id="checklistItems"></div>
        </div>
        <div class="card" style="margin-bottom:12px;">
          <div class="card-label">Morning routine</div>
          <div id="morningBlocks"></div>
        </div>
        <div class="card">
          <div class="card-label">Night routine</div>
          <div id="nightBlocks"></div>
        </div>
      </div>`
);

// 3. Remove the separate morning and night panel pages
h = h.replace(
  `      <!-- MORNING PAGE -->
      <div class="panel-page" id="page-morning">
        <div class="section-header">
          <div class="section-title">Morning Routine</div>
          <div class="section-sub">7:00 – 8:30am · Start strong, every day.</div>
        </div>
        <div id="morningBlocks"></div>
      </div>

      <!-- NIGHT PAGE -->
      <div class="panel-page" id="page-night">
        <div class="section-header">
          <div class="section-title">Night Routine</div>
          <div class="section-sub">9:00 – 10:30pm · Wind down, repair, reset.</div>
        </div>
        <div id="nightBlocks"></div>
      </div>`,
  ``
);

fs.writeFileSync('app.html', h);
console.log('Done');
