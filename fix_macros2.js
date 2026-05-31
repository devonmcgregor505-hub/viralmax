const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Remove the broken MACRO_JS that was injected
html = html.replace(/\n\/\/ MACROS[\s\S]*?renderMacros\(\);\n}\n/g, '\n');

// Inject clean version using double quotes throughout
const MACRO_JS = `
// MACROS
var MACRO_DEFAULTS = {calories:2600,protein:160};
function loadMacros(){ return JSON.parse(localStorage.getItem("ascend_macros")||JSON.stringify(MACRO_DEFAULTS)); }
function saveMacros(m){ localStorage.setItem("ascend_macros",JSON.stringify(m)); }
function renderMacros(){
  var el=document.getElementById("macroGrid"); if(!el)return;
  var m=loadMacros();
  el.innerHTML=macroCard("calories",m.calories,"Calories","kcal")+macroCard("protein",m.protein,"Protein","g");
}
function macroCard(key,val,label,unit){
  var dispVal = key==="calories" ? val.toLocaleString() : val;
  var dispUnit = key==="calories" ? " kcal" : "g";
  return "<div class=\\"macro-card\\">"
    +"<div class=\\"macro-card-left\\">"
    +"<div class=\\"macro-lbl\\">"+label+"</div>"
    +"<div class=\\"macro-val\\" id=\\"macroval-"+key+"\\">"+dispVal+"<span style=\\"font-size:14px;opacity:.6\\">"+dispUnit+"</span></div>"
    +"</div>"
    +"<button class=\\"macro-edit-btn\\" onclick=\\"startMacroEdit(&quot;"+key+"&quot;,"+val+",&quot;"+unit+"&quot;)\\">Edit</button>"
    +"</div>";
}
function startMacroEdit(key,current,unit){
  var el=document.getElementById("macroGrid"); if(!el)return;
  var label=key==="calories"?"Calories":"Protein";
  el.innerHTML="<div class=\\"macro-card\\" style=\\"grid-column:1/-1;flex-direction:column;align-items:flex-start;gap:10px;\\">"
    +"<div class=\\"macro-lbl\\">Set "+label+" target</div>"
    +"<div class=\\"macro-edit-row\\">"
    +"<input class=\\"macro-input\\" id=\\"macroEditInput\\" type=\\"number\\" value=\\""+current+"\\" min=\\"0\\" />"
    +"<span class=\\"macro-input-unit\\">"+unit+"</span>"
    +"</div>"
    +"<div style=\\"display:flex;gap:8px;\\">"
    +"<button class=\\"macro-edit-btn\\" style=\\"background:var(--yd);border-color:var(--border-y);color:var(--y);\\" onclick=\\"saveMacroEdit(&quot;"+key+"&quot;)\\">Save</button>"
    +"<button class=\\"macro-edit-btn\\" onclick=\\"renderMacros()\\">Cancel</button>"
    +"</div></div>";
  setTimeout(function(){var inp=document.getElementById("macroEditInput");if(inp){inp.focus();inp.select();}},50);
}
function saveMacroEdit(key){
  var inp=document.getElementById("macroEditInput"); if(!inp)return;
  var val=parseInt(inp.value); if(isNaN(val)||val<0)return;
  var m=loadMacros(); m[key]=val; saveMacros(m); renderMacros();
}
`;

html = html.replace('</script>', MACRO_JS + '\n</script>');
fs.writeFileSync('app.html', html);
console.log('Done');
