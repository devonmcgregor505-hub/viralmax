const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Merge section header + macro grid into one flex row
html = html.replace(
  `        <div class="section-header">
          <div class="section-title">Nutrition</div>
          <div class="section-sub">Daily targets built around your goals.</div>
        </div>
        <div class="macro-grid">
          <div class="macro-card"><div class="macro-val">2,600</div><div class="macro-lbl">Calories</div></div>
          <div class="macro-card"><div class="macro-val">160g</div><div class="macro-lbl">Protein</div></div>
          <div class="macro-card"><div class="macro-val">3L</div><div class="macro-lbl">Water</div></div>
        </div>`,
  `        <div class="nutrition-header">
          <div>
            <div class="section-title">Nutrition</div>
            <div class="section-sub">Daily targets built around your goals.</div>
          </div>
          <div class="macro-grid" id="macroGrid"></div>
        </div>`
);

// 2. New CSS
const NEW_CSS = `
.nutrition-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px;}
.macro-grid{display:flex;gap:8px;}
.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:12px;padding:10px 16px;text-align:center;cursor:pointer;transition:border-color .15s;min-width:90px;}
.macro-card:hover{border-color:rgba(255,200,0,0.25);}
.macro-lbl{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:3px;}
.macro-val{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:var(--y);line-height:1;}
.macro-val-unit{font-size:13px;color:var(--t2);font-weight:600;}
.macro-inline-input{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:var(--y);background:transparent;border:none;border-bottom:2px solid var(--y);outline:none;width:80px;padding:0;text-align:center;}`;

html = html.replace('</style>', NEW_CSS + '\n</style>');

// 3. Remove old macro CSS that conflicts
html = html.replace(`.macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}`, ``);
html = html.replace(`.macro-card{background:var(--bg-panel);border-radius:var(--rs);padding:14px;text-align:center;}`, ``);
html = html.replace(`.macro-val{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:var(--y);}`, ``);
html = html.replace(`.macro-lbl{font-size:11px;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;margin-top:2px;}`, ``);

// 4. JS
const MACRO_JS = `
// MACROS
function loadMacros(){ return JSON.parse(localStorage.getItem("ascend_macros")||'{"calories":2600,"protein":160}'); }
function saveMacros(m){ localStorage.setItem("ascend_macros",JSON.stringify(m)); }
function renderMacros(){
  var el=document.getElementById("macroGrid"); if(!el)return;
  var m=loadMacros();
  el.innerHTML=
    "<div class=\\"macro-card\\" onclick=\\"editMacro('calories')\\">"
      +"<div class=\\"macro-lbl\\">Calories</div>"
      +"<div><span class=\\"macro-val\\" id=\\"macro-calories\\">"+m.calories.toLocaleString()+"</span><span class=\\"macro-val-unit\\"> kcal</span></div>"
    +"</div>"
    +"<div class=\\"macro-card\\" onclick=\\"editMacro('protein')\\">"
      +"<div class=\\"macro-lbl\\">Protein</div>"
      +"<div><span class=\\"macro-val\\" id=\\"macro-protein\\">"+m.protein+"</span><span class=\\"macro-val-unit\\">g</span></div>"
    +"</div>";
}
function editMacro(key){
  var card=document.getElementById("macro-"+key)?.closest(".macro-card"); if(!card)return;
  var m=loadMacros(); var cur=m[key]; var unit=key==="calories"?"kcal":"g";
  card.innerHTML="<div class=\\"macro-lbl\\">"+(key==="calories"?"Calories":"Protein")+"</div>"
    +"<div style=\\"display:flex;align-items:baseline;gap:3px;justify-content:center;\\">"
    +"<input class=\\"macro-inline-input\\" id=\\"macro-inp-"+key+"\\" type=\\"number\\" value=\\""+cur+"\\" />"
    +"<span class=\\"macro-val-unit\\">"+unit+"</span></div>";
  card.onclick=null;
  var inp=document.getElementById("macro-inp-"+key); inp.focus(); inp.select();
  function commit(){
    var val=parseInt(inp.value);
    if(!isNaN(val)&&val>0){m[key]=val;saveMacros(m);}
    renderMacros();
  }
  inp.addEventListener("blur",commit);
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")inp.blur();if(e.key==="Escape")renderMacros();});
}
`;

html = html.replace('</script>', MACRO_JS + '\n</script>');
html = html.replace(
  `  renderRoutine('nutritionBlocks', nutrition);`,
  `  renderRoutine('nutritionBlocks', nutrition);\n  renderMacros();`
);

fs.writeFileSync('app.html', html);
console.log('Done');
