const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Add height + weight + photos steps to OB_STEPS
h = h.replace(
  `  {type:'single',label:'Accountability',q:'How do you want accountability?',sub:'This drives your daily check-in style.',opts:['Strict — call me out if I slip','Motivating — keep me encouraged','Neutral — just show me the data','Flexible — adapt to my mood']},\n];`,
  `  {type:'input',label:'Your height',q:'How tall are you?',sub:'',ph:'178',unit:'cm',key:'height'},
  {type:'input',label:'Your weight',q:'How much do you weigh?',sub:'',ph:'75',unit:'kg',key:'weight'},
  {type:'single',label:'Accountability',q:'How do you want accountability?',sub:'This drives your daily check-in style.',opts:['Strict — call me out if I slip','Motivating — keep me encouraged','Neutral — just show me the data','Flexible — adapt to my mood']},
  {type:'photos',label:'Your photos',q:'Upload your starting photos',sub:'Used by AI to personalise your routine. Stored privately on your device.'},
];`
);

// 2. Add photo CSS
const photoCss = `
.ob-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;}
.ob-photo-slot{border:1.5px dashed var(--t4);border-radius:var(--rs);aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:var(--bg-input);}
.ob-photo-slot:hover{border-color:var(--t2);}
.ob-photo-slot.has-photo{border-color:var(--y);border-style:solid;}
.ob-photo-slot img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.ob-photo-label{font-size:11px;color:var(--t3);text-align:center;padding:0 8px;margin-top:6px;line-height:1.4;z-index:1;}
.ob-photo-icon{font-size:22px;z-index:1;}
.ob-photo-slot.has-photo .ob-photo-icon{display:none;}
.ob-photo-slot.has-photo .ob-photo-label{display:none;}
.ob-photo-remove{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:12px;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:2;}
.ob-photo-slot.has-photo .ob-photo-remove{display:flex;}
.ob-generating{text-align:center;padding:32px 0;}
.ob-gen-spinner{width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--y);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;}
@keyframes spin{to{transform:rotate(360deg)}}
.ob-gen-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:var(--y);margin-bottom:8px;}
.ob-gen-sub{font-size:13px;color:var(--t2);line-height:1.7;}
.progress-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
.progress-photo-item{border-radius:var(--rs);overflow:hidden;aspect-ratio:3/4;background:var(--bg-panel);}
.progress-photo-item img{width:100%;height:100%;object-fit:cover;}
.progress-checkin{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);padding:14px;margin-bottom:10px;}
.progress-checkin-date{font-size:11px;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;}
`;
h = h.replace('</style>', photoCss + '</style>');

// 3. Add photo rendering to renderOB
h = h.replace(
  `  document.getElementById('obContent').innerHTML=html;\n  if(step.type==='input') setTimeout(()=>document.getElementById('obInput')?.focus(),50);\n}`,
  `  if(step.type==='photos'){
    html+=\`<div class="ob-photo-grid">
      \${['Face — front','Face — side','Body — front','Body — side'].map((lbl,i)=>\`
        <div class="ob-photo-slot\${obPhotos[i]?' has-photo':''}" onclick="triggerPhoto(\${i})" id="slot\${i}">
          \${obPhotos[i]?'<img src="'+obPhotos[i]+'" />':''}
          <span class="ob-photo-icon">📷</span>
          <span class="ob-photo-label">\${lbl}</span>
          <button class="ob-photo-remove" onclick="removePhoto(event,\${i})">✕</button>
        </div>\`).join('')}
    </div>
    <input type="file" accept="image/*" id="photoFileInput" style="display:none" onchange="handlePhotoFile(event)"/>
    <div class="ob-nav"><button class="ob-back" onclick="obBack()">← back</button><button class="ob-next" id="obNext" onclick="obNext()">Generate my routine ✦</button></div>\`;
  }
  document.getElementById('obContent').innerHTML=html;
  if(step.type==='input') setTimeout(()=>document.getElementById('obInput')?.focus(),50);
}`
);

// 4. Add photo state variables and helpers before obSelect
h = h.replace(
  `function obSelect(i){obAnswers[obStep]=i;renderOB();}`,
  `let obPhotos=[null,null,null,null];
let activePhotoSlot=0;
function obSelect(i){obAnswers[obStep]=i;renderOB();}
function triggerPhoto(i){activePhotoSlot=i;document.getElementById('photoFileInput').click();}
function removePhoto(e,i){e.stopPropagation();obPhotos[i]=null;renderOB();}
function handlePhotoFile(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{obPhotos[activePhotoSlot]=ev.target.result;renderOB();};
  reader.readAsDataURL(file);e.target.value='';
}`
);

