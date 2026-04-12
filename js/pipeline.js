// ── STEP 1: IDEATION ──
const chFileDrop=document.getElementById('chFileDrop'),chFileInput=document.getElementById('chFileInput');
chFileDrop.addEventListener('dragover',e=>{e.preventDefault();chFileDrop.classList.add('drag')});
chFileDrop.addEventListener('dragleave',()=>chFileDrop.classList.remove('drag'));
chFileDrop.addEventListener('drop',e=>{e.preventDefault();chFileDrop.classList.remove('drag');Array.from(e.dataTransfer.files).forEach(f=>loadChFile(f))});
chFileInput.addEventListener('change',()=>{Array.from(chFileInput.files).forEach(f=>loadChFile(f));chFileInput.value=''});

function loadChFile(f){
  if(!f.name.endsWith('.json')){alert('JSON only');return}
  if(pipe.channelFiles.length>=10){alert('Max 10');return}
  if(pipe.channelFiles.find(x=>x.name===f.name))return;
  const r=new FileReader();r.onload=e=>{try{pipe.channelFiles.push({name:f.name,data:JSON.parse(e.target.result)});renderChips();updIdeateBtn();}catch{alert('Bad JSON: '+f.name)}};r.readAsText(f);
}
function renderChips(){
  const c=document.getElementById('chChips');c.innerHTML='';
  pipe.channelFiles.forEach((cf,i)=>{const chip=document.createElement('div');chip.className='chip';chip.innerHTML=`📁 ${cf.name.replace('.json','')} <button class="chip-del" onclick="removeChFile(${i})">✕</button>`;c.appendChild(chip)});
  chFileDrop.classList.toggle('has',pipe.channelFiles.length>0);
}
function removeChFile(i){pipe.channelFiles.splice(i,1);renderChips();updIdeateBtn()}
function updIdeateBtn(){document.getElementById('ideateBtn').disabled=pipe.channelFiles.length===0}
function useCustomIdea(){
  const v=document.getElementById('customIdeaInp').value.trim();if(!v)return;
  pipe.ideas=[v];pipe.selectedIdea=v;renderIdeaCards([v],0);
  document.getElementById('ideaContinueBtn').style.display='block';
}
async function runIdeation(){
  if(!pipe.channelFiles.length)return;
  const btn=document.getElementById('ideateBtn');btn.disabled=true;btn.textContent='⏳ Analysing…';
  document.getElementById('ideateProg').classList.add('vis');document.getElementById('ideateErr').classList.remove('vis');
  document.getElementById('ideaContinueBtn').style.display='none';
  const tick=animProg('ideateProgFill','ideateProgPct','ideateProgLbl',85,'Analysing channels…');
  try{
    const fd=new FormData();pipe.channelFiles.forEach(cf=>{const b=new Blob([JSON.stringify(cf.data)],{type:'application/json'});fd.append('channelFiles',b,cf.name)});
    const res=await fetch('/pipeline/ideate',{method:'POST',body:fd});const data=await res.json();
    clearInterval(tick);document.getElementById('ideateProgFill').style.width='100%';document.getElementById('ideateProgPct').textContent='100%';
    if(!data.success)throw new Error(data.error);
    pipe.ideas=data.ideas;pipe.selectedIdea=null;renderIdeaCards(data.ideas,null);
  }catch(err){clearInterval(tick);document.getElementById('ideateErr').classList.add('vis');document.getElementById('ideateErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='⚡ Generate 5 Ideas';setTimeout(()=>document.getElementById('ideateProg').classList.remove('vis'),2000);
}
function renderIdeaCards(ideas,selIdx){
  const c=document.getElementById('ideaCards');c.innerHTML='';
  ideas.forEach((idea,i)=>{
    const card=document.createElement('div');card.className='idea-card'+(i===selIdx?' sel':'');card.onclick=()=>selectIdea(i);
    card.innerHTML=`<div class="idea-num">${String(i+1).padStart(2,'0')}</div><div class="idea-txt">${idea}</div><div class="idea-chk">✓</div>`;
    c.appendChild(card);
  });
  if(selIdx!==null)document.getElementById('ideaContinueBtn').style.display='block';
}
function selectIdea(idx){pipe.selectedIdea=pipe.ideas[idx];document.querySelectorAll('.idea-card').forEach((c,i)=>c.classList.toggle('sel',i===idx));document.getElementById('ideaContinueBtn').style.display='block';}
function continueToScript(){if(!pipe.selectedIdea){alert('Select an idea');return}unlockStep(1);goPipeStep(1);document.getElementById('scriptIdeaDisplay').textContent=pipe.selectedIdea}

// ── STEP 2: SCRIPT ──
async function runScriptGen(){
  const btn=document.getElementById('scriptGenBtn');btn.disabled=true;btn.textContent='⏳ Writing…';
  document.getElementById('scriptProg').classList.add('vis');document.getElementById('scriptErr').classList.remove('vis');
  document.getElementById('scriptContinueBtn').style.display='none';
  const tick=animProg('scriptProgFill','scriptProgPct','scriptProgLbl',90,'Writing script…');
  try{
    const res=await fetch('/pipeline/script',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idea:pipe.selectedIdea,channelData:pipe.channelFiles.map(f=>f.data),customPrompt:document.getElementById('scriptCustomPrompt').value.trim()})});
    const data=await res.json();clearInterval(tick);document.getElementById('scriptProgFill').style.width='100%';document.getElementById('scriptProgPct').textContent='100%';
    if(!data.success)throw new Error(data.error);
    pipe.script=data.script;document.getElementById('scriptOutput').value=data.script;document.getElementById('scriptContinueBtn').style.display='block';
  }catch(err){clearInterval(tick);document.getElementById('scriptErr').classList.add('vis');document.getElementById('scriptErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='📝 Generate Script';setTimeout(()=>document.getElementById('scriptProg').classList.remove('vis'),2000);
}
function onScriptEdit(){pipe.script=document.getElementById('scriptOutput').value;if(pipe.script.trim())document.getElementById('scriptContinueBtn').style.display='block'}
function continueToVoiceover(){
  pipe.script=document.getElementById('scriptOutput').value.trim();if(!pipe.script){alert('Write a script first');return}
  unlockStep(2);goPipeStep(2);renderPipeVoiceSel();
}

// ── STEP 3: VOICEOVER ──
function renderPipeVoiceSel(){
  const sel=document.getElementById('pipeVoiceSel');const voices=loadVoices();
  sel.innerHTML=voices.length?'':'<option value="">No voices — add one</option>';
  voices.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.name;sel.appendChild(o)});
  if(voices.length){pipeVoiceId=voices[0].id;sel.value=pipeVoiceId}
}
async function runPipelineVoice(){
  if(!pipeVoiceId){alert('Add a voice first');return}
  const btn=document.getElementById('pipeVoiceBtn');btn.disabled=true;btn.textContent='⏳ Generating…';
  document.getElementById('pipeVoiceProg').classList.add('vis');document.getElementById('pipeVoiceErr').classList.remove('vis');
  document.getElementById('pipeVoiceResult').style.display='none';document.getElementById('pipeVoiceEmpty').style.display='flex';
  const tick=animProg('pipeVoiceProgFill','pipeVoiceProgPct','pipeVoiceProgLbl',95,'Generating audio…');
  try{
    const voices=loadVoices();const v=voices.find(x=>x.id===pipeVoiceId);if(!v)throw new Error('Voice not found');
    const byteStr=atob(v.audioB64),ab=new ArrayBuffer(byteStr.length),ia=new Uint8Array(ab);
    for(let i=0;i<byteStr.length;i++)ia[i]=byteStr.charCodeAt(i);
    const blob=new Blob([ab],{type:v.mimeType||'audio/wav'});
    const fd=new FormData();fd.append('text',pipe.script.trim());fd.append('exaggeration',document.getElementById('pipeExagSlider').value);fd.append('cfgWeight','0.5');fd.append('temperature','0.8');fd.append('voiceSample',blob,'voice.wav');
    const res=await fetch('/generate-voice',{method:'POST',body:fd});const data=await res.json();
    clearInterval(tick);document.getElementById('pipeVoiceProgFill').style.width='100%';document.getElementById('pipeVoiceProgPct').textContent='100%';
    if(!data.success)throw new Error(data.error);
    pipe.voiceUrl=data.audioUrl;document.getElementById('pipeAudioPlayer').src=data.audioUrl;document.getElementById('pipeAudioDl').href=data.audioUrl;
    document.getElementById('pipeVoiceEmpty').style.display='none';document.getElementById('pipeVoiceResult').style.display='flex';
  }catch(err){clearInterval(tick);document.getElementById('pipeVoiceErr').classList.add('vis');document.getElementById('pipeVoiceErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='🎙 Generate Voiceover';setTimeout(()=>document.getElementById('pipeVoiceProg').classList.remove('vis'),2000);
}
function continueToSilenceRemove(){
  unlockStep(3);goPipeStep(3);
  if(pipe.voiceUrl){document.getElementById('pipeSilTitle').textContent='Voiceover ready';document.getElementById('pipeSilFname').textContent=pipe.voiceUrl}
}

// ── STEP 4: SILENCE ──
const pipeSilZone=document.getElementById('pipeSilZone'),pipeSilInp=document.getElementById('pipeSilInp');
pipeSilZone.addEventListener('dragover',e=>{e.preventDefault();pipeSilZone.classList.add('drag')});
pipeSilZone.addEventListener('dragleave',()=>pipeSilZone.classList.remove('drag'));
pipeSilZone.addEventListener('drop',e=>{e.preventDefault();pipeSilZone.classList.remove('drag');if(e.dataTransfer.files[0])loadPipeSilFile(e.dataTransfer.files[0])});
pipeSilInp.addEventListener('change',()=>{if(pipeSilInp.files[0])loadPipeSilFile(pipeSilInp.files[0])});
function loadPipeSilFile(f){pipeSilFile=f;document.getElementById('pipeSilFname').textContent='📎 '+f.name}

async function runPipelineSilence(){
  const fileToUse=pipeSilFile;if(!fileToUse&&!pipe.voiceUrl){alert('No audio file');return}
  const btn=document.getElementById('pipeSilBtn');btn.disabled=true;btn.textContent='⏳ Processing…';
  document.getElementById('pipeSilProg').classList.add('vis');document.getElementById('pipeSilErr').classList.remove('vis');
  try{
    const fd=new FormData();
    if(fileToUse)fd.append('video',fileToUse);
    else{const r=await fetch(pipe.voiceUrl);const blob=await r.blob();fd.append('video',blob,'voice.wav')}
    fd.append('dbThreshold',document.getElementById('pipeDbSlider').value);
    const tick=animProg('pipeSilProgFill','pipeSilProgPct',null,90,'');
    const res=await fetch('/remove-deadspace',{method:'POST',body:fd});const data=await res.json();
    clearInterval(tick);document.getElementById('pipeSilProgFill').style.width='100%';document.getElementById('pipeSilProgPct').textContent='100%';
    if(!data.success)throw new Error(data.error);
    pipe.silencedUrl=data.videoUrl;document.getElementById('pipeSilAudio').src=data.videoUrl;document.getElementById('pipeSilDl').href=data.videoUrl;
    document.getElementById('pipeSilEmpty').style.display='none';document.getElementById('pipeSilResult').style.display='flex';
    creds-=10;updCreds();
  }catch(err){document.getElementById('pipeSilErr').classList.add('vis');document.getElementById('pipeSilErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='✂️ Remove Silence';setTimeout(()=>document.getElementById('pipeSilProg').classList.remove('vis'),2000);
}
function continueToScenes(){unlockStep(4);goPipeStep(4);document.getElementById('scenesScriptPrev').textContent=pipe.script}

// ── STEP 5: SCENES ──
async function runScenesGen(){
  const btn=document.getElementById('scenesGenBtn');btn.disabled=true;btn.textContent='⏳ Splitting…';
  document.getElementById('scenesProg').classList.add('vis');document.getElementById('scenesErr').classList.remove('vis');
  document.getElementById('scenesContinueBtn').style.display='none';
  const tick=animProg('scenesProgFill','scenesProgPct','scenesProgLbl',88,'Splitting scenes…');
  try{
    const res=await fetch('/pipeline/scenes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({script:document.getElementById('scenesScriptInput').value.trim(),idea:''})});
    const data=await res.json();clearInterval(tick);document.getElementById('scenesProgFill').style.width='100%';document.getElementById('scenesProgPct').textContent='100%';
    if(!data.success)throw new Error(data.error);
    pipe.scenes=data.scenes.map(s=>({...s,imageUrl:null,videoUrl:null}));
    renderScenesList();document.getElementById('scenesEmpty').style.display='none';document.getElementById('scenesContinueBtn').style.display='block';
  }catch(err){clearInterval(tick);document.getElementById('scenesErr').classList.add('vis');document.getElementById('scenesErrMsg').textContent=err.message}
  btn.disabled=false;btn.textContent='🎬 Auto-Split into Scenes';setTimeout(()=>document.getElementById('scenesProg').classList.remove('vis'),2000);
}
function renderScenesList(){
  const list=document.getElementById('scenesList');list.innerHTML='';
  pipe.scenes.forEach((scene,idx)=>{
    const card=document.createElement('div');card.className='scene-card';
    card.innerHTML=`<div class="scene-head" style="display:flex;align-items:center;gap:6px;">
      <span style="color:var(--t3);font-size:16px;line-height:1;padding:0 2px;cursor:grab;" class="drag-handle">⠿</span>
      <span class="scene-badge" style="flex:1;">Scene ${scene.sceneNumber}</span>
      <button class="scene-del" style="background:none;border:1px solid var(--bd);color:var(--t2);border-radius:4px;width:22px;height:22px;font-size:11px;cursor:pointer;" onclick="moveScene(${idx},-1)">▲</button>
      <button class="scene-del" style="background:none;border:1px solid var(--bd);color:var(--t2);border-radius:4px;width:22px;height:22px;font-size:11px;cursor:pointer;" onclick="moveScene(${idx},1)">▼</button>
      <button class="scene-del" onclick="deleteScene(${idx})">✕</button>
    </div>
    <div class="scene-body">
      <div class="scene-script" contenteditable="true" onblur="pipe.scenes[${idx}].scriptText=this.textContent">${scene.scriptText}</div>

    </div>`;
    list.appendChild(card);
  });
  initSceneDrag();
}
function deleteScene(idx){pipe.scenes.splice(idx,1);renderScenesList()}
function moveScene(idx,dir){
  const newIdx=idx+dir;
  if(newIdx<0||newIdx>=pipe.scenes.length)return;
  const tmp=pipe.scenes[idx];pipe.scenes[idx]=pipe.scenes[newIdx];pipe.scenes[newIdx]=tmp;
  pipe.scenes.forEach((s,i)=>{s.sceneNumber=i+1;if(s.sceneLabel)s.sceneLabel=s.sceneLabel.replace(/Scene \d+/,'Scene '+(i+1));});
  renderScenesList();renderImgGrid();renderClipGrid();
}
function syncImgModels(model){
  pipe.scenes.forEach((_,i)=>{const s=document.getElementById('im-'+i);if(s){s.value=model;updateImgBtnCost(i);}});
  updateImgAllCost();
}
function initSceneDrag(){
  const list=document.getElementById('scenesList');
  let dragIdx=null;
  list.querySelectorAll('.scene-card').forEach((card,idx)=>{
    const handle=card.querySelector('.drag-handle');
    if(!handle)return;
    handle.addEventListener('mousedown',()=>{card.setAttribute('draggable','true');});
    card.addEventListener('dragstart',e=>{dragIdx=idx;card.style.opacity='0.4';e.dataTransfer.effectAllowed='move';});
    card.addEventListener('dragend',()=>{card.style.opacity='';card.setAttribute('draggable','false');dragIdx=null;});
    card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';});
    card.addEventListener('drop',e=>{
      e.preventDefault();
      if(dragIdx===null||dragIdx===idx)return;
      const tmp=pipe.scenes[dragIdx];pipe.scenes[dragIdx]=pipe.scenes[idx];pipe.scenes[idx]=tmp;
      pipe.scenes.forEach((s,i)=>{s.sceneNumber=i+1;if(s.sceneLabel)s.sceneLabel=s.sceneLabel.replace(/Scene \d+/,'Scene '+(i+1));});
      renderScenesList();renderImgGrid();renderClipGrid();
    });
  });
}
function addManualScene(){
  pipe.scenes.push({sceneNumber:pipe.scenes.length+1,scriptText:'Enter scene text…',imagePrompt:'Enter image prompt…',videoPrompt:'Enter video prompt…',imageUrl:null,videoUrl:null});
  renderScenesList();document.getElementById('scenesEmpty').style.display='none';document.getElementById('scenesContinueBtn').style.display='block';
}
function continueToImages(){if(!pipe.scenes.length){alert('Generate scenes first');return}unlockStep(1);goPipeStep(1);renderImgGrid();setTimeout(updateImgAllCost,100);setTimeout(initPipeRefDrop,100);}

// ── PROMPT MODAL ──
function openPromptModal(type,idx){
  promptCtx={type,idx};const scene=pipe.scenes[idx];
  document.getElementById('promptModalTitle').textContent=(type==='image'?'Image':'Video')+' Prompt — Scene '+scene.sceneNumber;
  document.getElementById('promptModalTA').value=type==='image'?scene.imagePrompt:scene.videoPrompt;
  document.getElementById('promptModal').style.display='flex';
}
function closePromptModal(e){if(e.target===document.getElementById('promptModal'))document.getElementById('promptModal').style.display='none'}
function savePromptEdit(){
  if(!promptCtx)return;const val=document.getElementById('promptModalTA').value;
  if(promptCtx.type==='image')pipe.scenes[promptCtx.idx].imagePrompt=val;else pipe.scenes[promptCtx.idx].videoPrompt=val;
  renderScenesList();renderImgGrid();renderClipGrid();document.getElementById('promptModal').style.display='none';promptCtx=null;
}

// ── STEP 6: IMAGES ──
function initPipeRefDrop(){
  const pipeRefDrop=document.getElementById('pipeRefDrop'),pipeRefInp=document.getElementById('pipeRefInp');
  if(!pipeRefDrop||!pipeRefInp)return;
  pipeRefDrop.addEventListener('click',()=>pipeRefInp.click());
  pipeRefDrop.addEventListener('dragover',e=>{e.preventDefault();pipeRefDrop.classList.add('drag')});
  pipeRefDrop.addEventListener('dragleave',()=>pipeRefDrop.classList.remove('drag'));
  pipeRefDrop.addEventListener('drop',e=>{e.preventDefault();pipeRefDrop.classList.remove('drag');if(e.dataTransfer.files[0])loadPipeRef(e.dataTransfer.files[0])});
  pipeRefInp.addEventListener('change',()=>{if(pipeRefInp.files[0])loadPipeRef(pipeRefInp.files[0])});
}
initPipeRefDrop();
function loadPipeRef(f){
  pipe.refImageFile=f;
  document.getElementById('pipeRefName').textContent='📎 '+f.name;
  document.getElementById('pipeRefDrop').classList.add('has');
  const rb=document.getElementById('pipeRefRemove');if(rb)rb.style.display='block';
}
function removePipeRef(){
  pipe.refImageFile=null;
  document.getElementById('pipeRefName').textContent='';
  document.getElementById('pipeRefDrop').classList.remove('has');
  document.getElementById('pipeRefInp').value='';
  const rb=document.getElementById('pipeRefRemove');if(rb)rb.style.display='none';
}

async function downloadFile(url, filename){
  try{
    const res=await fetch(url);const blob=await res.blob();
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }catch(e){alert('Download failed: '+e.message)}
}
async function downloadAllImages(){
  const scenes=pipe.scenes.filter(s=>s.imageUrl);
  if(!scenes.length){alert('No images generated yet');return}
  const {default:JSZip}=await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const zip=new JSZip();
  await Promise.all(scenes.map(async(s,i)=>{
    const res=await fetch(s.imageUrl);const blob=await res.blob();
    zip.file('image_'+(i+1)+'.png',blob);
  }));
  const content=await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');a.href=URL.createObjectURL(content);a.download='viralmax_images.zip';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function downloadAllVideos(){
  const scenes=pipe.scenes.filter(s=>s.videoUrl);
  if(!scenes.length){alert('No videos generated yet');return}
  const {default:JSZip}=await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const zip=new JSZip();
  await Promise.all(scenes.map(async(s,i)=>{
    const res=await fetch(s.videoUrl);const blob=await res.blob();
    zip.file('video_'+(i+1)+'.mp4',blob);
  }));
  const content=await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');a.href=URL.createObjectURL(content);a.download='viralmax_videos.zip';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function openScriptPopup(text){
  let modal=document.getElementById('scriptPopupModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='scriptPopupModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML=`<div style="background:var(--s2);border:1px solid var(--bd2);border-radius:14px;padding:28px 28px 24px;max-width:480px;width:90%;position:relative;max-height:70vh;overflow-y:auto;">
      <button onclick="document.getElementById('scriptPopupModal').style.display=\'none\'" style="position:absolute;top:14px;right:14px;background:none;border:1px solid var(--bd);color:var(--t2);border-radius:6px;width:28px;height:28px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      <div id="scriptPopupText" style="font-size:13px;line-height:1.7;color:var(--tx);font-family:\'DM Sans\',sans-serif;padding-right:8px;white-space:pre-wrap;"></div>
    </div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.style.display='none';});
    document.body.appendChild(modal);
  }
  document.getElementById('scriptPopupText').textContent=text;
  modal.style.display='flex';
}
function renderImgGrid(){
  if(!pipe.scenes.length)return;
  document.getElementById('imgsEmpty').style.display='none';
  const grid=document.getElementById('imgGrid');grid.style.display='grid';grid.innerHTML='';
  pipe.scenes.forEach((scene,idx)=>{
    const cell=document.createElement('div');cell.className='img-cell';cell.id=`ic-${idx}`;
    const txt=scene.scriptText||'';
    cell.innerHTML=`<div class="img-box${scene.imageUrl?' done':''}" id="ib-${idx}">
      ${scene.imageUrl?`<img src="${scene.imageUrl}" class="loaded" alt="">`:`<div class="img-ph"><span class="img-ph-icon">🖼</span><span>S${scene.sceneNumber}</span></div>`}
    </div>
    <div onclick="openScriptPopup(pipe.scenes[${idx}].scriptText)" style="font-size:11px;color:var(--t2);line-height:1.5;margin:10px 0 6px;padding:0 1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;min-height:33px;" title="Click to read full text">${txt}</div>
    <div style="display:flex;gap:5px;margin-bottom:5px;align-items:center;">
      <button onclick="openPromptModal('image',${idx})" style="flex-shrink:0;height:30px;padding:0 10px;font-size:11px;font-family:'DM Sans',sans-serif;background:var(--s3);border:1px solid var(--bd2);color:var(--tx);border-radius:6px;cursor:pointer;white-space:nowrap;">Edit</button>
      ${scene.imageUrl?`<button onclick="downloadFile('${scene.imageUrl}','image_${scene.sceneNumber}.png')" style="flex-shrink:0;height:30px;width:30px;display:flex;align-items:center;justify-content:center;background:var(--s3);border:1px solid var(--bd2);color:var(--tx);border-radius:6px;cursor:pointer;font-size:14px;" title="Download image">↓</button>`:''}
      <select style="flex:1;height:30px;font-size:11px;font-family:'DM Sans',sans-serif;padding:0 6px;background:var(--s3);border:1px solid var(--bd);color:var(--tx);border-radius:6px;outline:none;" id="im-${idx}" onchange="updateImgBtnCost(${idx})">
        <option value="nano-banana-pro">Nano Banana Pro</option>
        <option value="nano-banana-2">Nano Banana 2</option>
      </select>
    </div>
    <button id="igenb-${idx}" onclick="genSingleImg(${idx})" style="width:100%;height:34px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:600;background:var(--y);color:#000;border:none;border-radius:7px;cursor:pointer;">${scene.imageUrl?'↺ Regenerate':'Generate'} (15 cr)</button>`;
    grid.appendChild(cell);
    setTimeout(()=>updateImgBtnCost(idx),0);
  });
}
async function genSingleImg(idx){
  const scene=pipe.scenes[idx];const model=document.getElementById(`im-${idx}`)?.value||'nano-banana-pro';
  const btn=document.getElementById(`igenb-${idx}`),box=document.getElementById(`ib-${idx}`);
  if(btn){btn.disabled=true;btn.textContent='…'}if(box)box.classList.add('gen');
  try{
    const fd=new FormData();fd.append('prompt',scene.imagePrompt);fd.append('model',model);fd.append('sceneIndex',idx);
    if(pipe.refImageFile)fd.append('refImage',pipe.refImageFile);
    const res=await fetch('/pipeline/generate-scene-image',{method:'POST',body:fd});const data=await res.json();
    if(!data.success)throw new Error(data.error);
    pipe.scenes[idx].imageUrl=data.imageUrl;
    if(box){box.classList.remove('gen');box.classList.add('done');box.innerHTML=`<img src="${data.imageUrl}" class="loaded" alt="">`}
    if(btn){btn.disabled=false;btn.textContent='↺'}checkImgsDone();
  }catch(err){if(box)box.classList.remove('gen');if(btn){btn.disabled=false;btn.textContent='Gen'}alert('Image failed S'+(idx+1)+': '+err.message)}
}
async function generateAllImages(){
  const model=document.getElementById('imgGlobalModel').value;
  const btn=document.getElementById('imgGenAllBtn');btn.disabled=true;btn.textContent='⏳ Generating…';
  document.getElementById('imgAllProg').classList.add('vis');
  let done=0,total=pipe.scenes.length;
  pipe.scenes.forEach((_,i)=>{const s=document.getElementById(`im-${i}`);if(s)s.value=model});
  for(let i=0;i<pipe.scenes.length;i++){
    document.getElementById('imgAllProgLbl').textContent=`Scene ${i+1} of ${total}…`;
    await genSingleImg(i);done++;
    const pct=Math.round((done/total)*100);document.getElementById('imgAllProgFill').style.width=pct+'%';document.getElementById('imgAllProgPct').textContent=pct+'%';
  }
  btn.disabled=false;btn.textContent='Generate All Images ('+updateImgAllCost()+' cr)';setTimeout(()=>document.getElementById('imgAllProg').classList.remove('vis'),2000);checkImgsDone();
}
function checkImgsDone(){document.getElementById('imgsContinueBtn').style.display=pipe.scenes.every(s=>s.imageUrl)?'block':'none'}
function getImgCr(model){return model==='nano-banana-2'?10:15;}
function updateImgBtnCost(idx){
  const m=document.getElementById('im-'+idx)?.value||'nano-banana-pro';
  const btn=document.getElementById('igenb-'+idx);
  if(btn){const done=pipe.scenes[idx]?.imageUrl;btn.textContent=(done?'↺ Regenerate':'Generate')+' ('+getImgCr(m)+' cr)';}
  updateImgAllCost();
}
function updateImgAllCost(){
  let total=0;
  pipe.scenes.forEach((_,i)=>{const s=document.getElementById('im-'+i);const m=s?s.value:'nano-banana-pro';total+=getImgCr(m);});
  const btn=document.getElementById('imgGenAllBtn');
  if(btn)btn.textContent='Generate All Images ('+total+' cr)';
  return total;
}
function continueToClips(){unlockStep(2);goPipeStep(2);renderClipGrid();setTimeout(()=>{updateClipAllCost();updateImgAllCost();},100)}

// ── STEP 7: CLIPS ──
const VID_CREDITS={'grok':10,'veo3':15,'sora2':20};
function getVidCr(model){return VID_CREDITS[model]||20;}
function renderClipGrid(){
  if(!pipe.scenes.length)return;
  document.getElementById('clipsEmpty').style.display='none';
  const grid=document.getElementById('clipGrid');grid.style.display='grid';grid.innerHTML='';
  pipe.scenes.forEach((scene,idx)=>{
    const cell=document.createElement('div');cell.className='clip-cell';
    const ctxt=scene.scriptText||'';
    cell.innerHTML=`<div class="clip-box${scene.videoUrl?' done':''}" id="cb-${idx}">
      ${scene.videoUrl?`<video src="${scene.videoUrl}" controls loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`:scene.imageUrl?`<img class="ref-img" src="${scene.imageUrl}" alt="">`:``}
      ${!scene.videoUrl?`<div class="img-ph"><span class="img-ph-icon">🎬</span><span>S${scene.sceneNumber}</span></div>`:''}
    </div>
    <div onclick="openScriptPopup(pipe.scenes[${idx}].scriptText)" style="font-size:11px;color:var(--t2);line-height:1.5;margin:6px 0 4px;padding:0 1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;min-height:33px;" title="Click to read full text">${ctxt}</div>
    <div style="display:flex;gap:5px;margin-bottom:5px;align-items:center;">
      <button onclick="openPromptModal('video',${idx})" style="flex-shrink:0;height:30px;padding:0 10px;font-size:11px;font-family:'DM Sans',sans-serif;background:var(--s3);border:1px solid var(--bd2);color:var(--tx);border-radius:6px;cursor:pointer;white-space:nowrap;">Edit</button>
      <select style="flex:1;height:30px;font-size:11px;font-family:'DM Sans',sans-serif;padding:0 6px;background:var(--s3);border:1px solid var(--bd);color:var(--tx);border-radius:6px;outline:none;" id="cm-${idx}" onchange="document.getElementById('cgenb-${idx}').textContent=(pipe.scenes[${idx}].videoUrl?'↺ Regenerate':'Generate')+' ('+getVidCr(this.value)+' cr)';updateClipAllCost();">
        <option value="grok">Grok (10 cr)</option>
        <option value="veo3">Veo 3 Lite (15 cr)</option>
        <option value="sora2">Sora 2 (20 cr)</option>
      </select>
    </div>
    <div style="display:flex;gap:5px;margin-bottom:5px;">
      <button id="cgenb-${idx}" onclick="genSingleClip(${idx})" style="flex:1;height:34px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:600;background:var(--y);color:#000;border:none;border-radius:7px;cursor:pointer;">${scene.videoUrl?'↺ Regenerate':'Generate'} (${getVidCr('grok')} cr)</button>
      ${scene.videoUrl?`<button onclick="downloadFile('${scene.videoUrl}','video_${scene.sceneNumber}.mp4')" style="flex-shrink:0;height:34px;width:34px;display:flex;align-items:center;justify-content:center;background:var(--s3);border:1px solid var(--bd2);color:var(--tx);border-radius:7px;cursor:pointer;font-size:14px;" title="Download video">↓</button>`:''}
    </div>`;
    grid.appendChild(cell);
  });
}
async function genSingleClip(idx){
  const scene=pipe.scenes[idx];const modelVal=document.getElementById(`cm-${idx}`)?.value||'grok';
  const model=modelVal;const quality='480p';
  const btn=document.getElementById(`cgenb-${idx}`),box=document.getElementById(`cb-${idx}`);
  if(btn){btn.disabled=true;btn.textContent='…'}if(box)box.classList.add('gen');
  try{
    const res=await fetch('/pipeline/generate-scene-video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:scene.videoPrompt,model,quality,sceneIndex:idx,imageUrl:scene.imageUrl||null})});
    const data=await res.json();if(!data.success)throw new Error(data.error);
    pipe.scenes[idx].videoUrl=data.videoUrl;
    if(box){box.classList.remove('gen');box.classList.add('done');box.innerHTML=`<video src="${data.videoUrl}" loop muted autoplay playsinline></video>`}
    if(btn){btn.disabled=false;btn.textContent='↺'}
  }catch(err){if(box)box.classList.remove('gen');if(btn){btn.disabled=false;btn.textContent='Gen'}alert('Clip failed S'+(idx+1)+': '+err.message)}
}
function updateClipAllCost(){
  let total=0;
  pipe.scenes.forEach((_,i)=>{const s=document.getElementById('cm-'+i);const m=s?s.value:'grok';total+=getVidCr(m);});
  const btn=document.getElementById('clipGenAllBtn');
  if(btn)btn.textContent='Generate All Clips ('+total+' cr)';
  return total;
}
async function generateAllClips(){
  const globalModel=document.getElementById('clipGlobalModel').value;
  const btn=document.getElementById('clipGenAllBtn');btn.disabled=true;btn.textContent='⏳ Generating…';
  document.getElementById('clipAllProg').classList.add('vis');
  let done=0,total=pipe.scenes.length;
  pipe.scenes.forEach((_,i)=>{const s=document.getElementById(`cm-${i}`);if(s)s.value=globalModel});
  for(let i=0;i<pipe.scenes.length;i++){
    document.getElementById('clipAllProgLbl').textContent=`Scene ${i+1} of ${total}…`;
    await genSingleClip(i);done++;
    const pct=Math.round((done/total)*100);document.getElementById('clipAllProgFill').style.width=pct+'%';document.getElementById('clipAllProgPct').textContent=pct+'%';
  }
  btn.disabled=false;btn.textContent='Generate All Clips ('+updateClipAllCost()+' cr)';setTimeout(()=>document.getElementById('clipAllProg').classList.remove('vis'),2000);
}
