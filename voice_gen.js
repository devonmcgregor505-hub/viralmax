// ══════════════════════════════════════════════════════════════════════════════
// VOICE GEN — Chatterbox (clone) + Kie.ai ElevenLabs (preset)
// ══════════════════════════════════════════════════════════════════════════════

let voiceMode = 'preset'; // 'preset' | 'clone'
let selectedVoiceSample = null;
let savedKieVoiceId = null;

// ── Mode switching ──
function setVoiceMode(mode) {
  voiceMode = mode;
  document.getElementById('presetPanel').style.display = mode === 'preset' ? 'block' : 'none';
  document.getElementById('clonePanel').style.display  = mode === 'clone'  ? 'block' : 'none';

  const presetBtn = document.getElementById('modePreset');
  const cloneBtn  = document.getElementById('modeClone');

  if (mode === 'preset') {
    presetBtn.style.background    = 'var(--yg)';
    presetBtn.style.borderColor   = 'rgba(245,225,50,.3)';
    presetBtn.style.color         = 'var(--y)';
    cloneBtn.style.background     = 'var(--s3)';
    cloneBtn.style.borderColor    = 'var(--bd)';
    cloneBtn.style.color          = 'var(--tdim)';
  } else {
    cloneBtn.style.background     = 'var(--yg)';
    cloneBtn.style.borderColor    = 'rgba(245,225,50,.3)';
    cloneBtn.style.color          = 'var(--y)';
    presetBtn.style.background    = 'var(--s3)';
    presetBtn.style.borderColor   = 'var(--bd)';
    presetBtn.style.color         = 'var(--tdim)';
  }
}

// ── Voice sample upload ──
const voiceSampleDrop  = document.getElementById('voiceSampleDrop');
const voiceSampleInput = document.getElementById('voiceSampleInput');

voiceSampleDrop.addEventListener('dragover', e => { e.preventDefault(); voiceSampleDrop.classList.add('drag'); });
voiceSampleDrop.addEventListener('dragleave', () => voiceSampleDrop.classList.remove('drag'));
voiceSampleDrop.addEventListener('drop', e => {
  e.preventDefault(); voiceSampleDrop.classList.remove('drag');
  const f = e.dataTransfer.files[0];
  if (f) loadVoiceSample(f);
});
voiceSampleInput.addEventListener('change', () => {
  if (voiceSampleInput.files[0]) loadVoiceSample(voiceSampleInput.files[0]);
});

function loadVoiceSample(f) {
  selectedVoiceSample = f;
  document.getElementById('voiceSampleFnm').textContent = '📎 ' + f.name;
  voiceSampleDrop.classList.add('has-file');
}

// ── Preset voice helpers ──
function selectPresetVoice() {
  savedKieVoiceId = document.getElementById('voicePreset').value || null;
}
function saveCustomVoice() {
  const id = document.getElementById('customVoiceId').value.trim();
  if (!id) { alert('Please enter a voice ID.'); return; }
  savedKieVoiceId = id;
  alert('✓ Voice ID saved: ' + id);
}

// ── Slider helpers ──
function updateCharCount()    { document.getElementById('charCount').textContent    = document.getElementById('voiceScript').value.length; }
function updateSpeedVal()     { document.getElementById('speedVal').textContent     = document.getElementById('speedSlider').value; }
function updateStabilityVal() { document.getElementById('stabilityVal').textContent = document.getElementById('stabilitySlider').value + '%'; }
function updateSimilarityVal(){ document.getElementById('similarityVal').textContent= document.getElementById('similaritySlider').value + '%'; }
function updateExagVal()      { document.getElementById('exagVal').textContent      = document.getElementById('exagSlider').value; }
function updateCfgVal()       { document.getElementById('cfgVal').textContent       = document.getElementById('cfgSlider').value; }
function updateTempVal()      { document.getElementById('tempVal').textContent      = document.getElementById('tempSlider').value; }

// ── Progress helper ──
function setVoiceProgress(pct, label) {
  document.getElementById('vrFill').style.width = pct + '%';
  document.getElementById('voiceProgPct').textContent = Math.round(pct) + '%';
  document.getElementById('voiceProgLbl').textContent = label;
}

// ── Main generate function ──
async function startVoiceGen() {
  const script = document.getElementById('voiceScript').value.trim();
  if (!script) { alert('Please enter a script.'); return; }

  if (voiceMode === 'preset' && !savedKieVoiceId) {
    alert('Please select or enter a voice first.'); return;
  }
  if (voiceMode === 'clone' && !selectedVoiceSample) {
    alert('Please upload a voice sample first.'); return;
  }

  const btn = document.getElementById('voiceBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating…';
  document.getElementById('voiceProg').classList.add('vis');
  document.getElementById('voiceErr').classList.remove('vis');
  document.getElementById('dlVoiceBtn').style.display = 'none';

  // Animate progress
  let pct = 0;
  const tick = setInterval(() => {
    if (pct < 85) { pct += Math.random() * 3; if (pct > 85) pct = 85; setVoiceProgress(pct, 'Generating speech…'); }
  }, 600);

  try {
    let audioUrl;

    if (voiceMode === 'preset') {
      // ── Kie.ai ElevenLabs preset ──
      setVoiceProgress(10, 'Sending to ElevenLabs…');
      const fd = new FormData();
      fd.append('text', script);
      fd.append('voiceId', savedKieVoiceId);
      fd.append('model', document.getElementById('kieModel').value);
      fd.append('speed', document.getElementById('speedSlider').value);
      fd.append('stability', document.getElementById('stabilitySlider').value / 100);
      fd.append('similarity', document.getElementById('similaritySlider').value / 100);

      const res  = await fetch('/generate-voice', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Voice generation failed');
      audioUrl = data.audioUrl;
      document.getElementById('voiceMode').textContent = '⚡ ElevenLabs ' + document.getElementById('kieModel').value.split('/')[1];

    } else {
      // ── Chatterbox voice clone ──
      setVoiceProgress(10, 'Uploading voice sample…');
      const fd = new FormData();
      fd.append('text', script);
      fd.append('voiceSample', selectedVoiceSample);
      fd.append('exaggeration', document.getElementById('exagSlider').value);
      fd.append('cfgWeight', document.getElementById('cfgSlider').value);
      fd.append('temperature', document.getElementById('tempSlider').value);

      setVoiceProgress(25, 'Cloning voice on GPU…');
      const res  = await fetch('/generate-voice', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Voice cloning failed');
      audioUrl = data.audioUrl;
      document.getElementById('voiceMode').textContent = '🔬 Chatterbox Voice Clone';
    }

    clearInterval(tick);
    setVoiceProgress(100, 'Done!');

    // Play result
    const audio = document.getElementById('voiceAudio');
    audio.src = audioUrl;
    audio.style.display = 'block';
    document.getElementById('voiceEmpty').style.display = 'none';
    document.getElementById('voiceEmptyIcon').style.display = 'none';

    const dl = document.getElementById('dlVoiceBtn');
    dl.href = audioUrl;
    dl.download = voiceMode === 'clone' ? 'cloned_voice.wav' : 'speech.wav';
    dl.style.display = 'block';

  } catch(err) {
    clearInterval(tick);
    document.getElementById('voiceErr').classList.add('vis');
    document.getElementById('voiceErrMsg').textContent = err.message;
  }

  btn.disabled = false;
  btn.textContent = '🔊 Generate Speech';
  setTimeout(() => document.getElementById('voiceProg').classList.remove('vis'), 2000);
}
