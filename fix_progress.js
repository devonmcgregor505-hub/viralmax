const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace entire progress page HTML
html = html.replace(
  `      <div class="panel-page" id="page-progress">
        <div class="section-header">
          <div class="section-title">Progress</div>
          <div class="section-sub">Track your transformation over time.</div>
        </div>
        <div class="progress-grid">
          <div class="stat-card"><div class="stat-val">3</div><div class="stat-lbl">Day streak</div></div>
          <div class="stat-card"><div class="stat-val">0</div><div class="stat-lbl">Score today</div></div>
          <div class="stat-card"><div class="stat-val">0</div><div class="stat-lbl">Days logged</div></div>
          <div class="stat-card"><div class="stat-val">7</div><div class="stat-lbl">Habits tracked</div></div>
        </div>
        <div class="card">
          <div class="card-label">Weekly check-in</div>
          <div id="progressPhotosWrap"><div class="empty-state"><div class="empty-icon">📸</div><div class="empty-title">No photos yet</div><div class="empty-sub">Complete the onboarding quiz with photos to start tracking your transformation.</div></div></div>
        </div>
      </div>`,
  `      <div class="panel-page" id="page-progress">
        <div class="section-header">
          <div class="section-title">Progress</div>
          <div class="section-sub">Track your transformation over time.</div>
        </div>

        <!-- LOOKSMAX GOALS -->
        <div class="lmg-wrap">
          <div class="lmg-header" onclick="toggleLMG()">
            <span class="lmg-title">✦ Looksmax Goals</span>
            <span class="lmg-arrow" id="lmgArrow">▼</span>
          </div>
          <div class="lmg-body" id="lmgBody" style="display:none;">
            <div id="lmgList"></div>
            <button class="lmg-add-btn" onclick="addLMGoal()">+ Add goal</button>
          </div>
        </div>

        <!-- PROGRESS PHOTOS -->
        <div class="checkin-section">
          <div class="checkin-header">
            <span class="checkin-title">Progress Photos</span>
            <button class="btn-y" style="font-size:12px;padding:7px 14px;" onclick="openCheckinUpload()">+ Add check-in</button>
          </div>
          <div id="progressPhotosWrap"></div>
        </div>

        <!-- UPLOAD MODAL -->
        <div id="checkinModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:998;display:none;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
          <div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.09);border-radius:20px;padding:28px;width:90%;max-width:480px;position:relative;">
            <button onclick="closeCheckinUpload()" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:7px;color:var(--t2);font-size:13px;cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">✕</button>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;margin-bottom:4px;">New Check-in</div>
            <div style="font-size:12px;color:var(--t2);margin-bottom:20px;">Upload up to 4 photos for this week</div>
            <div class="checkin-slots" id="checkinSlots"></div>
            <input type="file" id="checkinFileInput" accept="image/*" style="display:none" onchange="handleCheckinFile(event)">
            <button class="btn-y" style="width:100%;margin-top:16px;justify-content:center;" onclick="saveCheckin()">Save check-in</button>
          </div>
        </div>
      </div>`
);

// 2. CSS
const CSS = `
.lmg-wrap{background:var(--bg-panel);border:1px solid var(--border);border-radius:14px;margin-bottom:14px;overflow:hidden;}
.lmg-header{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;cursor:pointer;transition:background .15s;}
.lmg-header:hover{background:rgba(255,255,255,0.02);}
.lmg-title{font-size:14px;font-weight:800;color:var(--text);}
.lmg-arrow{font-size:11px;color:var(--t3);transition:transform .2s;}
.lmg-arrow.open{transform:rotate(180deg);}
.lmg-body{padding:0 18px 16px;}
.lmg-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.lmg-item:last-child{border-bottom:none;}
.lmg-check{width:20px;height:20px;border-radius:6px;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.lmg-check.done{background:var(--y);border-color:var(--y);}
.lmg-check.done::after{content:'✓';font-size:10px;font-weight:900;color:#000;}
.lmg-input{flex:1;background:transparent;border:none;outline:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--text);}
.lmg-input.done{color:var(--t3);text-decoration:line-through;}
.lmg-del{background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color .15s;}
.lmg-del:hover{color:var(--red);}
.lmg-add-btn{width:100%;padding:9px;background:transparent;border:1px dashed rgba(255,255,255,0.08);border-radius:9px;color:var(--t2);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;margin-top:10px;}
.lmg-add-btn:hover{border-color:var(--y);color:var(--y);}
.checkin-section{margin-top:4px;}
.checkin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.checkin-title{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);}
.checkin-block{background:var(--bg-panel);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px;}
.checkin-block-date{font-size:10px;font-weight:800;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
.checkin-block-del{background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;transition:color .15s;}
.checkin-block-del:hover{color:var(--red);}
.checkin-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.checkin-photo-slot{border-radius:10px;overflow:hidden;aspect-ratio:3/4;background:rgba(255,255,255,0.03);border:1px solid var(--border);position:relative;}
.checkin-photo-slot img{width:100%;height:100%;object-fit:cover;}
.checkin-photo-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.65);font-size:9px;color:#fff;text-align:center;padding:4px;letter-spacing:.04em;font-weight:700;}
.upload-slot{border-radius:10px;aspect-ratio:3/4;border:1.5px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;background:rgba(255,255,255,0.02);position:relative;overflow:hidden;}
.upload-slot:hover{border-color:var(--y);background:rgba(255,200,0,0.04);}
.upload-slot.filled{border-color:var(--y);border-style:solid;}
.upload-slot img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.upload-slot-label{font-size:9px;font-weight:700;color:var(--t3);text-align:center;padding:0 4px;letter-spacing:.04em;z-index:1;}
.upload-slot-icon{font-size:18px;margin-bottom:4px;z-index:1;}
.upload-slot.filled .upload-slot-label{display:none;}
.upload-slot.filled .upload-slot-icon{display:none;}
.upload-slot-remove{position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.8);border:none;color:#fff;font-size:9px;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:2;}
.upload-slot.filled .upload-slot-remove{display:flex;}`;

