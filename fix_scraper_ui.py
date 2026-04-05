content = open('index.html').read()

old = "function startScrape() { if (!document.getElementById('ytChannelUrl').value.trim()) { alert('Please enter a channel URL.'); return; } alert('✓ Scraping started!'); }"

new = """async function startScrape() {
  const url = document.getElementById('ytChannelUrl').value.trim();
  const count = document.getElementById('ytCount').value;
  const contentType = document.getElementById('ytType').value;
  const btn = document.getElementById('scrapBtn');
  const list = document.getElementById('scrapList');

  if (!url) { alert('Please enter a channel URL.'); return; }

  btn.disabled = true;
  btn.textContent = '⏳ Scraping…';
  list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tdim);font-size:11px;">Fetching videos, this may take a minute...</div>';
  document.getElementById('scrapErr').classList.remove('vis');

  try {
    const res = await fetch('/scrape-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelUrl: url, count, contentType })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Scrape failed');

    const videos = data.videos;
    if (videos.length === 0) { list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tdim);font-size:11px;">No videos found</div>'; return; }

    list.innerHTML = '';

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.cssText = 'margin-bottom:10px;padding:8px;font-size:11px;';
    exportBtn.textContent = '⬇ Export JSON';
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(videos, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'scraped_videos.json'; a.click();
    };
    list.appendChild(exportBtn);

    videos.forEach(v => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--s3);border:1px solid var(--bd);border-radius:9px;margin-bottom:8px;overflow:hidden;';
      const engRate = v.view_count > 0 ? ((v.like_count / v.view_count) * 100).toFixed(1) + '%' : 'N/A';
      const views = v.view_count >= 1000000 ? (v.view_count/1000000).toFixed(1)+'M' : v.view_count >= 1000 ? (v.view_count/1000).toFixed(1)+'K' : v.view_count;
      const likes = v.like_count >= 1000 ? (v.like_count/1000).toFixed(1)+'K' : v.like_count;
      const date = v.publish_date ? new Date(v.publish_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : '';
      card.innerHTML = `
        <div style="display:flex;gap:10px;padding:10px;">
          <img src="${v.thumbnail}" style="width:80px;height:45px;object-fit:cover;border-radius:5px;flex-shrink:0;" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0;">
            <div style="font-size:11px;font-weight:600;color:var(--tx);margin-bottom:4px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${v.title}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span style="font-size:9px;color:var(--tdim);">👁 ${views}</span>
              <span style="font-size:9px;color:var(--tdim);">👍 ${likes}</span>
              <span style="font-size:9px;color:var(--tdim);">💬 ${v.comment_count?.toLocaleString?.() || 0}</span>
              <span style="font-size:9px;color:var(--tdim);">⏱ ${v.duration_human}</span>
              <span style="font-size:9px;color:var(--y);">📈 ${engRate}</span>
              ${date ? `<span style="font-size:9px;color:var(--tdim);">${date}</span>` : ''}
            </div>
          </div>
          <a href="${v.url}" target="_blank" style="color:var(--tdim);font-size:11px;flex-shrink:0;text-decoration:none;">↗</a>
        </div>
        ${v.transcript ? `
        <div style="border-top:1px solid var(--bd);">
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent.includes('▼')?'▲ Hide Transcript':'▼ Show Transcript'" style="background:none;border:none;color:var(--tdim);font-size:9px;padding:6px 10px;cursor:pointer;width:100%;text-align:left;">▼ Show Transcript</button>
          <div style="display:none;padding:8px 10px;font-size:10px;color:var(--tdim);line-height:1.6;max-height:150px;overflow-y:auto;white-space:pre-wrap;">${v.transcript}</div>
        </div>` : ''}
      `;
      list.appendChild(card);
    });

  } catch(err) {
    document.getElementById('scrapErr').classList.add('vis');
    document.getElementById('scrapErrMsg').textContent = err.message;
    list.innerHTML = '';
  }

  btn.disabled = false;
  btn.textContent = '🎥 Scrape Channel';
}"""

if old in content:
    open('index.html', 'w').write(content.replace(old, new))
    print('✓ scraper UI updated')
else:
    print('✗ not found')
