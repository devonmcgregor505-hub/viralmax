const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Remove the Daily Habits card from the checklist page HTML
h = h.replace(
  `      <div class="panel-page active" id="page-checklist">
        <div class="card">
          <div id="bigChecklist"></div>
        </div>
      </div>`,
  `      <div class="panel-page active" id="page-checklist">
        <div id="bigChecklist"></div>
      </div>`
);

// 2. Remove card label "DAILY HABITS" if it still exists
h = h.replace(`<div class="card-label">Daily habits</div>\n          <div class="checklist-wrap" id="checklistItems"></div>`, '');

// 3. Fix section order — During the day always first, then time-based morning/night
h = h.replace(
  `  // Reorder: after midday put night first
  const orderedSections = isMorning ? sections : [sections[2], sections[1], sections[0]].filter(Boolean);`,
  `  // Order: During the day always first, then morning/night based on time
  const morningSection = sections.find(s=>s.key==='morning');
  const daySection = sections.find(s=>s.key==='day');
  const nightSection = sections.find(s=>s.key==='night');
  const orderedSections = isMorning
    ? [daySection, morningSection, nightSection].filter(Boolean)
    : [daySection, nightSection, morningSection].filter(Boolean);`
);

fs.writeFileSync('app.html', h);
console.log('Done');