html = html.replace('</style>', CSS + '\n</style>');

// 3. JS
const JS = `
// LOOKSMAX GOALS
var DEFAULT_LMG = [
  {id:1, text:'Clear skin — no active breakouts', done:false},
  {id:2, text:'Get to 10-12% body fat', done:false},
  {id:3, text:'Achieve Denji/Matt Rife hairstyle', done:false},
  {id:4, text:'Build strong jaw definition', done:false},
  {id:5, text:'Fix forward head posture', done:false},
  {id:6, text:'Reach 75kg lean bodyweight', done:false},
];
function loadLMG(){ return JSON.parse(localStorage.getItem("ascend_lmg")||JSON.stringify(DEFAULT_LMG)); }
function saveLMG(g){ localStorage.setItem("ascend_lmg",JSON.stringify(g)); }
function toggleLMG(){
  var body=document.getElementById("lmgBody");
  var arrow=document.getElementById("lmgArrow");
  if(!body)return;
  var open=body.style.display!=="none";
  body.style.display=open?"none":"block";
  if(arrow) arrow.classList.toggle("open",!open);
  if(!open) renderLMG();
}
function renderLMG(){
  var el=document.getElementById("lmgList"); if(!el)return;
  var goals=loadLMG();
  el.innerHTML=goals.map(function(g){
    return "<div class=\\"lmg-item\\">"
      +"<div class=\\"lmg-check"+(g.done?" done":"")+"\\" onclick=\\"toggleLMGoal("+g.id+")\\" ></div>"
      +"<input class=\\"lmg-input"+(g.done?" done":"")+"\\" value=\\""+g.text+"\\" onchange=\\"updateLMGoal("+g.id+",this.value)\\"/>"
      +"<button class=\\"lmg-del\\" onclick=\\"deleteLMGoal("+g.id+")\\">✕</button>"
      +"</div>";
  }).join("");
}
function toggleLMGoal(id){
  var g=loadLMG(); var item=g.find(function(x){return x.id===id;}); if(!item)return;
  item.done=!item.done; saveLMG(g); renderLMG();
}
function updateLMGoal(id,val){
  var g=loadLMG(); var item=g.find(function(x){return x.id===id;}); if(!item)return;
  item.text=val; saveLMG(g);
}
function deleteLMGoal(id){
  saveLMG(loadLMG().filter(function(x){return x.id!==id;})); renderLMG();
}
function addLMGoal(){
  var g=loadLMG(); g.push({id:Date.now(),text:"New goal",done:false}); saveLMG(g); renderLMG();
  setTimeout(function(){var inputs=document.querySelectorAll(".lmg-input");if(inputs.length)inputs[inputs.length-1].focus();},50);
}

// PROGRESS PHOTOS
var _checkinPhotos=[null,null,null,null];
var _activeCheckinSlot=0;
var CHECKIN_LABELS=["Face Front","Face Side","Body Front","Body Side"];

function openCheckinUpload(){
  _checkinPhotos=[null,null,null,null];
  renderCheckinSlots();
  var m=document.getElementById("checkinModal"); if(m){m.style.display="flex";}
}
function closeCheckinUpload(){
  var m=document.getElementById("checkinModal"); if(m){m.style.display="none";}
}
function renderCheckinSlots(){
  var el=document.getElementById("checkinSlots"); if(!el)return;
  el.innerHTML="<div style=\\"display:grid;grid-template-columns:repeat(4,1fr);gap:8px;\\">"
    +_checkinPhotos.map(function(p,i){
      return "<div class=\\"upload-slot"+(p?" filled":"")+"\\" onclick=\\"triggerCheckinSlot("+i+")\\">"
        +(p?"<img src=\\""+p+"\\" />":"")
        +"<span class=\\"upload-slot-icon\\">📷</span>"
        +"<span class=\\"upload-slot-label\\">"+CHECKIN_LABELS[i]+"</span>"
        +"<button class=\\"upload-slot-remove\\" onclick=\\"removeCheckinPhoto(event,"+i+")\\" >✕</button>"
        +"</div>";
    }).join("")
    +"</div>";
}
function triggerCheckinSlot(i){
  _activeCheckinSlot=i;
  document.getElementById("checkinFileInput").click();
}
function removeCheckinPhoto(e,i){
  e.stopPropagation(); _checkinPhotos[i]=null; renderCheckinSlots();
}
function handleCheckinFile(e){
  var file=e.target.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var scale=Math.min(1,800/img.width);
      var canvas=document.createElement("canvas");
      canvas.width=img.width*scale; canvas.height=img.height*scale;
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      _checkinPhotos[_activeCheckinSlot]=canvas.toDataURL("image/jpeg",0.7);
      renderCheckinSlots();
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value="";
}
function saveCheckin(){
  var photos=_checkinPhotos.filter(function(p){return p;});
  if(!photos.length){closeCheckinUpload();return;}
  var checkins=JSON.parse(localStorage.getItem("ascend_checkins")||"[]");
  checkins.unshift({date:new Date().toISOString(),photos:_checkinPhotos});
  localStorage.setItem("ascend_checkins",JSON.stringify(checkins.slice(0,12)));
  closeCheckinUpload();
  renderProgressPhotos();
}
function deleteCheckin(idx){
  var checkins=JSON.parse(localStorage.getItem("ascend_checkins")||"[]");
  checkins.splice(idx,1);
  localStorage.setItem("ascend_checkins",JSON.stringify(checkins));
  renderProgressPhotos();
}
function renderProgressPhotos(){
  var el=document.getElementById("progressPhotosWrap"); if(!el)return;
  var checkins=JSON.parse(localStorage.getItem("ascend_checkins")||"[]");
  if(!checkins.length){
    el.innerHTML="<div class=\\"empty-state\\"><div class=\\"empty-icon\\">📸</div><div class=\\"empty-title\\">No check-ins yet</div><div class=\\"empty-sub\\">Tap + Add check-in to upload your first progress photos.</div></div>";
    return;
  }
  el.innerHTML=checkins.map(function(c,ci){
    var d=new Date(c.date);
    var diffDays=Math.floor((Date.now()-d)/86400000);
    var dateStr=d.toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"});
    var agoStr=diffDays===0?"Today":diffDays===1?"Yesterday":diffDays+" days ago";
    var photos=c.photos||[];
    return "<div class=\\"checkin-block\\">"
      +"<div class=\\"checkin-block-date\\"><span>"+dateStr+" · "+agoStr+"</span>"
      +"<button class=\\"checkin-block-del\\" onclick=\\"deleteCheckin("+ci+")\\" title=\\"Remove check-in\\">✕ Remove</button></div>"
      +"<div class=\\"checkin-photo-grid\\">"
      +photos.map(function(p,pi){
        return p
          ? "<div class=\\"checkin-photo-slot\\"><img src=\\""+p+"\\" /><div class=\\"checkin-photo-label\\">"+CHECKIN_LABELS[pi]+"</div></div>"
          : "<div class=\\"checkin-photo-slot\\" style=\\"opacity:.3;\\"><div class=\\"checkin-photo-label\\">"+CHECKIN_LABELS[pi]+"</div></div>";
      }).join("")
      +"</div></div>";
  }).join("");
}
`;

html = html.replace('</script>', JS + '\n</script>');

// 4. Replace old renderProgressPhotos function
html = html.replace(
  /function renderProgressPhotos\(\)\{[\s\S]*?\.join\(''\);\s*\}/,
  '// renderProgressPhotos replaced above'
);

// 5. Call renderProgressPhotos in initApp
html = html.replace(
  `  renderProgressPhotos();`,
  `  renderProgressPhotos();\n  // lmg loaded on open`
);

// 6. Also call on page show
html = html.replace(
  `  if(name==='training') setTimeout(renderTrainingSection,10);`,
  `  if(name==='training') setTimeout(renderTrainingSection,10);\n  if(name==='progress'){setTimeout(renderProgressPhotos,10);}`
);

if(!html.includes('toggleLMG')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
