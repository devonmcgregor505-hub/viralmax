// ══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIG — ModelsLab models
// Replace the existing MODEL_CONFIG block in index.html with this
// ══════════════════════════════════════════════════════════════════════════════
const MODEL_CONFIG = {
  'veo3-lite': {
    label: 'Veo 3.1 Lite',
    credits: 40,
    durations: [4, 6, 8],
    defaultDuration: 8,
    aspectRatios: [
      { value: '9:16', label: '9:16 (Portrait)' },
      { value: '16:9', label: '16:9 (Landscape)' },
    ],
    defaultAspect: '9:16',
    audio: 'toggle',
    audioDefault: true,
    requiresImage: false,
    note: 'Google Veo 3.1 Lite · Text-to-Video',
  },
  'sora2': {
    label: 'Sora 2',
    credits: 50,
    durations: [4, 8, 12],
    defaultDuration: 8,
    aspectRatios: [
      { value: '16:9', label: '16:9 (Landscape)' },
      { value: '9:16', label: '9:16 (Portrait)' },
    ],
    defaultAspect: '16:9',
    audio: 'none',
    requiresImage: false,
    note: 'OpenAI Sora 2 · Text-to-Video',
  },
  'ltx23': {
    label: 'LTX 2.3',
    credits: 15,
    durations: [4, 6, 8],
    defaultDuration: 6,
    aspectRatios: [
      { value: '9:16', label: '9:16 (Portrait)' },
      { value: '16:9', label: '16:9 (Landscape)' },
    ],
    defaultAspect: '9:16',
    audio: 'none',
    requiresImage: true,
    note: 'LTX 2.3 · Image-to-Video (image required)',
  },
};

// ── Also replace the <select id="vidModel"> options in index.html with: ──
// <select class="select" id="vidModel" onchange="onModelChange()">
//   <option value="veo3-lite" selected>Veo 3.1 Lite</option>
//   <option value="sora2">Sora 2</option>
//   <option value="ltx23">LTX 2.3 (Image-to-Video)</option>
// </select>

// ══════════════════════════════════════════════════════════════════════════════
// Also update startVidGen() — replace the fetch call body section:
// The FormData fields stay the same, model values now match the new keys.
// One addition: show a warning if ltx23 is selected but no image uploaded.
// ══════════════════════════════════════════════════════════════════════════════
function startVidGenPatched() {
  const model = document.getElementById('vidModel').value;
  const cfg = MODEL_CONFIG[model];

  // LTX 2.3 requires an image
  if (model === 'ltx23' && !selectedImg) {
    document.getElementById('vidErr').classList.add('vis');
    document.getElementById('vidErrMsg').textContent = 'LTX 2.3 requires an image — please upload one above.';
    return;
  }

  // Call the original startVidGen logic (it reads model from the select automatically)
  startVidGen();
}
