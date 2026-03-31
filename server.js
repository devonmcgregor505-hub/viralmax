require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ffmpegStatic = require('ffmpeg-static');

let FFMPEG_PATH = ffmpegStatic;
try {
  const r = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' });
  if (r.stdout && r.stdout.trim()) { FFMPEG_PATH = r.stdout.trim(); console.log('Using system ffmpeg:', FFMPEG_PATH); }
  else console.log('Using ffmpeg-static:', FFMPEG_PATH);
} catch(e) { console.log('Using ffmpeg-static:', FFMPEG_PATH); }

function runFFmpeg(args, timeout = 180000) {
  const result = spawnSync(FFMPEG_PATH, args, { timeout, maxBuffer: 100 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('FFmpeg failed: ' + (result.stderr || result.stdout || Buffer.from('')).toString().slice(-400));
}

const app = express();
app.use((req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); });
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());
app.use('/outputs', express.static('outputs'));

const upload = multer({ dest: 'uploads/', limits: { fileSize: 500 * 1024 * 1024 } });

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');
if (!fs.existsSync('cache')) fs.mkdirSync('cache');

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.get('/clear-cache', (req, res) => {
  try {
    const files = fs.readdirSync('cache');
    files.forEach(f => fs.unlinkSync(path.join('cache', f)));
    res.send('Cache cleared: ' + files.length + ' files deleted');
  } catch(e) { res.send('Cache clear error: ' + e.message); }
});

// ── Queue ─────────────────────────────────────────────────────────────────────
const queue = [];
let activeJobs = 0;
const MAX_CONCURRENT = 8;

