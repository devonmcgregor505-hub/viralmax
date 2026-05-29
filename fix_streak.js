const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Add calculateStreak function
const streakFn = `
function calculateStreak(){
  const hist = JSON.parse(localStorage.getItem('ascend_score_history')||'{}');
  const today = new Date();
  let streak = 0;
  for(let i=0; i<365; i++){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if(hist[key]===100) streak++;
    else if(i>0) break; // gap — stop counting
  }
  return streak;
}

function updateStreakBadge(){
  const streak = calculateStreak();
  const el = document.getElementById('streakCount');
  if(el) el.textContent = streak;
}
`;
h = h.replace('</script>', streakFn + '</script>');

// 2. Call updateStreakBadge in maybeSaveScore after saving
h = h.replace(
  `  // Save to server if logged in`,
  `  updateStreakBadge();
  // If 100% today, update calendar if open
  if(score===100 && document.getElementById('calendarPopup').style.display!=='none'){
    renderCalendar();
  }
  // Save to server if logged in`
);

// 3. Call updateStreakBadge on app init
h = h.replace(
  `function loadStreak(){
  const s=parseInt(localStorage.getItem('ascend_streak')||'3');
  document.getElementById('streakCount').textContent=s;
}`,
  `function loadStreak(){
  updateStreakBadge();
}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
console.log('calculateStreak:', h.includes('function calculateStreak'));
console.log('updateStreakBadge:', h.includes('function updateStreakBadge'));
