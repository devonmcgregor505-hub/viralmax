// Add this to your script section - replace the old updateVidSettings function
const VIDEO_MODELS = {
  'veo3-fast': { durations: [6, 8, 10, 15], aspects: ['9:16', '16:9'], audio: true, credits: 60 },
  'grok': { durations: [6, 10], aspects: ['9:16', '16:9'], audio: true, credits: 30 },
  'sora2': { durations: [10, 15], aspects: ['9:16', '16:9'], audio: true, credits: 35 },
  'kling26': { durations: [5, 10], aspects: ['9:16', '16:9'], audio: true, credits: 20 },
  'seedance': { durations: [6, 8, 10], aspects: ['9:16'], audio: false, credits: 50 }
};

function updateVidSettings() {
  const model = document.getElementById('vidModel').value;
  const cfg = VIDEO_MODELS[model];
  
  // Update durations
  const durChips = document.getElementById('durationChips');
  if(!durChips) {
    console.log('Creating duration chips...');
    const durRow = document.createElement('div');
    durRow.className = 'setting-row';
    durRow.innerHTML = '<label class="setting-label">Duration</label><div class="chips" id="durationChips"></div>';
    document.querySelector('#vidModel').parentElement.parentElement.appendChild(durRow);
  }
  
  document.getElementById('durationChips').innerHTML = '';
  cfg.durations.forEach((d, i) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (i === 0 ? ' on' : '');
    chip.textContent = d + 's';
    chip.onclick = () => { chip.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on')); chip.classList.add('on'); };
    document.getElementById('durationChips').appendChild(chip);
  });
  
  document.getElementById('vidCost').textContent = cfg.credits + ' credits';
}
