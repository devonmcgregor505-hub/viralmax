const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Replace the checkin save block to compress images first
h = h.replace(
  `  if(obPhotos.some(p=>p)){
    const checkin={date:new Date().toISOString(),photos:obPhotos};
    const existing=JSON.parse(localStorage.getItem('ascend_checkins')||'[]');
    existing.unshift(checkin);
    localStorage.setItem('ascend_checkins',JSON.stringify(existing.slice(0,20)));
  }`,
  `  if(obPhotos.some(p=>p)){
    compressAndSavePhotos(obPhotos.filter(p=>p));
  }`
);

// Add compress function before obComplete
h = h.replace(
  `function obComplete(){`,
  `function compressImage(dataUrl, maxWidth, quality){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const scale=Math.min(1,maxWidth/img.width);
      const canvas=document.createElement('canvas');
      canvas.width=img.width*scale;
      canvas.height=img.height*scale;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg',quality));
    };
    img.src=dataUrl;
  });
}

async function compressAndSavePhotos(photos){
  try{
    const compressed=await Promise.all(photos.map(p=>compressImage(p,600,0.5)));
    const checkin={date:new Date().toISOString(),photos:compressed};
    const existing=JSON.parse(localStorage.getItem('ascend_checkins')||'[]');
    existing.unshift(checkin);
    localStorage.setItem('ascend_checkins',JSON.stringify(existing.slice(0,5)));
  }catch(e){console.warn('Photo save failed:',e.message);}
}

function obComplete(){`
);

// Also compress photos before sending to AI — reduce to smaller size
h = h.replace(
  `    const labels=['Face front','Face side','Body front','Body side'];
    obPhotos.forEach((p,i)=>{
      if(p){
        content.push({type:'image',source:{type:'base64',media_type:p.split(';')[0].split(':')[1],data:p.split(',')[1]}});
        content.push({type:'text',text:labels[i]+' photo above.'});
      }
    });`,
  `    const labels=['Face front','Face side','Body front','Body side'];
    const compressedForAI=await Promise.all(obPhotos.map(p=>p?compressImage(p,800,0.7):null));
    compressedForAI.forEach((p,i)=>{
      if(p){
        content.push({type:'image',source:{type:'base64',media_type:'image/jpeg',data:p.split(',')[1]}});
        content.push({type:'text',text:labels[i]+' photo above.'});
      }
    });`
);

fs.writeFileSync('app.html', h);
console.log('Done');
