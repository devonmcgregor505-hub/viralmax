content = open('index.html').read()
old = "function startDeadspace() { alert('✓ Processing started!'); }"
new = '''async function startDeadspace() {
  const fileInput = document.getElementById('deadspaceInput');
  const intensity = document.getElementById('dsIntensity').value;
  const btn = document.getElementById('dsBtn');
  const vid = document.getElementById('dsVid');

  if (!fileInput.files[0]) { alert('Please select a video file first.'); return; }

  btn.disabled = true;
  btn.textContent = '⏳ Processing…';
  document.getElementById('dsProg').classList.add('vis');
  document.getElementById('dsErr').classList.remove('vis');

  let pct = 0;
  const fill = document.getElementById('dsFill');
  const pctLbl = document.getElementById('dsProgPct');
  const lbl = document.getElementById('dsProgLbl');
  const tick = setInterval(() => {
    if (pct < 90) { pct += Math.random() * 4; if (pct > 90) pct = 90; fill.style.width = pct + '%'; pctLbl.textContent = Math.round(pct) + '%'; }
    if (pct > 30) lbl.textContent = 'Removing dead space…';
    if (pct > 70) lbl.textContent = 'Finalizing…';
  }, 500);

  try {
    const fd = new FormData();
    fd.append('video', fileInput.files[0]);
    fd.append('intensity', intensity);

    const res = await fetch('/remove-deadspace', { method: 'POST', body: fd });
    const data = await res.json();
    clearInterval(tick); fill.style.width = '100%'; pctLbl.textContent = '100%';
    if (!data.success) throw new Error(data.error || 'Processing failed');

    vid.src = data.videoUrl;
    vid.style.display = 'block';

    let dlWrap = document.getElementById('dsDlWrap');
    if (!dlWrap) {
      dlWrap = document.createElement('div');
      dlWrap.id = 'dsDlWrap';
      dlWrap.style.cssText = 'width:100%;max-width:315px;margin-top:8px;';
      dlWrap.innerHTML = '<a id="dsDlBtn" class="dl-btn" download="trimmed.mp4">⬇ Download Trimmed Video</a>';
      vid.closest('.right-panel').appendChild(dlWrap);
    }
    document.getElementById('dsDlBtn').href = data.videoUrl;

  } catch(err) {
    clearInterval(tick);
    document.getElementById('dsErr').classList.add('vis');
    document.getElementById('dsErrMsg').textContent = err.message;
  }

  btn.disabled = false;
  btn.textContent = '🎬 Remove Dead Space';
  setTimeout(() => document.getElementById('dsProg').classList.remove('vis'), 2000);
}'''

if old in content:
    open('index.html', 'w').write(content.replace(old, new))
    print('✓ done')
else:
    print('✗ not found')
