const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// ─── 1. Replace static macro grid HTML ───
html = html.replace(
  `        <div class="macro-grid">
          <div class="macro-card"><div class="macro-val">2,600</div><div class="macro-lbl">Calories</div></div>
          <div class="macro-card"><div class="macro-val">160g</div><div class="macro-lbl">Protein</div></div>
          <div class="macro-card"><div class="macro-val">3L</div><div class="macro-lbl">Water</div></div>
        </div>`,
  `        <div class="macro-grid" id="macroGrid"></div>`
);

// ─── 2. Update macro-grid CSS to 2 cols ───
html = html.replace(
  '.macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}',
  '.macro-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}'
);

// ─── 3. Upgrade macro-card CSS for edit mode ───
html = html.replace(
  '.macro-card{background:var(--bg-panel);border-radius:var(--rs);padding:14px;text-align:center;}',
  `.macro-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rs);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;transition:border-color .15s;}
.macro-card:hover{border-color:rgba(255,255,255,0.1);}
.macro-card-left{display:flex;flex-direction:column;}
.macro-edit-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;color:var(--t2);font-size:11px;font-weight:600;padding:5px 11px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;}
.macro-edit-btn:hover{border-color:rgba(255,200,0,0.3);color:var(--y);}
.macro-edit-row{display:flex;align-items:center;gap:6px;margin-top:6px;}
.macro-input{width:80px;background:var(--bg-input);border:1px solid var(--border-y);border-radius:7px;color:var(--y);font-family:'Bebas Neue',sans-serif;font-size:22px;padding:4px 10px;outline:none;letter-spacing:1px;}
.macro-input:focus{border-color:var(--y);}
.macro-input-unit{font-size:12px;color:var(--t2);font-weight:600;}`
);

// ─── 4. JS — macro rendering + save/load ───
const MACRO_JS = `
// MACROS
var MACRO_DEFAULTS = {calories: 2600, protein: 160};
function loadMacros(){
  return JSON.parse(localStorage.getItem('ascend_macros') || JSON.stringify(MACRO_DEFAULTS));
}
function saveMacros(m){
  localStorage.setItem('ascend_macros', JSON.stringify(m));
}
function renderMacros(){
  var el = document.getElementById('macroGrid');
  if(!el) return;
  var m = loadMacros();
  el.innerHTML =
    macroCard('calories', m.calories, 'Calories', 'kcal') +
    macroCard('protein', m.protein, 'Protein', 'g');
}
function macroCard(key, val, label, unit){
  return '<div class="macro-card">'
    + '<div class="macro-card-left">'
    + '<div class="macro-lbl">' + label + '</div>'
    + '<div class="macro-val" id="macroval-' + key + '">' + (key==='calories'?val.toLocaleString():val) + (key==='protein'?'<span style="font-size:16px;opacity:.7">g</span>':'<span style="font-size:14px;opacity:.6"> kcal</span>') + '</div>'
    + '</div>'
    + '<button class="macro-edit-btn" onclick="startMacroEdit(\'' + key + '\',' + val + ',\'' + unit + '\')">Edit</button>'
    + '</div>';
}
function startMacroEdit(key, current, unit){
  var el = document.getElementById('macroGrid');
  if(!el) return;
  var m = loadMacros();
  var label = key === 'calories' ? 'Calories' : 'Protein';
  el.innerHTML =
    '<div class="macro-card" style="grid-column:1/-1;flex-direction:column;align-items:flex-start;gap:10px;">'
    + '<div class="macro-lbl">Set ' + label + ' target</div>'
    + '<div class="macro-edit-row">'
    + '<input class="macro-input" id="macroEditInput" type="number" value="' + current + '" min="0" />'
    + '<span class="macro-input-unit">' + unit + '</span>'
    + '</div>'
    + '<div style="display:flex;gap:8px;">'
    + '<button class="macro-edit-btn" style="background:var(--yd);border-color:var(--border-y);color:var(--y);" onclick="saveMacroEdit(\'' + key + '\')">Save</button>'
    + '<button class="macro-edit-btn" onclick="renderMacros()">Cancel</button>'
    + '</div>'
    + '</div>';
  setTimeout(function(){ var inp = document.getElementById('macroEditInput'); if(inp){inp.focus();inp.select();} }, 50);
}
function saveMacroEdit(key){
  var inp = document.getElementById('macroEditInput');
  if(!inp) return;
  var val = parseInt(inp.value);
  if(isNaN(val) || val < 0) return;
  var m = loadMacros();
  m[key] = val;
  saveMacros(m);
  renderMacros();
}
`;

html = html.replace('</script>', MACRO_JS + '\n</script>');

// ─── 5. Call renderMacros() in initApp ───
html = html.replace(
  `  renderRoutine('nutritionBlocks', nutrition);`,
  `  renderRoutine('nutritionBlocks', nutrition);\n  renderMacros();`
);

if(!html.includes('renderMacros')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
