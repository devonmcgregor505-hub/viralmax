const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Replace DEFAULT_LMG
html = html.replace(
  /var DEFAULT_LMG = \[[\s\S]*?\];/,
  `var DEFAULT_LMG = [
  {id:1, text:'Hair', done:false, notes:'', images:[]},
  {id:2, text:'Skin', done:false, notes:'', images:[]},
  {id:3, text:'Bloating', done:false, notes:'', images:[]},
  {id:4, text:'Teeth', done:false, notes:'', images:[]},
  {id:5, text:'Eyebrows', done:false, notes:'', images:[]},
  {id:6, text:'Posture', done:false, notes:'', images:[]},
  {id:7, text:'Physique', done:false, notes:'', images:[]},
  {id:8, text:'Smell', done:false, notes:'', images:[]},
  {id:9, text:'Voice', done:false, notes:'', images:[]},
];`
);

// 2. Replace renderLMG to show clickable rows (no inline text input — click opens popup)
html = html.replace(
  /function renderLMG\(\)\{[\s\S]*?\}(?=\nfunction toggleLMGoal)/,
  `function renderLMG(){
  var el=document.getElementById("lmgList"); if(!el)return;
  var goals=loadLMG();
  el.innerHTML=goals.map(function(g){
    var hasNotes=g.notes&&g.notes.trim().length>0;
    var imgCount=(g.images||[]).filter(Boolean).length;
    return "<div class=\\"lmg-item\\">"
      +"<div class=\\"lmg-check"+(g.done?" done":"")+"\\" onclick=\\"toggleLMGoal("+g.id+")\\" ></div>"
      +"<div class=\\"lmg-item-body\\" onclick=\\"openLMGDetail("+g.id+")\\">"
      +"<span class=\\"lmg-item-text"+(g.done?" done":"")+"\\" >"+g.text+"</span>"
      +(hasNotes||imgCount?"<span class=\\"lmg-item-meta\\">"+(hasNotes?"📝 ":"")+( imgCount?imgCount+" 🖼":"")+"</span>":"")
      +"</div>"
      +"<button class=\\"lmg-del\\" onclick=\\"deleteLMGoal("+g.id+")\\">✕</button>"
      +"</div>";
  }).join("");
}`
);

// 3. Replace addLMGoal to include notes/images fields
html = html.replace(
  /function addLMGoal\(\)\{[\s\S]*?\}/,
  `function addLMGoal(){
  var g=loadLMG(); g.push({id:Date.now(),text:"New goal",done:false,notes:"",images:[]}); saveLMG(g); renderLMG();
  setTimeout(function(){ openLMGDetail(g[g.length-1].id); },50);
}`
);

