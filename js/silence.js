// ── SILENCE REMOVER ──
const dsZone=document.getElementById('dsZone');
dsZone.addEventListener('dragover',e=>{e.preventDefault();dsZone.classList.add('drag')});
dsZone.addEventListener('dragleave',()=>dsZone.classList.remove('drag'));
dsZone.addEventListener('drop',e=>{e.preventDefault();dsZone.classList.remove('drag');if(e.dataTransfer.files[0])loadDs(e.dataTransfer.files[0])});
document.getElementById('dsInp').addEventListener('change',()=>{if(document.getElementById('dsInp').files[0])loadDs(document.getElementById('dsInp').files[0])});
function loadDs(f){document.getElementById('dsFnm').textContent='📎 '+f.name;dsZone.classList.add('has');document.getElementById('dsBtn').disabled=false;const vid=document.getElementById('dsVid');vid.src=URL.createObjectURL(f);vid.style.display='block';document.getElementById('dsEmpty').style.display='none'}
async function startDeadspace(){
  const fi=document.getElementById('dsInp');if(!fi.files[0]){alert('Upload a file');return}
  const btn=document.getElementById('dsBtn');btn.disabled=true;btn.textContent='⏳ Processing…';
  try{
    const fd=new FormData();fd.append('video',fi.files[0]);fd.append('dbThreshold',document.getElementById('dbSlider').value);
    const res=await fetch('/remove-deadspace',{method:'POST',body:fd});const data=await res.json();
    if(!data.success)throw new Error(data.error||'Failed');
    document.getElementById('dsVid').src=data.videoUrl;document.getElementById('dsDlBtn').href=data.videoUrl;document.getElementById('dsDlWrap').style.display='block';
  }catch(err){alert('Error: '+err.message)}
  btn.disabled=false;btn.textContent='✂️ Remove Silence';
}
