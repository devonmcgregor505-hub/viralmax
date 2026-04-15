
var selRefImg = null;
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

function onImgModelChange(){onImgResChange()}
function onImgResChange(){const m=document.getElementById('imgModel').value;document.getElementById('imgCost').textContent=(IMG_CFG[m]?.credits||0)+' cr'}

async function startImgGen(){
  const model=document.getElementById('imgModel')?.value||'nano-banana-pro';
  const cost=IMG_CFG[model]?.credits||15;
  if(!await requireCredits(cost))return;
  const prompt=document.getElementById('imgPrompt').value.trim();if(!prompt){alert('Enter a prompt');return}
  const model=document.getElementById('imgModel').value,asp=document.getElementById('imgAsp').value,res='2K';
  const btn=document.getElementById('imgBtn');btn.disabled=true;btn.textContent='⏳ Generating…';
  document.getElementById('imgProg').classList.add('vis');document.getElementById('imgErr').classList.remove('vis');
  document.getElementById('dlImgBtn').style.display='none';
  let pct=0;const fill=document.getElementById('ipFill'),pctLbl=document.getElementById('ipPct');
  const tick=setInterval(()=>{if(pct<90){pct+=Math.random()*3;if(pct>90)pct=90;fill.style.width=pct+'%';pctLbl.textContent=Math.round(pct)+'%'}},600);
  try{
    const fd=new FormData();fd.append('model',model);fd.append('prompt',prompt);fd.append('aspectRatio',asp);fd.append('resolution',res);fd.append('format','PNG');if(selRefImg)fd.append('refImage',selRefImg);
    const r=await fetch('/generate-image',{method:'POST',body:fd});const data=await r.json();
    clearInterval(tick);fill.style.width='100%';pctLbl.textContent='100%';
    if(!data.success)throw new Error(data.error||'Unknown error');
    const prev=document.getElementById('genImgEl');prev.src=data.imageUrl;prev.style.display='block';document.getElementById('imgEmpty').style.display='none';
    const dl=document.getElementById('dlImgBtn');dl.href=data.imageUrl;dl.style.display='block';
    creds-=IMG_CFG[model]?.credits||0;updCreds();
  }catch(err){clearInterval(tick);document.getElementById('imgErr').classList.add('vis');document.getElementById('imgErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='🎨 Generate Image';setTimeout(()=>document.getElementById('imgProg').classList.remove('vis'),2000);
}

// Auto-init dropdowns as soon as this script loads
try { onImgModelChange(); } catch(e) {}
