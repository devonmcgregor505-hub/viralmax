const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Remove the leftover legend text items from HTML
h = h.replace(/\s*<div class="cal-legend">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '\n    </div>\n  </div>\n</div>');

// More aggressive — just find and remove any cal-legend div remaining
h = h.replace(/<div class="cal-legend">[\s\S]*?<\/div>/g, '');

// Fix calendar grid spacing — ensure days fill evenly
h = h.replace(
  `.cal-day{width:100%;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--t2);cursor:default;max-width:52px;margin:0 auto;}`,
  `.cal-day{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--t2);cursor:default;margin:0 auto;}`
);

// Make popup wider for calendar specifically — override inline
h = h.replace(
  `<div class="popup-overlay" id="calendarPopup" style="display:none" onclick="if(event.target===this)closeCalendar()">
  <div class="popup-box">`,
  `<div class="popup-overlay" id="calendarPopup" style="display:none" onclick="if(event.target===this)closeCalendar()">
  <div class="popup-box" style="max-width:580px;width:92%;">`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('cal-legend remaining:', (h.match(/cal-legend/g)||[]).length);
