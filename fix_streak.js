const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

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
    else if(i>0) break;
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

h = h.replace(
  `  updateStreakBadge();\n  // If 100% today`,
  `  // already has updateStreakBadge`
);

// Add updateStreakBadge call in maybeSaveScore
h = h.replace(
  `  _lastSavedScore = score;`,
  `  _lastSavedScore = score;
  updateStreakBadge();
  // If 100% today, refresh calendar if open
  if(score===100){
    const cal=document.getElementById('calendarPopup');
    if(cal && cal.style.display!=='none') renderCalendar();
  }`
);

// Fix loadStreak to use calculateStreak
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
console.log('calculateStreak:', h.includes('function calculateStreak'));
console.log('updateStreakBadge:', h.includes('function updateStreakBadge'));
