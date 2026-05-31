const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Remove the Generate meal plan button and nutritionBlocks, replace with meals UI
html = html.replace(
  `        <div id="nutritionBlocks"></div>
        <div style="margin-top:16px;">
          <button class="btn-y" onclick="askAI('Build me a full week of meals — high protein, 2600 calories, focused on appearance and muscle')">Generate meal plan ✦</button>
        </div>`,
  `        <div id="mealsSection"></div>`
);

// 2. CSS
const CSS = `
.meals-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.meals-title{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);}
.meal-row{background:var(--bg-panel);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px;transition:border-color .15s;}
.meal-row:hover{border-color:rgba(255,255,255,0.1);}
.meal-row-head{display:flex;align-items:center;gap:10px;}
.meal-row-emoji{font-size:18px;flex-shrink:0;}
.meal-row-info{flex:1;min-width:0;}
.meal-name-input{font-size:14px;font-weight:700;color:var(--text);background:transparent;border:none;outline:none;font-family:inherit;width:100%;padding:0;}
.meal-name-input::placeholder{color:var(--t3);}
.meal-desc-input{font-size:12px;color:var(--t2);background:transparent;border:none;outline:none;font-family:inherit;width:100%;padding:0;margin-top:3px;}
.meal-desc-input::placeholder{color:var(--t4);}
.meal-macros{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.meal-macro-pill{background:rgba(255,200,0,0.07);border:1px solid rgba(255,200,0,0.12);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:var(--y);cursor:pointer;transition:all .15s;}
.meal-macro-pill:hover{background:rgba(255,200,0,0.12);}
.meal-del-btn{background:none;border:none;color:var(--t4);font-size:13px;cursor:pointer;padding:2px 6px;border-radius:6px;transition:color .15s;}
.meal-del-btn:hover{color:var(--red);}
.meal-add-btn{width:100%;padding:11px;background:transparent;border:1px dashed rgba(255,255,255,0.1);border-radius:12px;color:var(--t2);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;margin-top:4px;}
.meal-add-btn:hover{border-color:var(--y);color:var(--y);}
.macro-edit-popup{position:fixed;inset:0;z-index:997;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);}
.macro-edit-box{background:var(--bg-card);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;width:280px;}
.macro-edit-box-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:16px;}
.macro-edit-field{margin-bottom:12px;}
.macro-edit-field label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);display:block;margin-bottom:5px;}
.macro-edit-field input{width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:inherit;font-size:14px;padding:9px 12px;outline:none;}
.macro-edit-field input:focus{border-color:rgba(255,200,0,0.3);}
.macro-edit-actions{display:flex;gap:8px;margin-top:16px;}
.macro-edit-save{flex:1;padding:10px;background:linear-gradient(135deg,#FFCC00,#FF9500);border:none;border-radius:9px;color:#000;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.macro-edit-cancel{padding:10px 16px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:9px;color:var(--t2);font-family:inherit;font-size:13px;cursor:pointer;}`;

html = html.replace('</style>', CSS + '\n</style>');

