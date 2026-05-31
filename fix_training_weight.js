const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace training header with inline flex row same as nutrition
html = html.replace(
  `      <div class="panel-page" id="page-training">
        <div class="section-header">
          <div class="section-title">Training Split</div>
          <div class="section-sub">5 days active · Mixed training · Built for physique.</div>
        </div>
        <div id="trainingSection"></div>`,
  `      <div class="panel-page" id="page-training">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;">
          <div>
            <div class="section-title">Training</div>
            <div class="section-sub">Track your lifts and body weight.</div>
          </div>
          <div id="weightCards" style="display:flex;gap:8px;flex-shrink:0;"></div>
        </div>
        <div id="trainingSection"></div>`
);

// 2. JS
const JS = `
// BODY WEIGHT
function loadBodyWeight(){ return JSON.parse(localStorage.getItem("ascend_bodyweight")||'{"current":75,"goal":80}'); }
function saveBodyWeight(w){ localStorage.setItem("ascend_bodyweight",JSON.stringify(w)); }
function renderWeightCards(){
  var el=document.getElementById("weightCards"); if(!el)return;
  var w=loadBodyWeight();
  el.innerHTML=
    "<div class=\\"macro-card\\" onclick=\\"editBodyWeight('current')\\">"
      +"<div class=\\"macro-lbl\\">Current</div>"
      +"<span class=\\"macro-val\\" id=\\"bw-current\\">"+w.current+"</span>"
      +"<span class=\\"macro-val-unit\\">kg</span>"
    +"</div>"
    +"<div class=\\"macro-card\\" onclick=\\"editBodyWeight('goal')\\">"
      +"<div class=\\"macro-lbl\\">Goal</div>"
      +"<span class=\\"macro-val\\" style=\\"color:#22c55e\\" id=\\"bw-goal\\">"+w.goal+"</span>"
      +"<span class=\\"macro-val-unit\\">kg</span>"
    +"</div>";
}
function editBodyWeight(key){
  var card=document.getElementById("bw-"+key)?.closest(".macro-card"); if(!card)return;
  var w=loadBodyWeight(); var label=key==="current"?"Current":"Goal";
  var col=key==="current"?"var(--y)":"#22c55e";
  card.innerHTML="<div class=\\"macro-lbl\\">"+label+"</div>"
    +"<div style=\\"display:flex;align-items:baseline;gap:3px;\\">"
    +"<input class=\\"macro-inline-input\\" style=\\"color:"+col+";border-bottom-color:"+col+";\\" id=\\"bwinp-"+key+"\\" type=\\"number\\" value=\\""+w[key]+"\\" />"
    +"<span class=\\"macro-val-unit\\">kg</span></div>";
  card.onclick=null;
  var inp=document.getElementById("bwinp-"+key); inp.focus(); inp.select();
  function done(){var v=parseFloat(inp.value);if(!isNaN(v)&&v>0){w[key]=v;saveBodyWeight(w);}renderWeightCards();}
  inp.addEventListener("blur",done);
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")inp.blur();if(e.key==="Escape")renderWeightCards();});
}
`;

html = html.replace('</script>', JS + '\n</script>');

// 3. Call renderWeightCards in initApp
html = html.replace(
  `  renderTrainingSection();`,
  `  renderTrainingSection();\n  renderWeightCards();`
);

// 4. Also on page show
html = html.replace(
  `  if(name==='training') setTimeout(renderTrainingSection,10);`,
  `  if(name==='training'){setTimeout(renderTrainingSection,10);setTimeout(renderWeightCards,10);}`
);

if(!html.includes('renderWeightCards')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
