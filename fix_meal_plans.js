const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

html = html.replace(
  `' Return ONLY valid JSON with these keys: morning (array of {time,title,tag,tagLabel,items[],note}), night (array of same), habits (array of {name,desc,cat}), nutrition (array of {title,tag,tagLabel,items[],note}), training (array of {day,name,tag,tagLabel}). Tags: mind/skin/hair/body/frame. 4-5 morning, 4-5 night, 7-8 habits, 3 nutrition blocks, 7 training days.'`,
  `' Return ONLY valid JSON with these keys: morning (array of {time,title,tag,tagLabel,items[],note}), night (array of same), habits (array of {name,desc,cat}), nutrition (array of {title,tag,tagLabel,items[],note}), training (array of {day,name,tag,tagLabel}), meals (array of 7 objects Mon–Sun each with: breakfast:{name,cals,protein,items[]}, lunch:{name,cals,protein,items[]}, dinner:{name,cals,protein,items[]}, snacks:[{name,cals,protein,items[]}]). Tags: mind/skin/hair/body/frame. 4-5 morning, 4-5 night, 7-8 habits, 3 nutrition blocks, 7 training days, 7 meal days personalised to profile macros and goals.'`
);

html = html.replace(
  `if(routine.training)  profile.training=routine.training;`,
  `if(routine.training)  profile.training=routine.training;\n      if(routine.meals){ profile.meals=routine.meals; localStorage.setItem('ascend_meal_plans',JSON.stringify(routine.meals)); }`
);

html = html.replace(
  `<div id="nutritionBlocks"></div>\n        <div style="margin-top:16px;">\n          <button class="btn-y" onclick="askAI('Build me a full week of meals — high protein, 2600 calories, focused on appearance and muscle')">Generate meal plan ✦</button>\n        </div>`,
  `<div id="todayMeals" style="margin-bottom:20px;"></div>\n        <div id="nutritionBlocks"></div>`
);

html = html.replace(
  `  renderRoutine('nutritionBlocks', nutrition);`,
  `  renderRoutine('nutritionBlocks', nutrition);\n  renderTodayMeals();`
);

html = html.replace(
  `function closeDayPlanner(){\n  document.getElementById('dayPlannerPopup').style.display='none';\n  // Refresh checklist to reflect any changes for today\n  renderChecklist();\n}`,
  `function closeDayPlanner(){\n  document.getElementById('dayPlannerPopup').style.display='none';\n  renderChecklist();\n  renderTodayMeals();\n}`
);

const MEAL_CORE = `
// ─── MEAL PLANS ───
let _mealPlans = null;

const DEFAULT_MEAL_PLAN = {
  breakfast:{name:'High-protein breakfast',cals:450,protein:35,items:['4 eggs scrambled','2 slices sourdough','Black coffee']},
  lunch:{name:'Chicken & rice bowl',cals:650,protein:50,items:['200g chicken breast','1 cup white rice','Mixed greens']},
  dinner:{name:'Beef mince & veg',cals:750,protein:55,items:['250g beef mince','Broccoli','Sweet potato']},
  snacks:[{name:'Greek yogurt & berries',cals:150,protein:15,items:['200g Greek yogurt','Handful of blueberries']}]
};

function loadMealPlans(){
  if(_mealPlans) return;
  const saved = localStorage.getItem('ascend_meal_plans');
  if(saved){ _mealPlans=JSON.parse(saved); return; }
  const prof = JSON.parse(localStorage.getItem('ascend_profile')||'{}');
  if(prof.meals && Array.isArray(prof.meals) && prof.meals.length===7){
    _mealPlans=prof.meals;
    localStorage.setItem('ascend_meal_plans',JSON.stringify(_mealPlans));
    return;
  }
  _mealPlans=Array.from({length:7},()=>JSON.parse(JSON.stringify(DEFAULT_MEAL_PLAN)));
}

function saveMealPlans(){
  localStorage.setItem('ascend_meal_plans',JSON.stringify(_mealPlans));
}

function renderTodayMeals(){
  loadMealPlans();
  const dow=new Date().getDay();
  const idx=dow===0?6:dow-1;
  const day=_mealPlans[idx]||JSON.parse(JSON.stringify(DEFAULT_MEAL_PLAN));
  const el=document.getElementById('todayMeals');
  if(!el) return;
  const snacks=day.snacks||[];
  const totalCals=(day.breakfast?.cals||0)+(day.lunch?.cals||0)+(day.dinner?.cals||0)+snacks.reduce((s,sn)=>s+(sn.cals||0),0);
  const totalProt=(day.breakfast?.protein||0)+(day.lunch?.protein||0)+(day.dinner?.protein||0)+snacks.reduce((s,sn)=>s+(sn.protein||0),0);
  function card(emoji,label,m){
    if(!m) return '';
    return \`<div class="meal-card">
      <div class="meal-card-head">
        <span class="meal-card-label">\${emoji} \${label}</span>
        <span class="meal-card-macros"><span>\${m.cals||0} cal</span><span>\${m.protein||0}g protein</span></span>
      </div>
      <div class="meal-card-name">\${m.name||''}</div>
      <ul class="meal-card-items">\${(m.items||[]).map(i=>\`<li>\${i}</li>\`).join('')}</ul>
    </div>\`;
  }
  el.innerHTML=\`
    <div class="meal-day-header">
      <span>Today's Meals</span>
      <span class="meal-day-totals">\${totalCals} cal · \${totalProt}g protein</span>
    </div>
    \${card('🌅','Breakfast',day.breakfast)}
    \${card('☀️','Lunch',day.lunch)}
    \${card('🌙','Dinner',day.dinner)}
    \${snacks.map(sn=>card('⚡','Snack',sn)).join('')}
  \`;
}

`;