// 3. JS
const JS = `
// MEALS
var DEFAULT_MEALS = [
  {id:1, emoji:"🌅", name:"Breakfast", desc:"Eggs, Greek yogurt, fruit", cals:450, protein:35},
  {id:2, emoji:"☀️", name:"Lunch", desc:"Chicken & rice bowl", cals:650, protein:50},
  {id:3, emoji:"🌙", name:"Dinner", desc:"Beef mince & vegetables", cals:750, protein:55}
];
function loadMeals(){ return JSON.parse(localStorage.getItem("ascend_meals")||JSON.stringify(DEFAULT_MEALS)); }
function saveMeals(m){ localStorage.setItem("ascend_meals",JSON.stringify(m)); }

function renderMealsSection(){
  var el=document.getElementById("mealsSection"); if(!el)return;
  var meals=loadMeals();
  var totalCals=meals.reduce(function(s,m){return s+(m.cals||0);},0);
  var totalProt=meals.reduce(function(s,m){return s+(m.protein||0);},0);
  var html="<div class=\\"meals-header\\">"
    +"<div class=\\"meals-title\\">Daily Diet</div>"
    +"<div style=\\"font-size:11px;color:var(--t3);\\">"+totalCals.toLocaleString()+" kcal &nbsp;·&nbsp; "+totalProt+"g protein</div>"
    +"</div>";
  meals.forEach(function(meal){
    html+="<div class=\\"meal-row\\">"
      +"<div class=\\"meal-row-head\\">"
      +"<span class=\\"meal-row-emoji\\">"+meal.emoji+"</span>"
      +"<div class=\\"meal-row-info\\">"
      +"<input class=\\"meal-name-input\\" value=\\""+meal.name+"\\" placeholder=\\"Meal name\\" onchange=\\"updateMeal("+meal.id+",'name',this.value)\\"/>"
      +"<input class=\\"meal-desc-input\\" value=\\""+meal.desc+"\\" placeholder=\\"What you eat...\\" onchange=\\"updateMeal("+meal.id+",'desc',this.value)\\"/>"
      +"</div>"
      +"<div class=\\"meal-macros\\">"
      +"<span class=\\"meal-macro-pill\\" onclick=\\"openMacroEdit("+meal.id+")\\">"+meal.cals+" kcal</span>"
      +"<span class=\\"meal-macro-pill\\" onclick=\\"openMacroEdit("+meal.id+")\\">"+meal.protein+"g</span>"
      +"</div>"
      +"<button class=\\"meal-del-btn\\" onclick=\\"deleteMeal("+meal.id+")\\">✕</button>"
      +"</div>"
      +"</div>";
  });
  html+="<button class=\\"meal-add-btn\\" onclick=\\"addMeal()\\">+ Add meal</button>";
  el.innerHTML=html;
}
function updateMeal(id,field,val){
  var meals=loadMeals();
  var m=meals.find(function(x){return x.id===id;}); if(!m)return;
  m[field]=val; saveMeals(meals);
}
function deleteMeal(id){
  var meals=loadMeals().filter(function(m){return m.id!==id;});
  saveMeals(meals); renderMealsSection();
}
function addMeal(){
  var meals=loadMeals();
  var emojis=["🥗","🍳","🥩","🍱","🥤","🍚","🥪"];
  var newId=Date.now();
  meals.push({id:newId,emoji:emojis[meals.length%emojis.length],name:"New meal",desc:"",cals:0,protein:0});
  saveMeals(meals); renderMealsSection();
  setTimeout(function(){
    var inputs=document.querySelectorAll(".meal-name-input");
    if(inputs.length) inputs[inputs.length-1].focus();
  },50);
}
function openMacroEdit(id){
  var meals=loadMeals();
  var m=meals.find(function(x){return x.id===id;}); if(!m)return;
  var popup=document.createElement("div");
  popup.className="macro-edit-popup";
  popup.id="macroEditPopup";
  popup.innerHTML="<div class=\\"macro-edit-box\\">"
    +"<div class=\\"macro-edit-box-title\\">"+m.name+" macros</div>"
    +"<div class=\\"macro-edit-field\\"><label>Calories</label><input id=\\"mep-cals\\" type=\\"number\\" value=\\""+m.cals+"\\" /></div>"
    +"<div class=\\"macro-edit-field\\"><label>Protein (g)</label><input id=\\"mep-prot\\" type=\\"number\\" value=\\""+m.protein+"\\" /></div>"
    +"<div class=\\"macro-edit-actions\\">"
    +"<button class=\\"macro-edit-cancel\\" onclick=\\"closeMacroEdit()\\">Cancel</button>"
    +"<button class=\\"macro-edit-save\\" onclick=\\"saveMacroEdit("+id+")\\">Save</button>"
    +"</div></div>";
  document.body.appendChild(popup);
  document.getElementById("mep-cals").focus();
}
function closeMacroEdit(){
  var p=document.getElementById("macroEditPopup"); if(p)p.remove();
}
function saveMacroEdit(id){
  var meals=loadMeals();
  var m=meals.find(function(x){return x.id===id;}); if(!m)return;
  m.cals=parseInt(document.getElementById("mep-cals").value)||0;
  m.protein=parseInt(document.getElementById("mep-prot").value)||0;
  saveMeals(meals); closeMacroEdit(); renderMealsSection();
}`;

html = html.replace('</script>', JS + '\n</script>');

// 4. Call renderMealsSection in initApp (replace renderRoutine nutritionBlocks call)
html = html.replace(
  `  renderRoutine('nutritionBlocks', nutrition);`,
  `  renderMealsSection();`
);

fs.writeFileSync('app.html', html);
console.log('Done');
