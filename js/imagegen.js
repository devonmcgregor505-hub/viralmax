
function setImgMode(mode){
  document.getElementById('modeImgText').classList.toggle('active',mode==='text');
  document.getElementById('modeImgImage').classList.toggle('active',mode==='image');
  document.getElementById('imgImgInput').style.display=mode==='image'?'block':'none';
}
function updateImgCharCount(el){
  document.getElementById('imgCharCount').textContent=el.value.length+'/2000';
}
// ── IMAGE GEN ──
document.getElementById('refDrop').addEventListener('dragover',e=>{e.preventDefault();document.getElementById('refDrop').classList.add('drag')});
document.getElementById('refDrop').addEventListener('dragleave',()=>document.getElementById('refDrop').classList.remove('drag'));
document.getElementById('refDrop').addEventListener('drop',e=>{e.preventDefault();document.getElementById('refDrop').classList.remove('drag');if(e.dataTransfer.files[0]){selRefImg=e.dataTransfer.files[0];document.getElementById('refFnm').textContent='📎 '+selRefImg.name;document.getElementById('refDrop').classList.add('has')}});
document.getElementById('refInp').addEventListener('change',()=>{if(document.getElementById('refInp').files[0]){selRefImg=document.getElementById('refInp').files[0];document.getElementById('refFnm').textContent='📎 '+selRefImg.name;document.getElementById('refDrop').classList.add('has');const rb=document.getElementById('refRemoveBtn');if(rb)rb.style.display='block';}});

function onImgModelChange(){const m=document.getElementById('imgModel').value;const _ic=document.getElementById('imgCostNum');if(_ic)_ic.textContent=(IMG_CFG[m]?.credits||15);}
function onImgResChange(){const m=document.getElementById('imgModel').value;const _ic=document.getElementById('imgCostNum');if(_ic)_ic.textContent=(IMG_CFG[m]?.credits||0)}

async function startImgGen(){
  const model=document.getElementById('imgModel')?.value||'nano-banana-pro';
  const cost=IMG_CFG[model]?.credits||15;
  if(!await requireCredits(cost))return;
  const prompt=document.getElementById('imgPrompt').value.trim();if(!prompt){alert('Enter a prompt');return}
  const asp=document.getElementById('imgAsp').value,res='2K';
  const btn=document.getElementById('imgBtn');btn.disabled=true;btn.style.background='#1a1a2e';btn.style.border='1px solid rgba(255,180,0,0.3)';btn.innerHTML='<span style="flex:1;text-align:center;background:linear-gradient(90deg,#FFCC00,#FF6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;font-size:17px;">Generating…</span><div id="imgBtnBar" style="position:absolute;bottom:0;left:0;height:4px;width:0%;background:linear-gradient(90deg,#FFCC00,#FF6600);border-radius:0 0 12px 12px;box-shadow:0 0 8px rgba(255,160,0,0.6);"></div>';btn.style.position='relative';btn.style.overflow='hidden';var _barPct=0;btn._barTick=setInterval(function(){if(_barPct<90){_barPct+=Math.random()*2;var b=document.getElementById('imgBtnBar');if(b)b.style.width=Math.min(_barPct,90)+'%';}},1000);
  document.getElementById('imgProg').classList.add('vis');document.getElementById('imgErr').classList.remove('vis');
  document.getElementById('dlImgBtn').style.display='none';
  let pct=0;const fill=document.getElementById('ipFill'),pctLbl=document.getElementById('ipPct');
  const tick=setInterval(()=>{if(pct<90){pct+=Math.random()*3;if(pct>90)pct=90;fill.style.width=pct+'%';pctLbl.textContent=Math.round(pct)+'%'}},600);
  try{
    const fd=new FormData();fd.append('model',model);fd.append('prompt',prompt);fd.append('aspectRatio',asp);fd.append('resolution',res);fd.append('format','PNG');if(selRefImg)fd.append('refImage',selRefImg);
    const r=await fetch('/generate-image',{method:'POST',body:fd});const data=await r.json();
    clearInterval(tick);fill.style.width='100%';pctLbl.textContent='100%';
    if(!data.success)throw new Error(data.error||'Unknown error');
    showImgPreview(data.imageUrl);
    const dl=document.getElementById('dlImgBtn');dl.href=data.imageUrl;dl.style.display='block';
    creds-=IMG_CFG[model]?.credits||0;updCreds();
  }catch(err){clearInterval(tick);document.getElementById('imgErr').classList.add('vis');document.getElementById('imgErrMsg').textContent=err.message}
  var _b=document.getElementById('imgBtnBar');if(_b)_b.style.width='100%';clearInterval(btn._barTick);setTimeout(function(){btn.disabled=false;btn.style.background='';btn.style.border='';btn.innerHTML='<div class="gen-left" style="flex:1;justify-content:center;font-size:17px;font-weight:800;letter-spacing:-.02em;">Generate Image</div><div class="credits-pill" id="imgCost" style="background:rgba(20,14,4,0.75);border:1px solid rgba(255,160,0,0.25);display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;"><img src="/public/credits-icon.png" style="width:28px;height:28px;object-fit:contain;flex-shrink:0;"><span style="color:#FFAA00;font-weight:800;font-size:13px;" id="imgCostNum">'+(window._lastImgCost||15)+'</span></div>';try{onImgModelChange();}catch(e){}btn.style.position='';btn.style.overflow='';},400);setTimeout(()=>document.getElementById('imgProg').classList.remove('vis'),2000);
}

// Auto-init dropdowns as soon as this script loads
try { onImgModelChange(); } catch(e) {}