html = html.replace(`function openDayPlanner(){`, MEAL_CORE + `function openDayPlanner(){`);

html = html.replace(
  `  html+=\`<button class="dp-add-block" onclick="dpAddBlock('night')">+ Add night block</button>\`;\n  document.getElementById('dayPlannerContent').innerHTML=html;`,
  `  html+=\`<button class="dp-add-block" onclick="dpAddBlock('night')">+ Add night block</button>\`;
  html+=renderDpMeals(_activePlanDay);
  document.getElementById('dayPlannerContent').innerHTML=html;`
);

const MEAL_DP = `
function renderDpMeals(dayIdx){
  loadMealPlans();
  const m=_mealPlans[dayIdx]||JSON.parse(JSON.stringify(DEFAULT_MEAL_PLAN));
  function mealBlock(key,label,emoji){
    const data=Array.isArray(m[key])?m[key][0]:m[key];
    if(!data) return '';
    return \`<div class="dp-meal-block">
      <div class="dp-meal-head">
        <span>\${emoji} \${label}</span>
        <span class="dp-meal-macros">
          <input class="dp-meal-num" type="number" value="\${data.cals||0}" onchange="saveDpMealField('\${key}','cals',+this.value)"> cal
          <input class="dp-meal-num" type="number" value="\${data.protein||0}" onchange="saveDpMealField('\${key}','protein',+this.value)">g prot
        </span>
      </div>
      <input class="dp-block-title" value="\${(data.name||'').replace(/"/g,'&quot;')}" placeholder="Meal name" onchange="saveDpMealField('\${key}','name',this.value)"/>
      \${(data.items||[]).map((item,si)=>\`<div class="dp-step-row">
        <span class="dp-step-dash">—</span>
        <input class="dp-step-input" value="\${(item||'').replace(/"/g,'&quot;')}" placeholder="Ingredient..." onchange="saveDpMealItem('\${key}',\${si},this.value)"/>
        <button class="dp-del-step" onclick="delDpMealItem('\${key}',\${si})">✕</button>
      </div>\`).join('')}
      <button class="dp-add-step" onclick="addDpMealItem('\${key}')">+ Add item</button>
    </div>\`;
  }
  const snacks=Array.isArray(m.snacks)?m.snacks:[];
  return \`<div class="dp-section">🍽️ Meals</div>
    \${mealBlock('breakfast','Breakfast','🌅')}
    \${mealBlock('lunch','Lunch','☀️')}
    \${mealBlock('dinner','Dinner','🌙')}
    \${snacks.map((sn,i)=>\`<div class="dp-meal-block">
      <div class="dp-meal-head">
        <span>⚡ Snack \${i+1}</span>
        <span class="dp-meal-macros">
          <input class="dp-meal-num" type="number" value="\${sn.cals||0}" onchange="saveDpSnackField(\${i},'cals',+this.value)"> cal
          <input class="dp-meal-num" type="number" value="\${sn.protein||0}" onchange="saveDpSnackField(\${i},'protein',+this.value)">g prot
        </span>
      </div>
      <input class="dp-block-title" value="\${(sn.name||'').replace(/"/g,'&quot;')}" placeholder="Snack name" onchange="saveDpSnackField(\${i},'name',this.value)"/>
      \${(sn.items||[]).map((item,si)=>\`<div class="dp-step-row">
        <span class="dp-step-dash">—</span>
        <input class="dp-step-input" value="\${(item||'').replace(/"/g,'&quot;')}" placeholder="Ingredient..." onchange="saveDpSnackItem(\${i},\${si},this.value)"/>
        <button class="dp-del-step" onclick="delDpSnackItem(\${i},\${si})">✕</button>
      </div>\`).join('')}
      <button class="dp-add-step" onclick="addDpSnackItem(\${i})">+ Add item</button>
    </div>\`).join('')}\`;
}

function _getMealTarget(key){
  loadMealPlans();
  const m=_mealPlans[_activePlanDay];
  return Array.isArray(m[key])?m[key][0]:m[key];
}
function saveDpMealField(key,field,val){ const t=_getMealTarget(key); if(!t)return; t[field]=val; saveMealPlans(); }
function saveDpMealItem(key,si,val){ const t=_getMealTarget(key); if(!t||!t.items)return; t.items[si]=val; saveMealPlans(); }
function delDpMealItem(key,si){ const t=_getMealTarget(key); if(!t||!t.items)return; t.items.splice(si,1); saveMealPlans(); renderDayPlanner(); }
function addDpMealItem(key){ const t=_getMealTarget(key); if(!t)return; if(!t.items)t.items=[]; t.items.push(''); saveMealPlans(); renderDayPlanner(); }
function saveDpSnackField(i,field,val){ loadMealPlans(); const s=_mealPlans[_activePlanDay].snacks; if(!s||!s[i])return; s[i][field]=val; saveMealPlans(); }
function saveDpSnackItem(i,si,val){ loadMealPlans(); const s=_mealPlans[_activePlanDay].snacks; if(!s||!s[i]||!s[i].items)return; s[i].items[si]=val; saveMealPlans(); }
function delDpSnackItem(i,si){ loadMealPlans(); const s=_mealPlans[_activePlanDay].snacks; if(!s||!s[i]||!s[i].items)return; s[i].items.splice(si,1); saveMealPlans(); renderDayPlanner(); }
function addDpSnackItem(i){ loadMealPlans(); const s=_mealPlans[_activePlanDay].snacks; if(!s||!s[i])return; if(!s[i].items)s[i].items=[]; s[i].items.push(''); saveMealPlans(); renderDayPlanner(); }

`;

