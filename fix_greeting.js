const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Remove the section-header from the checklist page
h = h.replace(
  `        <div class="section-header">
          <div class="section-title" id="checklistGreeting">Good morning, Devon 👋</div>
          <div class="section-sub">Track your habits. Every day counts.</div>
        </div>`,
  ``
);

fs.writeFileSync('app.html', h);
console.log('Done');
