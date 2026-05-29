const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Add "Everything" option to focus areas
h = h.replace(
  `opts:['Skincare & grooming','Hair & styling','Body & physique','Diet & nutrition','Sleep quality','Jaw / posture / frame','Fitness & training']`,
  `opts:['Skincare & grooming','Hair & styling','Body & physique','Diet & nutrition','Sleep quality','Jaw / posture / frame','Fitness & training','Everything']`
);

// 2. Handle "Everything" toggle — selecting it picks all
h = h.replace(
  `function obMultiToggle(i){if(!obMulti[obStep])obMulti[obStep]=new Set();const s=obMulti[obStep];s.has(i)?s.delete(i):s.add(i);renderOB();}`,
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
}`
);

// 3. Fix obComplete to find step indices dynamically so adding/removing steps never breaks it
h = h.replace(
  `  const focus=obMulti[5]?[...obMulti[5]].map(i=>OB_STEPS[5].opts[i]).join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],level:levelMap[obAnswers[1]],age:obAnswers[2]||'—',height:obAnswers[3]||'—',weight:obAnswers[4]||'—',focus,train:trainMap[obAnswers[6]],wake:wakeMap[obAnswers[7]],acct:acctMap[obAnswers[8]]};`,
  `  const focusIdx=OB_STEPS.findIndex(s=>s.label==='Focus areas');
  const trainIdx=OB_STEPS.findIndex(s=>s.label==='Training');
  const wakeIdx=OB_STEPS.findIndex(s=>s.label==='Wake time');
  const acctIdx=OB_STEPS.findIndex(s=>s.label==='Accountability');
  const ageIdx=OB_STEPS.findIndex(s=>s.key==='age');
  const heightIdx=OB_STEPS.findIndex(s=>s.key==='height');
  const weightIdx=OB_STEPS.findIndex(s=>s.key==='weight');
  const focusOpts=OB_STEPS[focusIdx].opts;
  const focus=obMulti[focusIdx]?[...obMulti[focusIdx]].map(i=>focusOpts[i]).filter(o=>o!=='Everything').join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],level:levelMap[obAnswers[1]],age:obAnswers[ageIdx]||'—',height:obAnswers[heightIdx]||'—',weight:obAnswers[weightIdx]||'—',focus,train:trainMap[obAnswers[trainIdx]],wake:wakeMap[obAnswers[wakeIdx]],acct:acctMap[obAnswers[acctIdx]]};`
);

fs.writeFileSync('app.html', h);
const ok = h.includes('Everything') && h.includes('findIndex');
console.log(ok ? 'Done' : 'WARNING: some changes missed');
