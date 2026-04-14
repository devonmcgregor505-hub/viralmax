// ── QUEUE POLL ──
setInterval(async()=>{
  try{const r=await fetch('/queue');const d=await r.json();document.getElementById('queuePill').textContent=`Queue: ${d.active} active, ${d.waiting} waiting`;}catch(e){}
},10000);

// ── TAB SWITCHING ──
const tabMeta={
  pipeline:['Automation','Scenes → Images → Clips'],
  vidgen:['Video Gen','AI video generation'],
  imggen:['Image Gen','AI image generation'],
  voicegen:['Voice Gen','Clone and generate voiceovers'],
  deadspace:['Silence Remover','Remove dead air from audio/video'],
  scraper:['YT Scraper','Scrape channel data for analysis'],
};

function switchTab(tab){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  const el=document.getElementById('nav-'+tab);if(el)el.classList.add('active');
  const t=tabMeta[tab]||['Viralmax',''];
  document.getElementById('topTitle').textContent=t[0];
  document.getElementById('topSub').textContent=t[1];
  document.querySelectorAll('.nav-sub-item').forEach((el,i)=>el.classList.toggle('active',tab==='pipeline'&&i===pipe.step));
  try { localStorage.setItem('vm_lastTab', tab); } catch(e) {}
  // Update URL hash without triggering a page reload
  try { history.replaceState(null, '', '/app#' + tab); } catch(e) {}
}

// ── PIPELINE STEP NAV ──
function goPipeStep(step){
  if(!pipe.unlocked.has(step))return;
  pipe.step=step;
  document.querySelectorAll('.step-btn').forEach((el,i)=>{
    el.classList.remove('active','locked','done');
    if(i===step)el.classList.add('active');
    else if(!pipe.unlocked.has(i))el.classList.add('locked');
    else if(i<step)el.classList.add('done');
  });
  document.querySelectorAll('.step-panel').forEach((el,i)=>el.classList.toggle('active',i===step));
  document.querySelectorAll('.nav-sub-item').forEach((el,i)=>el.classList.toggle('active',i===step));
  if(step===1&&typeof renderImgGrid==='function'){renderImgGrid();setTimeout(updateImgAllCost,100);}
  if(step===2&&typeof renderClipGrid==='function'){renderClipGrid();setTimeout(updateClipAllCost,100);}
}
function unlockStep(s){pipe.unlocked.add(s);const el=document.getElementById('pstep-'+s);if(el)el.classList.remove('locked')}

function animProg(fillId,pctId,lblId,target,lbl){
  const fill=document.getElementById(fillId),pctEl=document.getElementById(pctId);
  if(lblId)document.getElementById(lblId).textContent=lbl||'';
  let cur=parseFloat(fill.style.width)||0;
  const tick=setInterval(()=>{
    if(cur<target){cur=Math.min(cur+1.5,target);fill.style.width=cur+'%';pctEl.textContent=Math.round(cur)+'%';}
    else clearInterval(tick);
  },200);return tick;
}
