const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace macro grid HTML — 2 cards, no water, dynamic
html = html.replace(
  `        <div class="macro-grid">
          <div class="macro-card"><div class="macro-val">2,600</div><div class="macro-lbl">Calories</div></div>
          <div class="macro-card"><div class="macro-val">160g</div><div class="macro-lbl">Protein</div></div>
          <div class="macro-card"><div class="macro-val">3L</div><div class="macro-lbl">Water</div></div>
        </div>`,
  `        <div class="macro-grid" id="macroGrid"></div>`
);

// 2. CSS — 2 col grid, click-to-edit number
html = html.replace(
  `.macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}`,
  `.macro-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}`
);
html = html.replace(
  `.macro-card{background:var(--bg-panel);border-radius:var(--rs);padding:14px;text-align:center;}`,
  `.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:14px;padding:20px 22px;}
.macro-lbl{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:8px;}
.macro-val-wrap{display:flex;align-items:baseline;gap:4px;cursor:pointer;width:fit-content;}
.macro-val-wrap:hover .macro-val{opacity:.75;}
.macro-val-wrap::after{content:'✎';font-size:12px;color:var(--t3);margin-left:4px;opacity:0;transition:opacity .15s;}
.macro-val-wrap:hover::after{opacity:1;}
.macro-hint{font-size:11px;color:var(--t3);margin-top:4px;}
.macro-inline-input{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;color:var(--y);background:transparent;border:none;border-bottom:2px solid var(--y);outline:none;width:120px;padding:0;}`
);
html = html.replace(
  `.macro-val{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:var(--y);}`,
  `.macro-val{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;color:var(--y);line-height:1;}`
);

// 3. JS
const MACRO_JS = `
// MACROS
function loadMacros(){ return JSON.parse(localStorage.getItem("ascend_macros")||'{"calories":2600,"protein":160}'); }
function saveMacros(m){ localStorage.setItem("ascend_macros",JSON.stringify(m)); }
function renderMacros(){
  var el=document.getElementById("macroGrid"); if(!el)return;
  var m=loadMacros();
  el.innerHTML=
    "<div class=\\"macro-card\\">"
      +"<div class=\\"macro-lbl\\">Calories</div>"
      +"<div class=\\"macro-val-wrap\\" onclick=\\"editMacro('calories')\\">"
        +"<span class=\\"macro-val\\" id=\\"macro-calories\\">"+m.calories.toLocaleString()+"</span>"
        +"<span style=\\"font-size:16px;color:var(--t2);font-weight:600;\\">kcal</span>"
      +"</div>"
      +"<div class=\\"macro-hint\\">Tap to edit</div>"
    +"</div>"
    +"<div class=\\"macro-card\\">"
      +"<div class=\\"macro-lbl\\">Protein</div>"
      +"<div class=\\"macro-val-wrap\\" onclick=\\"editMacro('protein')\\">"
        +"<span class=\\"macro-val\\" id=\\"macro-protein\\">"+m.protein+"</span>"
        +"<span style=\\"font-size:16px;color:var(--t2);font-weight:600;\\">g</span>"
      +"</div>"
      +"<div class=\\"macro-hint\\">Tap to edit</div>"
    +"</div>";
}
function editMacro(key){
  var wrap=document.querySelector("#macro-"+key)?.parentElement; if(!wrap)return;
  var m=loadMacros();
  var cur=m[key];
  var unit=key==="calories"?"kcal":"g";
  wrap.innerHTML="<input class=\\"macro-inline-input\\" id=\\"macro-inp-"+key+"\\" type=\\"number\\" value=\\""+cur+"\\" /><span style=\\"font-size:16px;color:var(--t2);font-weight:600;\\">"+unit+"</span>";
  wrap.style.cursor="default";
  var inp=document.getElementById("macro-inp-"+key);
  inp.focus(); inp.select();
  function commit(){
    var val=parseInt(inp.value);
    if(!isNaN(val)&&val>0){ m[key]=val; saveMacros(m); }
    renderMacros();
  }
  inp.addEventListener("blur",commit);
  inp.addEventListener("keydown",function(e){ if(e.key==="Enter")inp.blur(); if(e.key==="Escape"){renderMacros();} });
}
`;

html = html.replace('</script>', MACRO_JS + '\n</script>');

// 4. Call renderMacros in initApp
html = html.replace(
  `  renderRoutine('nutritionBlocks', nutrition);`,
  `  renderRoutine('nutritionBlocks', nutrition);\n  renderMacros();`
);

fs.writeFileSync('app.html', html);
console.log('Done');
