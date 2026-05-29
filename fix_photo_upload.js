const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Replace the photos step rendering with a single upload zone
h = h.replace(
  `  if(step.type==='photos'){
    html+=\`<div class="ob-photo-grid">
      \${['Face — front','Face — side','Body — front','Body — side'].map((lbl,i)=>\`
        <div class="ob-photo-slot\${obPhotos[i]?' has-photo':''}" onclick="triggerPhoto(\${i})" id="slot\${i}">
          \${obPhotos[i]?'<img src="'+obPhotos[i]+'" />':''}
          <span class="ob-photo-icon">📷</span>
          <span class="ob-photo-label">\${lbl}</span>
          <button class="ob-photo-remove" onclick="removePhoto(event,\${i})">✕</button>
        </div>\`).join('')}
    </div>
    <input type="file" accept="image/*" id="photoFileInput" style="display:none" onchange="handlePhotoFile(event)"/>
    <div class="ob-nav"><button class="ob-back" onclick="obBack()">← back</button><button class="ob-next" id="obNext" onclick="obNext()">Generate my routine ✦</button></div>\`;
  }`,
  `  if(step.type==='photos'){
    html+=\`
    <div class="ob-photo-instructions">
      <div class="ob-photo-req">Upload 4 photos in this order:</div>
      <div class="ob-photo-req-list">
        <span>1. Face — front on</span>
        <span>2. Face — side on</span>
        <span>3. Body — front on (shirtless)</span>
        <span>4. Body — side on (shirtless)</span>
      </div>
    </div>
    <div class="ob-upload-zone" onclick="document.getElementById('photoFileInput').click()">
      <div class="ob-upload-icon">📷</div>
      <div class="ob-upload-text">Tap to select photos</div>
      <div class="ob-upload-sub">Select all 4 at once or add one at a time</div>
    </div>
    <input type="file" accept="image/*" multiple id="photoFileInput" style="display:none" onchange="handlePhotoFiles(event)"/>
    \${obPhotos.filter(p=>p).length>0?\`
    <div class="ob-photo-preview-row">
      \${obPhotos.map((p,i)=>p?\`
        <div class="ob-preview-item">
          <img src="\${p}" />
          <button class="ob-preview-remove" onclick="removePhoto(event,\${i})">✕</button>
          <div class="ob-preview-label">\${['Face front','Face side','Body front','Body side'][i]}</div>
        </div>\`:'').join('')}
    </div>\`:''}
    <div class="ob-nav" style="margin-top:20px"><button class="ob-back" onclick="obBack()">← back</button><button class="ob-next" id="obNext" onclick="obNext()">\${obPhotos.filter(p=>p).length>0?'Generate my routine ✦':'Skip for now →'}</button></div>\`;
  }`
);

// 2. Replace handlePhotoFile with handlePhotoFiles (multi upload)
h = h.replace(
  `function handlePhotoFile(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{obPhotos[activePhotoSlot]=ev.target.result;renderOB();};
  reader.readAsDataURL(file);e.target.value='';
}`,
  `function handlePhotoFiles(e){
  const files=Array.from(e.target.files).slice(0,4);
  if(!files.length)return;
  let loaded=0;
  files.forEach((file,i)=>{
    const slot=obPhotos.findIndex((p,idx)=>!p&&idx>=i)||i;
    const targetSlot=i<4?i:obPhotos.findIndex(p=>!p);
    if(targetSlot===-1)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      obPhotos[targetSlot]=ev.target.result;
      loaded++;
      if(loaded===files.length)renderOB();
    };
    reader.readAsDataURL(file);
  });
  e.target.value='';
}`
);

// 3. Add new CSS for the upload zone and preview
const uploadCss = `
.ob-photo-instructions{margin-bottom:16px;}
.ob-photo-req{font-size:12px;font-weight:600;color:var(--t2);margin-bottom:8px;letter-spacing:.03em;}
.ob-photo-req-list{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.ob-photo-req-list span{font-size:12px;color:var(--t3);background:var(--bg-input);border:1px solid var(--border);border-radius:var(--rxs);padding:6px 10px;}
.ob-upload-zone{border:1.5px dashed var(--t3);border-radius:var(--rs);padding:28px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg-input);margin-bottom:14px;}
.ob-upload-zone:hover{border-color:var(--y);background:var(--yd);}
.ob-upload-icon{font-size:28px;margin-bottom:8px;}
.ob-upload-text{font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;}
.ob-upload-sub{font-size:12px;color:var(--t3);}
.ob-photo-preview-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px;}
.ob-preview-item{position:relative;border-radius:var(--rxs);overflow:hidden;aspect-ratio:3/4;background:var(--bg-panel);}
.ob-preview-item img{width:100%;height:100%;object-fit:cover;}
.ob-preview-remove{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.8);border:none;color:#fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
.ob-preview-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);font-size:9px;color:#fff;text-align:center;padding:3px;letter-spacing:.03em;}
`;
h = h.replace('</style>', uploadCss + '</style>');

fs.writeFileSync('app.html', h);
console.log('Done');
