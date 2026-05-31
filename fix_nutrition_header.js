const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace the whole nutrition header + macro grid block
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
          <div id="macroGrid" class="macro-grid"></div>
        </div>`
);

// 2. Inject CSS before </style>
const CSS = `
.nutrition-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;}
.macro-grid{display:flex;gap:8px;flex-shrink:0;}
.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:12px;padding:10px 18px;cursor:pointer;transition:all .15s;text-align:left;}
.macro-card:hover{border-color:rgba(255,200,0,0.3);background:rgba(255,200,0,0.04);}
.macro-lbl{font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--t3);margin-bottom:4px;}
.macro-val{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:var(--y);line-height:1;display:inline;}
.macro-val-unit{font-size:13px;color:var(--t2);font-weight:600;margin-left:2px;}
.macro-inline-input{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:var(--y);background:transparent;border:none;border-bottom:2px solid var(--y);outline:none;width:90px;padding:0;}`;

html = html.replace('</style>', CSS + '\n</style>');

// 3. Inject JS before </script>
const JS = `
// MACROS
function loadMacros(){return JSON.parse(localStorage.getItem("ascend_macros")||'{"calories":2600,"protein":160}');}
function saveMacros(m){localStorage.setItem("ascend_macros",JSON.stringify(m));}
function renderMacros(){
  var el=document.getElementById("macroGrid");if(!el)return;
  var m=loadMacros();
  el.innerHTML=
    "<div class=\\"macro-card\\" onclick=\\"editMacro('calories')\\">"
      +"<div class=\\"macro-lbl\\">Calories</div>"
      +"<span class=\\"macro-val\\">"+m.calories.toLocaleString()+"</span>"
      +"<span class=\\"macro-val-unit\\">kcal</span>"
    +"</div>"
    +"<div class=\\"macro-card\\" onclick=\\"editMacro('protein')\\">"
      +"<div class=\\"macro-lbl\\">Protein</div>"
      +"<span class=\\"macro-val\\">"+m.protein+"</span>"
      +"<span class=\\"macro-val-unit\\">g</span>"
    +"</div>";
}
function editMacro(key){
  var card=document.querySelector("[onclick=\\"editMacro('"+key+"')\\"]");if(!card)return;
  var m=loadMacros();var unit=key==="calories"?"kcal":"g";var label=key==="calories"?"Calories":"Protein";
  card.onclick=null;
  card.innerHTML="<div class=\\"macro-lbl\\">"+label+"</div>"
    +"<input class=\\"macro-inline-input\\" id=\\"minp-"+key+"\\" type=\\"number\\" value=\\""+m[key]+"\\" />"
    +"<span class=\\"macro-val-unit\\">"+unit+"</span>";
  var inp=document.getElementById("minp-"+key);inp.focus();inp.select();
  function done(){var v=parseInt(inp.value);if(!isNaN(v)&&v>0){m[key]=v;saveMacros(m);}renderMacros();}
  inp.addEventListener("blur",done);
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")inp.blur();if(e.key==="Escape")renderMacros();});
}`;

html = html.replace('</script>', JS + '\n</script>');

// 4. Call renderMacros in initApp
if(!html.includes('renderMacros()')) {
  html = html.replace(
    `  renderRoutine('nutritionBlocks', nutrition);`,
    `  renderRoutine('nutritionBlocks', nutrition);\n  renderMacros();`
  );
}

fs.writeFileSync('app.html', html);
console.log('Done');
