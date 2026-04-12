// ── YT SCRAPER ──
let lastScrapeData=[];
async function startScrape(){
  const url=document.getElementById('ytUrl').value.trim();if(!url){alert('Enter a channel URL');return}
  const btn=document.getElementById('scrapBtn');btn.disabled=true;btn.textContent='⏳ Scraping…';
  document.getElementById('scrapErr').classList.remove('vis');
  document.getElementById('scrapList').innerHTML='<div class="empty" style="padding:36px;"><span class="empty-icon" style="font-size:26px;">⏳</span><div class="empty-txt">Scraping channel…</div></div>';
  try{
    const res=await fetch('/scrape-channel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channelUrl:url,count:document.getElementById('ytCount').value,sort:document.getElementById('ytSort').value})});
    const data=await res.json();if(!data.success)throw new Error(data.error||'Failed');
    lastScrapeData=data.videos;renderScraped(data.videos);document.getElementById('exportBtn').style.display='block';
  }catch(err){document.getElementById('scrapErr').classList.add('vis');document.getElementById('scrapErrMsg').textContent=err.message;document.getElementById('scrapList').innerHTML='<div class="empty" style="padding:36px;"><span class="empty-icon">❌</span><div class="empty-txt">Scrape failed</div></div>'}
  btn.disabled=false;btn.textContent='📊 Scrape Channel';
}
function exportJson(){
  if(!lastScrapeData.length)return;
  const blob=new Blob([JSON.stringify(lastScrapeData,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  const handle=document.getElementById('ytUrl').value.split('/').pop().replace('@','')||'channel';
  a.download=`channel_${handle}.json`;a.click();
}
function renderScraped(videos){
  const list=document.getElementById('scrapList');
  if(!videos||!videos.length){list.innerHTML='<div class="empty" style="padding:36px;"><span class="empty-icon">📭</span><div class="empty-txt">No videos found</div></div>';return}
  list.innerHTML=videos.map(v=>`<div class="scraper-item"><img class="scraper-thumb" src="${v.thumbnail}" onerror="this.style.display='none'" alt=""><div class="scraper-info"><div class="scraper-title">${v.title}</div><div class="scraper-meta">${(v.view_count||0).toLocaleString()} views · ${v.duration_human}</div><a class="scraper-link" href="${v.url}" target="_blank">↗ Open</a></div></div>`).join('');
}

function selectNiche(btn,niche){document.querySelectorAll(".niche-btn").forEach(b=>{b.style.background="var(--s3)";b.style.borderColor="var(--bd)";b.style.color="var(--t2)"});btn.style.background="var(--yd)";btn.style.borderColor="rgba(255,230,0,0.3)";btn.style.color="var(--y)";window.selectedNiche=niche;}
function changeNiche(){
  document.getElementById('niche-picker').style.display='flex';
  document.getElementById('pipeline-content').style.display='none';
  document.getElementById('pipe-sub').style.display='none';
}
function selectNichePick(niche){
  if(niche==='Ronaldo'){alert('Ronaldo Adventures pipeline coming soon!');return;}
  if(niche==='suggest'){suggestNiche();return;}
  window.selectedNiche=niche;
  document.getElementById('niche-picker').style.display='none';
  document.getElementById('pipeline-content').style.display='flex';
  
}
function suggestNiche(){
  const n=prompt('What niche would you like to see? We\'ll add it soon!');
  if(n&&n.trim())alert('Thanks! We\'ll add "'+n.trim()+'" soon.');
}
