const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Remove "Where are you starting from?" step
h = h.replace(
  `  {type:'single',label:'Your level',q:'Where are you starting from?',sub:'Be honest — this shapes everything.',opts:['Complete beginner','Some habits, inconsistent','Decent base, want to level up','Already disciplined, want structure']},\n`,
  ``
);

// 2. Change training step from single to multi with new options
h = h.replace(
  `  {type:'single',label:'Training',q:'How do you currently train?',sub:'',opts:['Gym (weights)','Running / cardio','Sports','Mix of everything','Nothing yet']},`,
  `  {type:'multi',label:'Training',q:'How do you currently train?',sub:'Select all that apply.',opts:['Gym (weights)','Walking','Biking','Sport','Nothing yet','Everything']},`
);

// 3. Remove accountability step
h = h.replace(
  `  {type:'single',label:'Accountability',q:'How do you want accountability?',sub:'This drives your daily check-in style.',opts:['Strict — call me out if I slip','Motivating — keep me encouraged','Neutral — just show me the data','Flexible — adapt to my mood']},\n`,
  ``
);

// 4. Update photo instructions to remove "specific order" requirement
h = h.replace(
  `      <div class="ob-photo-req">Upload 4 photos in this order:</div>
      <div class="ob-photo-req-list">
        <span>1. Face — front on</span>
        <span>2. Face — side on</span>
        <span>3. Body — front on (shirtless)</span>
        <span>4. Body — side on (shirtless)</span>
      </div>`,
  `      <div class="ob-photo-req">Upload up to 4 photos of yourself:</div>
      <div class="ob-photo-req-list">
        <span>📷 Face — front on</span>
        <span>📷 Face — side on</span>
        <span>📷 Body — front on</span>
        <span>📷 Body — side on</span>
      </div>`
);

// 5. Update obComplete to use dynamic index for training (now multi) and remove level/acct
h = h.replace(
  `  const goalMap=['Look better','Build muscle','Improve health','All of the above'];
  const levelMap=['Beginner','Inconsistent','Decent base','Disciplined'];
  const trainMap=['Gym','Running','Sports','Mixed','Not yet'];
  const wakeMap=['Before 6am','6am–7am','7am–8am','After 8am','Varies'];
  const acctMap=['Strict','Motivating','Neutral','Flexible'];
  const focusIdx=OB_STEPS.findIndex(s=>s.label==='Focus areas');
  const trainIdx=OB_STEPS.findIndex(s=>s.label==='Training');
  const wakeIdx=OB_STEPS.findIndex(s=>s.label==='Wake time');
  const acctIdx=OB_STEPS.findIndex(s=>s.label==='Accountability');
  const ageIdx=OB_STEPS.findIndex(s=>s.key==='age');
  const heightIdx=OB_STEPS.findIndex(s=>s.key==='height');
  const weightIdx=OB_STEPS.findIndex(s=>s.key==='weight');
  const focusOpts=OB_STEPS[focusIdx].opts;
  const focus=obMulti[focusIdx]?[...obMulti[focusIdx]].map(i=>focusOpts[i]).filter(o=>o!=='Everything').join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],level:levelMap[obAnswers[1]],age:obAnswers[ageIdx]||'—',height:obAnswers[heightIdx]||'—',weight:obAnswers[weightIdx]||'—',focus,train:trainMap[obAnswers[trainIdx]],wake:wakeMap[obAnswers[wakeIdx]],acct:acctMap[obAnswers[acctIdx]]};`,
  `  const goalMap=['Look better','Build muscle','Improve health','All of the above'];
  const wakeMap=['Before 6am','6am–7am','7am–8am','After 8am','Varies'];
  const focusIdx=OB_STEPS.findIndex(s=>s.label==='Focus areas');
  const trainIdx=OB_STEPS.findIndex(s=>s.label==='Training');
  const wakeIdx=OB_STEPS.findIndex(s=>s.label==='Wake time');
  const ageIdx=OB_STEPS.findIndex(s=>s.key==='age');
  const heightIdx=OB_STEPS.findIndex(s=>s.key==='height');
  const weightIdx=OB_STEPS.findIndex(s=>s.key==='weight');
  const focusOpts=OB_STEPS[focusIdx].opts;
  const trainOpts=OB_STEPS[trainIdx].opts;
  const focus=obMulti[focusIdx]?[...obMulti[focusIdx]].map(i=>focusOpts[i]).filter(o=>o!=='Everything').join(', '):'—';
  const train=obMulti[trainIdx]?[...obMulti[trainIdx]].map(i=>trainOpts[i]).filter(o=>o!=='Everything').join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],age:obAnswers[ageIdx]||'—',height:obAnswers[heightIdx]||'—',weight:obAnswers[weightIdx]||'—',focus,train,wake:wakeMap[obAnswers[wakeIdx]],acct:'flexible'};`
);

// 6. Update the AI prompt to not mention specific photo order
h = h.replace(
  `+(obPhotos.some(p=>p)?' Factor in what you observe in the photos about physique, facial structure, skin, and posture.':'')`,
  `+(obPhotos.some(p=>p)?' I have included photos of myself — analyse them yourself to determine my physique, facial structure, skin condition, posture, and any areas needing improvement. Use this to personalise my routine.':'')`
);

// 7. Update summary rows to remove level and acct
h = h.replace(
  `  const rows=[['Goal',profile.goal],['Age',profile.age+'yrs'],['Height',profile.height+'cm'],['Weight',profile.weight+'kg'],['Focus',profile.focus],['Training',profile.train],['Wake',profile.wake]];`,
  `  const rows=[['Goal',profile.goal],['Age',profile.age+'yrs'],['Height',profile.height+'cm'],['Weight',profile.weight+'kg'],['Training',profile.train],['Wake',profile.wake]];`
);

fs.writeFileSync('app.html', h);
const ok = h.includes(`label:'Training',q:'How do you currently train?',sub:'Select all that apply.`);
console.log(ok ? 'Done' : 'WARNING: some changes missed');
