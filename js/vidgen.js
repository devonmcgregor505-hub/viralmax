x`// ── VID GEN ──
function onModelChange(){
  const model=document.getElementById('vidModel').value;const cfg=MODEL_CFG[model];if(!cfg)return;
  const dur=document.getElementById('vidDur');dur.innerHTML='';cfg.durations.forEach(d=>{const o=document.createElement('option');o.value=d;o.textContent=d+'s';if(d===cfg.defaultDur)o.selected=true;dur.appendChild(o)});
  const asp=document.getElementById('vidAsp');asp.innerHTML='';cfg.aspects.forEach(ar=>{const o=document.createElement('option');o.value=ar.v;o.textContent=ar.l;if(ar.v===cfg.defaultAsp)o.selected=true;asp.appendChild(o)});
  const qRow=document.getElementById('qualRow');
  if(cfg.qualities){qRow.style.display='';const qs=document.getElementById('vidQual');qs.innerHTML='';cfg.qualities.forEach(q=>{const o=document.createElement('option');o.value=q.v;o.textContent=q.l;if(q.v===cfg.defaultQ)o.selected=true;qs.appendChild(o)});document.getElementById('vidCost').textContent=cfg.creditsByQ[cfg.defaultQ]+' cr';}
  else{qRow.style.display='none';document.getElementById('vidCost').textContent=cfg.credits+' cr'}
}
function onQualityChange(){const cfg=MODEL_CFG[document.getElementById('vidModel').value];if(cfg&&cfg.creditsByQ)document.getElementById('vidCost').textContent=cfg.creditsByQ[document.getElementById('vidQual').value]+' cr'}

// Drag/drop for vid gen
['imgDrop','imgInp'].forEach(id=>{});
document.getElementById('imgDrop').addEventListener('dragover',e=>{e.preventDefault();document.getElementById('imgDrop').classList.add('drag')});
document.getElementById('imgDrop').addEventListener('dragleave',()=>document.getElementById('imgDrop').classList.remove('drag'));
document.getElementById('imgDrop').addEventListener('drop',e=>{e.preventDefault();document.getElementById('imgDrop').classList.remove('drag');if(e.dataTransfer.files[0]&&e.dataTransfer.files[0].type.startsWith('image/'))loadVgImg(e.dataTransfer.files[0])});
document.getElementById('imgInp').addEventListener('change',()=>{if(document.getElementById('imgInp').files[0])loadVgImg(document.getElementById('imgInp').files[0])});
function loadVgImg(f){selImg=f;document.getElementById('imgFnm').textContent='📎 '+f.name;document.getElementById('imgDrop').classList.add('has');const btn=document.getElementById('imgRemoveBtn');if(btn)btn.style.display='block';}
function clearVidImg(){selImg=null;document.getElementById('imgFnm').textContent='';document.getElementById('imgDrop').classList.remove('has');document.getElementById('imgInp').value='';const btn=document.getElementById('imgRemoveBtn');if(btn)btn.style.display='none';}
function clearRefImg(){selRefImg=null;document.getElementById('refFnm').textContent='';document.getElementById('refDrop').classList.remove('has');document.getElementById('refInp').value='';const btn=document.getElementById('refRemoveBtn');if(btn)btn.style.display='none';}

async function startVidGen(){
  const prompt=document.getElementById('vgPrompt').value.trim();if(!prompt){alert('Enter a prompt');return}
  const model=document.getElementById('vidModel').value,cfg=MODEL_CFG[model];
  const dur=document.getElementById('vidDur').value,asp=document.getElementById('vidAsp').value;
  const quality=cfg.qualities?document.getElementById('vidQual').value:'720p';
  const btn=document.getElementById('vidBtn');btn.disabled=true;btn.textContent='⏳ Generating…';
  document.getElementById('vidProg').classList.add('vis');document.getElementById('vidErr').classList.remove('vis');
  document.getElementById('vidDlBtn').style.display='none';
  let pct=0;const fill=document.getElementById('vpFill'),lbl=document.getElementById('vpLbl'),pctLbl=document.getElementById('vpPct');
  const stages=['Submitting…','Queued…','Rendering…','Finalising…'];let si=0;lbl.textContent=stages[0];
  const tick=setInterval(()=>{if(pct<85){pct+=Math.random()*1.2;if(pct>85)pct=85;fill.style.width=pct+'%';pctLbl.textContent=Math.round(pct)+'%';if(pct>20&&si<1){si=1;lbl.textContent=stages[1]}if(pct>50&&si<2){si=2;lbl.textContent=stages[2]}if(pct>75&&si<3){si=3;lbl.textContent=stages[3]}}},1000);
  try{
    const fd=new FormData();if(selImg)fd.append('image',selImg);fd.append('model',model);fd.append('prompt',prompt);fd.append('duration',dur);fd.append('aspectRatio',asp);fd.append('quality',quality);
    const res=await fetch('/generate-video',{method:'POST',body:fd});
    const initData=await res.json();
    if(!initData.success||!initData.jobId)throw new Error(initData.error||'Failed to start');
    let data=null;
    for(let i=0;i<120;i++){
      await new Promise(r=>setTimeout(r,3000));
      const poll=await fetch('/job-status/'+initData.jobId);
      const pd=await poll.json();
      if(pd.status==='done'){data=pd.result;break;}
      if(pd.status==='error')throw new Error(pd.error||'Generation failed');
    }
    if(!data)throw new Error('Generation timed out');
    clearInterval(tick);fill.style.width='100%';pctLbl.textContent='100%';lbl.textContent='Done!';
    if(!data.success)throw new Error(data.error||'Unknown error');
    const vid=document.getElementById('vidVideo');vid.src=data.videoUrl;vid.style.display='block';document.getElementById('vidEmpty').style.display='none';
    const dl=document.getElementById('vidDlBtn');dl.href=data.videoUrl;dl.style.display='block';
    creds-=cfg.qualities?cfg.creditsByQ[quality]:cfg.credits;updCreds();
  }catch(err){clearInterval(tick);document.getElementById('vidErr').classList.add('vis');document.getElementById('vidErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='⚡ Generate Video';setTimeout(()=>document.getElementById('vidProg').classList.remove('vis'),2000);
}
