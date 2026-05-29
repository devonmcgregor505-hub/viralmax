const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Reorder training opts — Nothing yet goes after Everything
h = h.replace(
  `opts:['Gym (weights)','Walking','Biking','Sport','Nothing yet','Everything']`,
  `opts:['Gym (weights)','Walking','Biking','Sport','Everything','Nothing yet']`
);

// 2. Fix obMultiToggle — Everything selects all except last option (Nothing yet)
h = h.replace(
  `function obMultiToggle(i){
  if(!obMulti[obStep])obMulti[obStep]=new Set();
  const s=obMulti[obStep];
  const step=OB_STEPS[obStep];
  const lastIdx=step.opts.length-1;
  if(i===lastIdx){
    if(s.has(i)){s.clear();}
    else{step.opts.forEach((_,idx)=>s.add(idx));}
  } else {
    s.has(i)?s.delete(i):s.add(i);
    s.delete(lastIdx);
  }
  renderOB();
}`,
  `function obMultiToggle(i){
  if(!obMulti[obStep])obMulti[obStep]=new Set();
  const s=obMulti[obStep];
  const step=OB_STEPS[obStep];
  const opts=step.opts;
  const everythingIdx=opts.indexOf('Everything');
  const nothingIdx=opts.indexOf('Nothing yet');
  if(i===everythingIdx){
    // Toggle Everything — select all except Nothing yet
    if(s.has(i)){s.clear();}
    else{opts.forEach((_,idx)=>{if(idx!==nothingIdx)s.add(idx);});}
  } else if(i===nothingIdx){
    // Toggle Nothing yet — clear everything else
    if(s.has(i)){s.delete(i);}
    else{s.clear();s.add(i);}
  } else {
    // Regular option — deselect Everything and Nothing yet
    s.has(i)?s.delete(i):s.add(i);
    s.delete(everythingIdx);
    s.delete(nothingIdx);
  }
  renderOB();
}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
