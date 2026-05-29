const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Find the checklist panel page and add bigChecklist div
h = h.replace(
  `      <div class="panel-page active" id="page-checklist">
        <div id="bigChecklist"></div>
      </div>`,
  `      <div class="panel-page active" id="page-checklist">
        <div class="card">
          <div id="bigChecklist"></div>
        </div>
      </div>`
);

// If that didn't match, try finding the checklist page another way
if(!h.includes('<div id="bigChecklist">')){
  h = h.replace(
    `      <div class="panel-page active" id="page-checklist">`,
    `      <div class="panel-page active" id="page-checklist">
        <div class="card">
          <div id="bigChecklist"></div>
        </div>`
  );
}

fs.writeFileSync('app.html', h);
console.log('bigChecklist in HTML:', h.includes('<div id="bigChecklist">'));