html = html.replace(
  `function copyDayToAll(){\n  const current = JSON.parse(JSON.stringify(_dayPlans[_activePlanDay]));\n  _dayPlans = DAY_NAMES.map(()=>JSON.parse(JSON.stringify(current)));\n  saveDayPlans();\n  renderDayPlanner();\n}`,
  MEAL_DP + `function copyDayToAll(){\n  const current = JSON.parse(JSON.stringify(_dayPlans[_activePlanDay]));\n  _dayPlans = DAY_NAMES.map(()=>JSON.parse(JSON.stringify(current)));\n  saveDayPlans();\n  renderDayPlanner();\n}`
);

const MEAL_CSS = `
  .meal-day-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-weight:700;font-size:15px;color:var(--t1);}
  .meal-day-totals{font-size:12px;color:var(--y);font-weight:700;letter-spacing:.02em;}
  .meal-card{background:var(--s2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;margin-bottom:10px;}
  .meal-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .meal-card-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);}
  .meal-card-macros{font-size:12px;color:var(--y);display:flex;gap:10px;font-weight:600;}
  .meal-card-name{font-size:15px;font-weight:700;color:var(--t1);margin-bottom:8px;}
  .meal-card-items{margin:0;padding:0 0 0 14px;list-style:disc;}
  .meal-card-items li{font-size:13px;color:var(--t2);margin-bottom:3px;}
  .dp-meal-block{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px;margin:8px 0 4px;}
  .dp-meal-head{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:var(--t2);margin-bottom:8px;}
  .dp-meal-macros{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t3);}
  .dp-meal-num{width:52px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:var(--t1);font-size:12px;padding:3px 6px;text-align:center;outline:none;}
  .dp-meal-num:focus{border-color:var(--y);}
`;

html = html.replace(`</style>`, MEAL_CSS + `\n</style>`);

fs.writeFileSync('app.html', html);
console.log('✓ Meal plans patch done');
