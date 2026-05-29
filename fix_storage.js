const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Replace initApp to always pull from profile storage first
h = h.replace(
`function initApp(){
  const morning=profile?.morning||MORNING;
  const night=profile?.night||NIGHT;
  if(profile?.habits) window._customHabits=profile.habits;
  renderChecklist();
  renderRoutine('morningBlocks',morning);
  renderRoutine('nightBlocks',night);
  renderRoutine('nutritionBlocks',NUTRITION_BLOCKS);
  renderTraining();
  updateGreeting();
  loadStreak();
  renderProgressPhotos();
}`,
`function initApp(){
  // Always pull from saved profile, fall back to hardcoded defaults
  const saved = JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  const morning  = saved.morning  || MORNING;
  const night    = saved.night    || NIGHT;
  const nutrition= saved.nutrition|| NUTRITION_BLOCKS;
  const training = saved.training || TRAINING_DAYS;
  const habits   = saved.habits   || HABITS;
  window._customHabits = habits;
  window._customTraining = training;
  renderChecklist();
  renderRoutine('morningBlocks', morning);
  renderRoutine('nightBlocks', night);
  renderRoutine('nutritionBlocks', nutrition);
  renderTrainingFromData(training);
  updateGreeting();
  loadStreak();
  renderProgressPhotos();
}`
);

// Add renderTrainingFromData so training also uses stored data
h = h.replace(
`function renderTraining(){
  const el=document.getElementById('trainingDays');
  if(el) el.innerHTML=TRAINING_DAYS.map(d=>\`
    <div class="training-row">
      <span class="tr-day">\${d.day}</span>
      <span class="tr-name">\${d.name}</span>
      <span class="routine-tag tag-\${d.tag}">\${d.tagLabel}</span>
    </div>\`).join('');
  const fe=document.getElementById('frameBlocks');
  if(fe) fe.innerHTML=\`<ul style="list-style:none;">\${FRAME_ITEMS.map(it=>\`<li style="font-size:13px;color:var(--t2);padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;"><span style="color:var(--t3);">—</span>\${it}</li>\`).join('')}</ul>\`;
}`,
`function renderTraining(){
  renderTrainingFromData(window._customTraining||TRAINING_DAYS);
}
function renderTrainingFromData(days){
  const el=document.getElementById('trainingDays');
  if(el) el.innerHTML=days.map(d=>\`
    <div class="training-row">
      <span class="tr-day">\${d.day||''}</span>
      <span class="tr-name">\${d.name||d.title||''}</span>
      <span class="routine-tag tag-\${d.tag||'body'}">\${d.tagLabel||d.tag||''}</span>
    </div>\`).join('');
  const fe=document.getElementById('frameBlocks');
  if(fe) fe.innerHTML=\`<ul style="list-style:none;">\${FRAME_ITEMS.map(it=>\`<li style="font-size:13px;color:var(--t2);padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;"><span style="color:var(--t3);">—</span>\${it}</li>\`).join('')}</ul>\`;
}`
);

// Update the AI routine generation prompt to also return nutrition + training
h = h.replace(
`content.push({type:'text',text:'Generate a full personalised daily routine. Profile: Age '+profile.age+', Height '+profile.height+'cm, Weight '+profile.weight+'kg, Goal: '+profile.goal+', Level: '+profile.level+', Focus: '+profile.focus+', Training: '+profile.train+', Wake: '+profile.wake+', Accountability: '+profile.acct+'.'+(obPhotos.some(p=>p)?' Factor in what you observe in the photos about physique, facial structure, skin, and posture.':'')+' Return ONLY valid JSON with keys: morning (array of {time,title,tag,tagLabel,items[],note}), night (array), habits (array of {name,desc,cat}). Tags: mind/skin/hair/body/frame. 4-5 morning, 4-5 night, 7-8 habits.'});`,
`content.push({type:'text',text:'Generate a full personalised daily routine. Profile: Age '+profile.age+', Height '+profile.height+'cm, Weight '+profile.weight+'kg, Goal: '+profile.goal+', Level: '+profile.level+', Focus: '+profile.focus+', Training: '+profile.train+', Wake: '+profile.wake+', Accountability: '+profile.acct+'.'+(obPhotos.some(p=>p)?' Factor in what you observe in the photos about physique, facial structure, skin, and posture.':'')+' Return ONLY valid JSON with these keys: morning (array of {time,title,tag,tagLabel,items[],note}), night (array of same), habits (array of {name,desc,cat}), nutrition (array of {title,tag,tagLabel,items[],note}), training (array of {day,name,tag,tagLabel}). Tags: mind/skin/hair/body/frame. 4-5 morning, 4-5 night, 7-8 habits, 3 nutrition blocks, 7 training days.'});`
);

// Store nutrition + training from AI response
h = h.replace(
`    if(match){
      const routine=JSON.parse(match[0]);
      if(routine.morning) profile.morning=routine.morning;
      if(routine.night)   profile.night=routine.night;
      if(routine.habits)  profile.habits=routine.habits;
    }`,
`    if(match){
      const routine=JSON.parse(match[0]);
      if(routine.morning)   profile.morning=routine.morning;
      if(routine.night)     profile.night=routine.night;
      if(routine.habits)    profile.habits=routine.habits;
      if(routine.nutrition) profile.nutrition=routine.nutrition;
      if(routine.training)  profile.training=routine.training;
    }`
);

fs.writeFileSync('app.html', h);
console.log('Done');
