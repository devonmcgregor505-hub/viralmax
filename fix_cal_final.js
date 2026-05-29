const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Fix calendar popup box size
h = h.replace(
  `  <div class="popup-box" style="max-width:580px;width:92%;">`,
  `  <div class="popup-box" style="max-width:600px;width:94%;padding:32px 36px;">`
);

// 2. Fix renderCalendar to show orange for today if score is 100
h = h.replace(
  `    const score = _scoreHistory[dateStr];
    const isToday = dateStr===todayStr;
    const isPast = new Date(dateStr) < new Date(todayStr);
    let cls = 'cal-day';
    if(isToday) cls+=' today';
    else if(score===100) cls+=' completed';
    else if(isPast) cls+=' incomplete';
    html+=\`<div class="\${cls}">\${d}</div>\`;`,
  `    const score = _scoreHistory[dateStr];
    const isToday = dateStr===todayStr;
    const isPast = new Date(dateStr) < new Date(todayStr);
    let cls = 'cal-day';
    if(isToday && score===100) cls+=' completed';
    else if(isToday) cls+=' today';
    else if(score===100) cls+=' completed';
    else if(isPast) cls+=' incomplete';
    html+=\`<div class="\${cls}">\${d}</div>\`;`
);

// 3. Make calendar grid rows taller
h = h.replace(
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px 16px;}`,
  `.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:14px 16px;}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