// 5. Replace obComplete with AI-powered version
const oldComplete = `function obComplete(){
  const goalMap=['Look better','Build muscle','Improve health','All of the above'];
  const levelMap=['Beginner','Inconsistent','Decent base','Disciplined'];
  const trainMap=['Gym','Running','Sports','Mixed','Not yet'];
  const wakeMap=['Before 6am','6am–7am','7am–8am','After 8am','Varies'];
  const acctMap=['Strict','Motivating','Neutral','Flexible'];
  const focus=obMulti[3]?[...obMulti[3]].map(i=>OB_STEPS[3].opts[i]).join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],level:levelMap[obAnswers[1]],age:obAnswers[2]||'—',focus,train:trainMap[obAnswers[4]],wake:wakeMap[obAnswers[5]],acct:acctMap[obAnswers[6]]};
  const rows=[['Goal',profile.goal],['Level',profile.level],['Age',profile.age+(profile.age!=='—'?' yrs':'')],['Focus',focus],['Training',profile.train],['Wake',profile.wake],['Accountability',profile.acct]];
  document.getElementById('obContent').innerHTML=\`
    <div class="ob-complete">
      <div class="ob-complete-icon">✦</div>
      <div class="ob-complete-title">YOU'RE SET</div>
      <div class="ob-complete-sub">Your personalised routine has been built.<br>Check in daily to build the streak.</div>
      <div class="ob-summary">\${rows.map(([l,v])=>\`<div class="ob-summary-row"><span class="ob-summary-lbl">\${l}</span><span class="ob-summary-val">\${v}</span></div>\`).join('')}</div>
      <button class="ob-launch" onclick="launchApp()">Launch my routine →</button>
    </div>\`;
}`;

const newComplete = `function obComplete(){
  const goalMap=['Look better','Build muscle','Improve health','All of the above'];
  const levelMap=['Beginner','Inconsistent','Decent base','Disciplined'];
  const trainMap=['Gym','Running','Sports','Mixed','Not yet'];
  const wakeMap=['Before 6am','6am–7am','7am–8am','After 8am','Varies'];
  const acctMap=['Strict','Motivating','Neutral','Flexible'];
  const focus=obMulti[5]?[...obMulti[5]].map(i=>OB_STEPS[5].opts[i]).join(', '):'—';
  profile={goal:goalMap[obAnswers[0]],level:levelMap[obAnswers[1]],age:obAnswers[2]||'—',height:obAnswers[3]||'—',weight:obAnswers[4]||'—',focus,train:trainMap[obAnswers[6]],wake:wakeMap[obAnswers[7]],acct:acctMap[obAnswers[8]]};
  if(obPhotos.some(p=>p)){
    const checkin={date:new Date().toISOString(),photos:obPhotos};
    const existing=JSON.parse(localStorage.getItem('ascend_checkins')||'[]');
    existing.unshift(checkin);
    localStorage.setItem('ascend_checkins',JSON.stringify(existing.slice(0,20)));
  }
  document.getElementById('obContent').innerHTML=\`
    <div class="ob-generating">
      <div class="ob-gen-spinner"></div>
      <div class="ob-gen-title">Building your routine</div>
      <div class="ob-gen-sub">Analysing your profile\${obPhotos.some(p=>p)?' and photos':''}...<br>This takes about 15 seconds.</div>
    </div>\`;
  generateRoutineFromAI();
}

async function generateRoutineFromAI(){
  try{
    const content=[];
    const labels=['Face front','Face side','Body front','Body side'];
    obPhotos.forEach((p,i)=>{
      if(p){
        content.push({type:'image',source:{type:'base64',media_type:p.split(';')[0].split(':')[1],data:p.split(',')[1]}});
        content.push({type:'text',text:labels[i]+' photo above.'});
      }
    });
    content.push({type:'text',text:'Generate a full personalised daily routine. Profile: Age '+profile.age+', Height '+profile.height+'cm, Weight '+profile.weight+'kg, Goal: '+profile.goal+', Level: '+profile.level+', Focus: '+profile.focus+', Training: '+profile.train+', Wake: '+profile.wake+', Accountability: '+profile.acct+'.'+(obPhotos.some(p=>p)?' Factor in what you observe in the photos about physique, facial structure, skin, and posture.':'')+' Return ONLY valid JSON with keys: morning (array of {time,title,tag,tagLabel,items[],note}), night (array), habits (array of {name,desc,cat}). Tags: mind/skin/hair/body/frame. 4-5 morning, 4-5 night, 7-8 habits.'});
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content}],profile,returnJson:true})});
    const data=await res.json();
    const clean=(data.reply||'').replace(/\`\`\`json|\`\`\`/g,'').trim();
    const match=clean.match(/\{[\s\S]*\}/);
    if(match){
      const routine=JSON.parse(match[0]);
      if(routine.morning) profile.morning=routine.morning;
      if(routine.night)   profile.night=routine.night;
      if(routine.habits)  profile.habits=routine.habits;
    }
  }catch(e){console.warn('AI routine gen failed:',e.message);}
  localStorage.setItem('ascend_profile',JSON.stringify(profile));
  const rows=[['Goal',profile.goal],['Age',profile.age+'yrs'],['Height',profile.height+'cm'],['Weight',profile.weight+'kg'],['Focus',profile.focus],['Training',profile.train],['Wake',profile.wake]];
  document.getElementById('obContent').innerHTML=\`
    <div class="ob-complete">
      <div class="ob-complete-icon">✦</div>
      <div class="ob-complete-title">YOU'RE SET</div>
      <div class="ob-complete-sub">Your personalised routine is ready.<br>Check in daily to build the streak.</div>
      <div class="ob-summary">\${rows.map(([l,v])=>\`<div class="ob-summary-row"><span class="ob-summary-lbl">\${l}</span><span class="ob-summary-val">\${v}</span></div>\`).join('')}</div>
      <button class="ob-launch" onclick="launchApp()">Launch my routine →</button>
    </div>\`;
}`;
h = h.replace(oldComplete, newComplete);