function enqueue(job) {
  return new Promise((resolve, reject) => {
    queue.push({ job, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (activeJobs >= MAX_CONCURRENT || queue.length === 0) return;
  activeJobs++;
  const { job, resolve, reject } = queue.shift();
  try { resolve(await job()); } catch(e) { reject(e); } finally { activeJobs--; processQueue(); }
}

app.get('/queue', (req, res) => {
  res.json({ active: activeJobs, waiting: queue.length, max: MAX_CONCURRENT });
});

// ── Cache helpers ─────────────────────────────────────────────────────────────
function getCacheKey(fileBuffer, lang) {
  return crypto.createHash('md5').update(fileBuffer).update(lang).update('elevenlabs').digest('hex');
}
function getCachedResult(key) {
  const p = path.join('cache', key + '.mp4');
  return fs.existsSync(p) ? p : null;
}
function setCachedResult(key, outputPath) {
  try { fs.copyFileSync(outputPath, path.join('cache', key + '.mp4')); } catch(e) {}
}

// ── ElevenLabs dubbing ────────────────────────────────────────────────────────
const ELEVEN_LANG_MAP = { es:'es', hi:'hi', pt:'pt', ja:'ja', fr:'fr', pl:'pl', it:'it', zh:'zh', en:'en' };

async function dubWithElevenLabs(videoPath, targetLang) {
  const lang = ELEVEN_LANG_MAP[targetLang] || targetLang;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  console.log('ElevenLabs: submitting dub job ->', lang);
  const form = new FormData();
  form.append('file', fs.createReadStream(videoPath), { filename: 'input.mp4', contentType: 'video/mp4' });
  form.append('target_lang', lang);
  form.append('source_lang', 'en');
  form.append('num_speakers', '0');
  form.append('watermark', 'true');

  const submitRes = await axios.post('https://api.elevenlabs.io/v1/dubbing', form, {
    headers: { 'xi-api-key': apiKey, ...form.getHeaders() },
    timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity,
  });

  const dubbingId = submitRes.data.dubbing_id;
  const expectedDuration = submitRes.data.expected_duration_sec || 300;
  if (!dubbingId) throw new Error('ElevenLabs: no dubbing_id — ' + JSON.stringify(submitRes.data).slice(0, 200));
  console.log('ElevenLabs: job submitted. id=' + dubbingId + ' expected=' + expectedDuration + 's');

  const maxAttempts = Math.ceil((expectedDuration * 3 * 1000) / 5000) + 20;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await axios.get('https://api.elevenlabs.io/v1/dubbing/' + dubbingId, {
      headers: { 'xi-api-key': apiKey }, timeout: 15000,
    });
    const { status, error } = statusRes.data;
    console.log('Poll ' + (i+1) + '/' + maxAttempts + ': ' + status);
    if (status === 'dubbed') break;
    if (status === 'failed') throw new Error('ElevenLabs dubbing failed: ' + (error || 'unknown'));
  }

  console.log('ElevenLabs: downloading result...');
  const downloadRes = await axios.get('https://api.elevenlabs.io/v1/dubbing/' + dubbingId + '/audio/' + lang, {
    headers: { 'xi-api-key': apiKey },
    responseType: 'arraybuffer',
    timeout: 120000,
  });

  return { data: downloadRes.data, dubbingId };
}

// ── LaMa inpaint via Modal ────────────────────────────────────────────────────
async function runInpaintModal(videoIn, videoOut, box) {
  const videoBuffer = fs.readFileSync(videoIn);
  const base64Video = videoBuffer.toString('base64');
  console.log('Sending to Modal GPU...');
  const response = await axios.post(
    'https://devonmcgregor505--dubshorts-caption-remover-remove-captions.modal.run',
    { video_b64: base64Video, box: box },
    { timeout: 600000, maxContentLength: Infinity, maxBodyLength: Infinity }
  );
  if (!response.data.success) throw new Error(response.data.error || 'Modal inpaint failed');
  const outBuffer = Buffer.from(response.data.video_b64, 'base64');
  fs.writeFileSync(videoOut, outBuffer);
  console.log('Modal inpaint complete!');
}

// ══════════════════════════════════════════════════════════════════════════════
// AI VIDEO GEN — /generate-video
// Image-to-video via Kie.ai API
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-video', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();

  const model    = req.body.model      || 'veo3-fast';
  const prompt   = req.body.prompt     || '';
  const audio    = req.body.audio      === 'true';
  const duration = req.body.duration   || '5s';
  const resolution = req.body.resolution || '720p';

  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    if (imagePath) try { fs.unlinkSync(imagePath); } catch(e) {}
    return res.json({ success: false, error: 'KIE_API_KEY not set in .env' });
  }

  // Map our model keys to Kie.ai model strings
  const MODEL_MAP = {
    'grok-6s-480p':    { model: 'grok-imagine',        duration: 6,  resolution: '480p' },
    'grok-6s-720p':    { model: 'grok-imagine',        duration: 6,  resolution: '720p' },
    'grok-10s-720p':   { model: 'grok-imagine',        duration: 10, resolution: '720p' },
    'veo3-fast':       { model: 'veo3-fast',            duration: 8,  resolution: '720p' },
    'veo3-quality':    { model: 'veo3-quality',         duration: 8,  resolution: '1080p' },
    'kling3-720p':     { model: 'kling/v3-standard',   duration: null, resolution: '720p' },
    'kling3-1080p':    { model: 'kling/v3-standard',   duration: null, resolution: '1080p' },
    'kling2.5t-5s':    { model: 'kling/v2-5-turbo',    duration: 5,  resolution: '720p' },
    'kling2.5t-10s':   { model: 'kling/v2-5-turbo',    duration: 10, resolution: '720p' },
    'sora2-10s':       { model: 'sora2',                duration: 10, resolution: '720p' },
    'sora2-15s':       { model: 'sora2',                duration: 15, resolution: '720p' },
    'hailuo02-6s':     { model: 'hailuo-02',            duration: 6,  resolution: '512p' },
    'hailuo02-10s':    { model: 'hailuo-02',            duration: 10, resolution: '512p' },
    'hailuo23-6s':     { model: 'hailuo-2.3',           duration: 6,  resolution: '768p' },
    'wan26-5s-720p':   { model: 'wan-2.6',              duration: 5,  resolution: '720p' },
    'wan26-10s-720p':  { model: 'wan-2.6',              duration: 10, resolution: '720p' },
    'wan26-5s-1080p':  { model: 'wan-2.6',              duration: 5,  resolution: '1080p' },
  };

  const modelCfg = MODEL_MAP[model] || MODEL_MAP['veo3-fast'];

  try {
    const result = await enqueue(async () => {
      console.log(`[generate-video] model=${model} audio=${audio} duration=${duration} resolution=${resolution}`);

      // Build Kie.ai request body
      const body = {
        model: modelCfg.model,
        prompt: prompt || 'Cinematic motion, smooth camera movement',
        audio: audio,
        duration: modelCfg.duration,
        resolution: modelCfg.resolution,
        aspect_ratio: '9:16',
      };

      // If image provided, read as base64
      if (imagePath && fs.existsSync(imagePath)) {
        const imgBuffer = fs.readFileSync(imagePath);
        body.image = imgBuffer.toString('base64');
        body.image_mime_type = req.file.mimetype || 'image/jpeg';
      }

      // Submit to Kie.ai
      const submitRes = await axios.post('https://api.kie.ai/v1/video/generate', body, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const taskId = submitRes.data?.data?.task_id || submitRes.data?.task_id;
      if (!taskId) throw new Error('Kie.ai: no task_id returned — ' + JSON.stringify(submitRes.data).slice(0, 300));
      console.log('[generate-video] task_id:', taskId);

      // Poll for completion
      const maxPolls = 120; // 10 min max
      let videoUrl = null;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await axios.get(`https://api.kie.ai/v1/video/task/${taskId}`, {
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
          timeout: 15000,
        });
        const taskData = pollRes.data?.data || pollRes.data;
        const status = taskData?.status;
        console.log(`[generate-video] poll ${i+1}/${maxPolls}: ${status}`);

        if (status === 'completed' || status === 'success') {
          videoUrl = taskData?.video_url || taskData?.output?.video_url;
          break;
        }
        if (status === 'failed' || status === 'error') {
          throw new Error('Kie.ai generation failed: ' + (taskData?.error || 'unknown'));
        }
      }

      if (!videoUrl) throw new Error('Generation timed out after polling');

      // Download the video to outputs/
      const outputPath = path.resolve(`outputs/gen_${timestamp}.mp4`);
      const dlRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
      fs.writeFileSync(outputPath, Buffer.from(dlRes.data));

      // Cleanup
      if (imagePath) try { fs.unlinkSync(imagePath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);

      return { success: true, videoUrl: `/outputs/gen_${timestamp}.mp4` };
    });

    res.json(result);
  } catch(err) {
    console.error('[generate-video] error:', err.message);
    if (imagePath) try { fs.unlinkSync(imagePath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI AUTOMATION — /automation-job
// ══════════════════════════════════════════════════════════════════════════════
app.post('/automation-job', upload.single('charImage'), async (req, res) => {
  const charImagePath = req.file ? path.resolve(req.file.path) : null;
  const { niche, script, ytLink } = req.body;

  if (!script) {
    if (charImagePath) try { fs.unlinkSync(charImagePath); } catch(e) {}
    return res.status(400).json({ success: false, error: 'Script is required' });
  }

  console.log(`[automation-job] niche=${niche} ytLink=${ytLink} charImage=${charImagePath ? 'yes' : 'no'}`);

  // TODO: wire up your actual automation pipeline here
  // For now we log the job and return an estimated time
  const jobId = crypto.randomBytes(8).toString('hex');
  console.log(`[automation-job] queued job ${jobId}`);

  // Cleanup char image after logging
  if (charImagePath) {
    setTimeout(() => { try { fs.unlinkSync(charImagePath); } catch(e) {} }, 30000);
  }

  // Placeholder response — replace with real pipeline
  res.json({
    success: true,
    jobId,
    estimatedTime: '5–15 minutes',
    message: `Job ${jobId} queued for niche: ${niche}`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CAPTION REMOVER — /remove-captions
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-captions', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const box = JSON.parse(req.body.captionBox || '{}');
  if (!box.x && box.x !== 0) return res.status(400).json({ success: false, error: 'No captionBox provided' });

  const workDir = path.resolve('outputs/inpaint_' + timestamp);
  fs.mkdirSync(workDir, { recursive: true });

  const inpainted540 = path.resolve(workDir, 'inpainted_540.mp4');
  const outputPath   = path.resolve('outputs/clean_' + timestamp + '.mp4');

  try {
    await enqueue(async () => {
      console.log('Step 1: Inpainting captions...');
      runInpaintModal(videoPath, inpainted540, box);

      console.log('Step 2: Upscaling to 1080p + merging original audio...');
      runFFmpeg([
        '-y',
        '-i', inpainted540,
        '-i', videoPath,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-vf', 'scale=1080:-2',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
        '-c:a', 'aac', '-ac', '2',
        '-shortest',
        outputPath,
      ], 300000);

      try { fs.unlinkSync(videoPath); } catch(e) {}
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, videoUrl: '/outputs/clean_' + timestamp + '.mp4' });
  } catch(err) {
    console.error('remove-captions error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// CAPTION REMOVER FAST — /remove-captions-fast (delogo fallback)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-captions-fast', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const box = JSON.parse(req.body.captionBox || '{}');
  if (box.x === undefined) return res.status(400).json({ success: false, error: 'No captionBox' });

  const outputPath = path.resolve('outputs/clean_fast_' + timestamp + '.mp4');

  try {
    await enqueue(async () => {
      const probe = spawnSync(FFMPEG_PATH, ['-i', videoPath], { encoding: 'utf8' });
      const dimMatch = (probe.stderr || '').match(/(\d{3,5})x(\d{3,5})/);
      const W = dimMatch ? parseInt(dimMatch[1]) : 1080;
      const H = dimMatch ? parseInt(dimMatch[2]) : 1920;

      const bx = Math.round(box.x * W);
      const by = Math.round(box.y * H);
      const bw = Math.round(box.w * W);
      const bh = Math.round(box.h * H);

      runFFmpeg([
        '-y', '-i', videoPath,
        '-vf', `delogo=x=${bx}:y=${by}:w=${bw}:h=${bh}:show=0`,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
        '-c:a', 'aac',
        outputPath,
      ], 180000);

      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, videoUrl: '/outputs/clean_fast_' + timestamp + '.mp4' });
  } catch(err) {
    console.error('remove-captions-fast error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTO TEXT DETECTION — /remove-captions-auto
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-captions-auto', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const outputPath = path.resolve('outputs/clean_auto_' + timestamp + '.mp4');
  const workDir = path.resolve('outputs/inpaint_auto_' + timestamp);
  const captionBox = req.body.captionBox ? JSON.parse(req.body.captionBox) : null;

  if (!captionBox) {
    return res.status(400).json({ success: false, error: 'Please draw a box around the captions first' });
  }

  fs.mkdirSync(workDir, { recursive: true });

  try {
    await enqueue(async () => {
      console.log('Step 1: Detecting text within your box...');
      const python = path.join(__dirname, 'venv/bin/python');
      const script = path.join(__dirname, 'detect_and_inpaint_hybrid.py');
      const tempOutput = path.resolve(workDir, 'inpainted_temp.mp4');

      const result = spawnSync(python, [script, videoPath, tempOutput, JSON.stringify(captionBox)], {
        timeout: 600000,
        maxBuffer: 100 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const out = (result.stdout || '').toString();
      const err = (result.stderr || '').toString();
      if (out) console.log('[hybrid]', out.trim());
      if (result.status !== 0) throw new Error('Auto-detection failed: ' + err.slice(-400));

      console.log('Step 2: Finalizing video...');
      if (!fs.existsSync(tempOutput)) throw new Error('Inpainting produced no output file');

      const probeInpainted = spawnSync(FFMPEG_PATH, ['-i', tempOutput], { encoding: 'utf8' });
      const hasAudio = (probeInpainted.stderr || '').includes('Audio:');

      if (!hasAudio) {
        const tempWithAudio = path.resolve(workDir, 'with_audio.mp4');
        runFFmpeg([
          '-y', '-i', tempOutput, '-i', videoPath,
          '-map', '0:v:0', '-map', '1:a:0',
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
          '-c:a', 'aac', '-ac', '2', '-shortest',
          tempWithAudio,
        ], 180000);
        fs.copyFileSync(tempWithAudio, outputPath);
        try { fs.unlinkSync(tempWithAudio); } catch(e) {}
      } else {
        fs.copyFileSync(tempOutput, outputPath);
      }

      try { fs.unlinkSync(videoPath); } catch(e) {}
      try { fs.unlinkSync(tempOutput); } catch(e) {}
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, videoUrl: '/outputs/clean_auto_' + timestamp + '.mp4' });
  } catch(err) {
    console.error('remove-captions-auto error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n✅ DubShorts running at http://localhost:' + PORT);
  console.log('   KIE_API_KEY:', process.env.KIE_API_KEY ? '✓ set' : '✗ not set');
  console.log('   ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✓ set' : '✗ not set');
  console.log('   ASSEMBLYAI_API_KEY:', process.env.ASSEMBLYAI_API_KEY ? '✓ set' : '✗ not set\n');
});

process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught exception:', err.message);
});