// 4. Add openLMGDetail + saveLMGDetail + CSS + modal HTML via JS injection
const NEW_JS = `
function openLMGDetail(id){
  var goals=loadLMG();
  var g=goals.find(function(x){return x.id===id;}); if(!g)return;
  var images=g.images||[];
  var existing=document.getElementById("lmgDetailModal");
  if(existing)existing.remove();
  var modal=document.createElement("div");
  modal.id="lmgDetailModal";
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);";
  modal.innerHTML="<div style=\\"background:var(--bg-card);border:1px solid rgba(255,255,255,0.09);border-radius:20px;padding:28px;width:90%;max-width:520px;max-height:88vh;overflow-y:auto;position:relative;\\">"
    +"<button onclick=\\"closeLMGDetail()\\" style=\\"position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:7px;color:var(--t2);font-size:13px;cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;\\">✕</button>"
    +"<div style=\\"font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;margin-bottom:4px;\\">"+g.text+"</div>"
    +"<div style=\\"font-size:11px;color:var(--t3);margin-bottom:20px;\\">Click the title above to rename</div>"
    +"<input id=\\"lmg-title-inp\\" value=\\""+g.text+"\\" style=\\"width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:9px;color:var(--text);font-family:inherit;font-size:14px;font-weight:700;padding:10px 13px;outline:none;margin-bottom:18px;\\" placeholder=\\"Goal name\\"/>"
    +"<div style=\\"font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:8px;\\">How I'll achieve this</div>"
    +"<textarea id=\\"lmg-notes-inp\\" placeholder=\\"Write your plan, research, steps...\\""
    +" style=\\"width:100%;min-height:130px;background:var(--bg-input);border:1px solid var(--border);border-radius:9px;color:var(--text);font-family:inherit;font-size:13px;line-height:1.6;padding:11px 13px;outline:none;resize:vertical;margin-bottom:18px;\\">"+g.notes+"</textarea>"
    +"<div style=\\"font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:10px;\\">Inspo Images</div>"
    +"<div id=\\"lmg-img-grid\\" style=\\"display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;\\">"
    +renderLMGImageSlots(images)
    +"</div>"
    +"<input type=\\"file\\" id=\\"lmgImgInput\\" accept=\\"image/*\\" style=\\"display:none\\" onchange=\\"handleLMGImage(event,"+id+")\\">"
    +"<button onclick=\\"document.getElementById('lmgImgInput').click()\\" style=\\"width:100%;padding:9px;background:transparent;border:1px dashed rgba(255,255,255,0.1);border-radius:9px;color:var(--t2);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;margin-bottom:16px;\\" onmouseover=\\"this.style.borderColor='var(--y)';this.style.color='var(--y)'\\" onmouseout=\\"this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='var(--t2)'\\">+ Add inspo image</button>"
    +"<button onclick=\\"saveLMGDetail("+id+")\\" style=\\"width:100%;padding:11px;background:linear-gradient(135deg,#FFCC00,#FF9500);border:none;border-radius:10px;color:#000;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;\\">Save</button>"
    +"</div>";
  document.body.appendChild(modal);
  document.getElementById("lmg-notes-inp").focus();
}
function renderLMGImageSlots(images){
  var html="";
  for(var i=0;i<4;i++){
    var img=images[i]||null;
    html+="<div style=\\"border-radius:9px;aspect-ratio:1;overflow:hidden;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);position:relative;\\">"
      +(img?"<img src=\\""+img+"\\" style=\\"width:100%;height:100%;object-fit:cover;\\" /><button onclick=\\"removeLMGImage("+i+")\\" style=\\"position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.8);border:none;color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;\\">✕</button>":"<span style=\\"position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--t4);\\">🖼</span>")
      +"</div>";
  }
  return html;
}
var _editingLMGId=null;
var _lmgEditImages=[];
function handleLMGImage(e,id){
  var file=e.target.files[0]; if(!file)return;
  _editingLMGId=id;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img2=new Image();
    img2.onload=function(){
      var scale=Math.min(1,600/img2.width);
      var canvas=document.createElement("canvas");
      canvas.width=img2.width*scale;canvas.height=img2.height*scale;
      canvas.getContext("2d").drawImage(img2,0,0,canvas.width,canvas.height);
      var data=canvas.toDataURL("image/jpeg",0.7);
      var goals=loadLMG();
      var g=goals.find(function(x){return x.id===id;}); if(!g)return;
      if(!g.images)g.images=[];
      var slot=g.images.indexOf(null);
      if(slot===-1&&g.images.length<4)slot=g.images.length;
      if(slot===-1)slot=3;
      g.images[slot]=data;
      saveLMG(goals);
      var grid=document.getElementById("lmg-img-grid");
      if(grid)grid.innerHTML=renderLMGImageSlots(g.images);
    };
    img2.src=ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value="";
}
function removeLMGImage(idx){
  var modal=document.getElementById("lmgDetailModal"); if(!modal)return;
  var titleInp=document.getElementById("lmg-title-inp");
  var id=parseInt(modal.querySelector("button[onclick*='saveLMGDetail']").getAttribute("onclick").match(/\d+/)[0]);
  var goals=loadLMG();
  var g=goals.find(function(x){return x.id===id;}); if(!g||!g.images)return;
  g.images[idx]=null;
  saveLMG(goals);
  var grid=document.getElementById("lmg-img-grid");
  if(grid)grid.innerHTML=renderLMGImageSlots(g.images);
}
function saveLMGDetail(id){
  var goals=loadLMG();
  var g=goals.find(function(x){return x.id===id;}); if(!g)return;
  var titleInp=document.getElementById("lmg-title-inp");
  var notesInp=document.getElementById("lmg-notes-inp");
  if(titleInp)g.text=titleInp.value.trim()||g.text;
  if(notesInp)g.notes=notesInp.value;
  saveLMG(goals);
  closeLMGDetail();
  renderLMG();
}
function closeLMGDetail(){
  var m=document.getElementById("lmgDetailModal"); if(m)m.remove();
}
`;

// 5. Add CSS for lmg-item-body clickable
const NEW_CSS = `
.lmg-item-body{flex:1;cursor:pointer;display:flex;align-items:center;gap:8px;padding:2px 0;}
.lmg-item-body:hover .lmg-item-text{color:var(--y);}
.lmg-item-text{font-size:13px;font-weight:700;color:var(--text);transition:color .15s;}
.lmg-item-text.done{color:var(--t3);text-decoration:line-through;}
.lmg-item-meta{font-size:10px;color:var(--t3);}`;

html = html.replace('</style>', NEW_CSS + '\n</style>');
html = html.replace('</script>', NEW_JS + '\n</script>');

if(!html.includes('openLMGDetail')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