// 6. Update initApp to use AI routine + render progress photos
h = h.replace(
  `function initApp(){\n  renderChecklist();\n  renderRoutine('morningBlocks',MORNING);\n  renderRoutine('nightBlocks',NIGHT);\n  renderRoutine('nutritionBlocks',NUTRITION_BLOCKS);\n  renderTraining();\n  updateGreeting();\n  loadStreak();\n}`,
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
}

function renderProgressPhotos(){
  const checkins=JSON.parse(localStorage.getItem('ascend_checkins')||'[]');
  const el=document.getElementById('progressPhotosWrap');
  if(!el)return;
  if(checkins.length===0){el.innerHTML='<div class="empty-state"><div class="empty-icon">📸</div><div class="empty-title">No photos yet</div><div class="empty-sub">Complete the onboarding quiz with photos to start tracking your transformation.</div></div>';return;}
  el.innerHTML=checkins.map(c=>{
    const d=new Date(c.date);
    const daysAgo=Math.floor((Date.now()-d.getTime())/86400000);
    const dateStr=d.toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'});
    const agoStr=daysAgo===0?'Today':daysAgo===1?'Yesterday':daysAgo+' days ago';
    return '<div class="progress-checkin"><div class="progress-checkin-date">'+dateStr+' · '+agoStr+'</div><div class="progress-photo-grid">'+c.photos.map(p=>p?'<div class="progress-photo-item"><img src="'+p+'" /></div>':'').join('')+'</div></div>';
  }).join('');
}`
);

// 7. Update renderChecklist to use custom habits
h = h.replace(
  `  const el=document.getElementById('checklistItems');\n  el.innerHTML=HABITS.map((h,i)=>\``,
  `  const habitsToUse=window._customHabits||HABITS;\n  const el=document.getElementById('checklistItems');\n  el.innerHTML=habitsToUse.map((h,i)=>\``
);
h = h.replace(
  `  const score=Math.round(checked.size/HABITS.length*100);`,
  `  const score=Math.round(checked.size/(window._customHabits||HABITS).length*100);`
);

// 8. Replace progress photos placeholder HTML
h = h.replace(
  `          <div class="empty-state">\n            <div class="empty-icon">📸</div>\n            <div class="empty-title">Progress photos coming soon</div>\n            <div class="empty-sub">Weekly photo check-ins and side-by-side comparisons will be available in the next update.</div>\n          </div>`,
  `          <div id="progressPhotosWrap"><div class="empty-state"><div class="empty-icon">📸</div><div class="empty-title">No photos yet</div><div class="empty-sub">Complete the onboarding quiz with photos to start tracking your transformation.</div></div></div>`
);

fs.writeFileSync('app.html', h);
const ok = h.includes('ob-photo-grid') && h.includes('generateRoutineFromAI') && h.includes('progressPhotosWrap');
console.log(ok ? 'Done — all changes applied' : 'WARNING: some changes may have missed');
