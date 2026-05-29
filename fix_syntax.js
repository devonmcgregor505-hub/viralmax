const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Rename the duplicate variable declarations in the new section rendering code
h = h.replace(
  `  const tasks=allItems.filter(it=>it.type==='task');
  const done2=[...checked].filter(i=>allItems[i]?.type==='task').length;
  const score2=tasks.length?Math.round(done2/tasks.length*100):0;`,
  `  const tasks2=allItems.filter(it=>it.type==='task');
  const done2=[...checked].filter(i=>allItems[i]?.type==='task').length;
  const score2=tasks2.length?Math.round(done2/tasks2.length*100):0;`
);

fs.writeFileSync('app.html', h);

// Verify
const script = h.match(/<script>([\s\S]*?)<\/script>/g);
const s = script[script.length-1].replace(/<\/?script>/g,'');
try{ new Function(s); console.log('JS OK'); }
catch(e){ console.log('JS ERROR:', e.message); }
