require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');

// ── FFmpeg ──
let FFMPEG_PATH = ffmpegStatic;
try {
  const r = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' });
  if (r.stdout && r.stdout.trim()) {
    FFMPEG_PATH = r.stdout.trim();
    console.log('Using system ffmpeg:', FFMPEG_PATH);
  }
} catch(e) {}

function runFFmpeg(args, timeout = 180000) {
  const result = spawnSync(FFMPEG_PATH, args, { timeout, maxBuffer: 100 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('FFmpeg failed: ' + (result.stderr || '').toString().slice(0, 200));
}

// ── App ──
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => { req.setTimeout(0); res.setTimeout(0); if (req.socket) req.socket.setTimeout(0); next(); });
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());
app.use('/outputs', express.static('outputs'));

const upload = multer({ dest: 'uploads/', limits: { fileSize: 500 * 1024 * 1024 } });

['uploads', 'outputs', 'cache'].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Job queue ──
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
  try { resolve(await job()); }
  catch(e) { reject(e); }
  finally { activeJobs--; processQueue(); }
}

app.get('/queue', (req, res) => {
  res.json({ active: activeJobs, waiting: queue.length, max: MAX_CONCURRENT });
});

// ── Chatterbox warmup — keep Modal GPU warm every 4 minutes ──
function warmupChatterbox() {
  const CHATTERBOX_URL = process.env.CHATTERBOX_MODAL_URL;
  if (!CHATTERBOX_URL) return;
  axios.post(CHATTERBOX_URL, {
    text: 'warm',
    exaggeration: 0.5,
    cfg_weight: 0.5,
    temperature: 0.8,
    audio_prompt_b64: null,
  }, { timeout: 30000 }).then(() => {
    console.log('[warmup] Chatterbox pinged OK');
  }).catch(e => {
    console.log('[warmup] Chatterbox ping failed:', e.message);
  });
}
setInterval(warmupChatterbox, 4 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════════════════
// MODELSLAB HELPER
// ══════════════════════════════════════════════════════════════════════════════
async function modelsLabPoll(fetchUrl, apiKey, maxAttempts = 120, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const pollRes = await axios.post(fetchUrl, { key: apiKey }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    const d = pollRes.data;
    console.log(`[modelslab] poll ${i + 1} status=${d.status}`);
    if (d.status === 'success' && d.output?.[0]) return d.output[0];
    if (d.status === 'failed' || d.status === 'error') {
      throw new Error('ModelsLab generation failed: ' + (d.message || JSON.stringify(d).slice(0, 200)));
    }
  }
  throw new Error('ModelsLab generation timed out after 10 minutes');
}

// ══════════════════════════════════════════════════════════════════════════════
// KIE.AI HELPER
// ══════════════════════════════════════════════════════════════════════════════
async function kieAiPoll(taskId, apiKey, maxAttempts = 120, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const pollRes = await axios.get('https://api.kie.ai/api/v1/jobs/recordInfo', {
      params: { taskId },
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 15000,
    });
    const taskData = pollRes.data?.data || pollRes.data;
    const state = taskData?.state;
    console.log(`[kie.ai] poll ${i + 1} taskId=${taskId} state=${state}`);
    if (state === 'success') {
      console.log('[kie.ai] resultJson:', taskData.resultJson);
      let url = null;
      try { const rj = JSON.parse(taskData.resultJson); url = rj?.resultUrls?.[0] || rj?.result_urls?.[0]; } catch(e) {}
      if (!url) url = taskData?.video_url || taskData?.audio_url || taskData?.output?.video_url || taskData?.output?.audio_url;
      if (!url) throw new Error('Kie.ai success but no URL found. resultJson: ' + taskData.resultJson);
      return url;
    }
    if (state === 'failed' || state === 'error' || state === 'fail') {
      throw new Error('Kie.ai task failed. failMsg: ' + (taskData.failMsg || taskData.resultJson || 'unknown'));
    }
  }
  throw new Error('Kie.ai task timed out after 10 minutes');
}

// ══════════════════════════════════════════════════════════════════════════════
// AI VIDEO GEN  —  POST /generate-video
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-video', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const {
    model = 'veo3-lite',
    prompt = '',
    duration = '8',
    aspectRatio = '9:16',
    quality = '720p',
  } = req.body;

  const ML_KEY = process.env.MODELSLAB_API_KEY;
  const KIE_KEY = process.env.KIE_API_KEY;

  try {
    const result = await enqueue(async () => {
      console.log(`[generate-video] model=${model} duration=${duration}s aspect=${aspectRatio} quality=${quality} hasImage=${!!imagePath}`);

      let videoUrl;

      // ── GROK via Kie.ai ──
      if (model === 'grok') {
        if (!KIE_KEY) throw new Error('KIE_API_KEY not configured in .env');

        // Build Grok input — switch model based on whether image is provided
        let grokModel = 'grok-imagine/text-to-video';
        const grokInput = {
          prompt: prompt || 'Cinematic motion',
          aspect_ratio: aspectRatio,
          duration: String(parseInt(duration)),
          resolution: quality,
        };

        // If image uploaded, use image-to-video model
        if (imagePath && fs.existsSync(imagePath)) {
          grokModel = 'grok-imagine/image-to-video';
          const tempImgName = `temp_${timestamp}.jpg`;
          const tempImgPath = path.resolve(`outputs/${tempImgName}`);
          fs.copyFileSync(imagePath, tempImgPath);
          const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${PORT}`;
          grokInput.image_urls = [`${baseUrl}/outputs/${tempImgName}`];
          console.log(`[grok] image-to-video url=${grokInput.image_urls[0]}`);
          // Clean up temp image after 10 minutes
          setTimeout(() => { try { fs.unlinkSync(tempImgPath); } catch(e) {} }, 600000);
        }

        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model: grokModel,
          input: grokInput,
        }, {
          headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' },
          timeout: 60000,
        });

        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data).slice(0, 200));
        console.log(`[generate-video] Grok taskId=${taskId}`);
        videoUrl = await kieAiPoll(taskId, KIE_KEY);

      // ── Veo 3.1 Lite / Sora 2 via ModelsLab ──
      } else {
        if (!ML_KEY) throw new Error('MODELSLAB_API_KEY not configured in .env');

        const modelIdMap = {
          'veo3-lite': 'veo-3.1-lite-t2v',
          'veo3lite':  'veo-3.1-lite-t2v',
          'sora2':     'sora-2',
        };
        const modelId = modelIdMap[model] || 'veo-3.1-lite-t2v';

        const soraAspectMap = { '9:16': '720x1280', '16:9': '1280x720' };
        const soraAspect = model === 'sora2' ? (soraAspectMap[aspectRatio] || '720x1280') : aspectRatio;

        const body = {
          key: ML_KEY,
          model_id: modelId,
          prompt: prompt || 'Cinematic motion',
          aspect_ratio: soraAspect,
          duration: String(parseInt(duration)),
          enhance_prompt: true,
          negative_prompt: null,
          webhook: null,
          track_id: null,
        };

        if (model === 'veo3-lite' || model === 'veo3lite') {
          body.generate_audio = true;
        }

        if (imagePath && fs.existsSync(imagePath) && (model === 'veo3-lite' || model === 'veo3lite')) {
          const mimeType = req.file.mimetype || 'image/jpeg';
          body.init_image = `data:${mimeType};base64,${fs.readFileSync(imagePath).toString('base64')}`;
        }

        const submitRes = await axios.post(
          'https://modelslab.com/api/v7/video-fusion/text-to-video',
          body,
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        const d = submitRes.data;
        console.log(`[generate-video] ${model} submit status=${d.status} id=${d.id}`);
        if (d.status === 'success' && d.output?.[0]) videoUrl = d.output[0];
        else if (d.status === 'processing' && d.fetch_result) videoUrl = await modelsLabPoll(d.fetch_result, ML_KEY);
        else throw new Error('Unexpected ModelsLab response: ' + JSON.stringify(d).slice(0, 300));
      }

      // ── Download and save ──
      const outputPath = path.resolve(`outputs/gen_${timestamp}.mp4`);
      const dlRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 300000 });
      fs.writeFileSync(outputPath, Buffer.from(dlRes.data));

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
// AI IMAGE GEN  —  POST /generate-image  (Kie.ai)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-image', upload.single('refImage'), async (req, res) => {
  const refImagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const { model = 'nano-banana-pro', prompt = '', aspectRatio = '9:16', resolution = '1K', format = 'JPG' } = req.body;

  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
    return res.json({ success: false, error: 'KIE_API_KEY not configured in .env' });
  }

  const KIE_MODEL_MAP = {
    'nano-banana-pro': 'nano-banana-pro',
    'nano-banana-2':   'nano-banana-2',
  };
  const kieModel = KIE_MODEL_MAP[model] || 'nano-banana-pro';
  const RESOLUTION_MAP = { 'Basic': '1K', 'Standard': '2K', 'High': '4K', '1K': '1K', '2K': '2K', '4K': '4K' };
  const kieResolution = RESOLUTION_MAP[resolution] || '1K';

  try {
    const result = await enqueue(async () => {
      console.log(`[generate-image] model=${kieModel} aspect=${aspectRatio} res=${kieResolution} hasRef=${!!refImagePath}`);

      const body = {
        model: kieModel,
        input: { prompt, aspect_ratio: aspectRatio, resolution: kieResolution, output_format: 'png' },
      };
      if (refImagePath && fs.existsSync(refImagePath)) {
        // Serve image temporarily via public URL (Kie.ai needs a URL, not base64)
        const tempImgName = `temp_ref_${timestamp}.jpg`;
        const tempImgPublic = path.resolve(`outputs/${tempImgName}`);
        fs.copyFileSync(refImagePath, tempImgPublic);
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : `http://localhost:${PORT}`;
        const refImageUrl = `${baseUrl}/outputs/${tempImgName}`;
        console.log(`[generate-image] refImageUrl=${refImageUrl}`);
        body.input.image_input = [refImageUrl];
        setTimeout(() => { try { fs.unlinkSync(tempImgPublic); } catch(e) {} }, 600000);
      }

      const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', body, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      });

      const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
      if (!taskId) throw new Error('No taskId: ' + JSON.stringify(submitRes.data));
      console.log(`[generate-image] taskId=${taskId}`);

      const imageUrl = await kieAiPoll(taskId, KIE_API_KEY);

      const ext = format === 'PNG' ? 'png' : 'jpg';
      const outputPath = path.resolve(`outputs/img_${timestamp}.${ext}`);
      const dlRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });
      fs.writeFileSync(outputPath, Buffer.from(dlRes.data));

      if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);

      return { success: true, imageUrl: `/outputs/img_${timestamp}.${ext}` };
    });

    res.json(result);
  } catch(err) {
    console.error('[generate-image] error:', err.message);
    if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// VOICE GEN  —  POST /generate-voice  (Chatterbox on Modal, 10min timeout)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-voice', upload.single('voiceSample'), async (req, res) => {
  const voiceSamplePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const {
    text = '',
    voiceId,
    model: kieModel = 'elevenlabs/text-to-speech-turbo-2-5',
    speed = '1.0',
    stability = '0.5',
    similarity = '0.75',
    exaggeration = '0.5',
    cfgWeight = '0.5',
    temperature = '0.8',
  } = req.body;

  if (!text.trim()) {
    if (voiceSamplePath) try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
    return res.json({ success: false, error: 'No text provided' });
  }

  const isCloneMode = !!voiceSamplePath;

  try {
    const result = await enqueue(async () => {

      if (isCloneMode) {
        // ── Chatterbox voice cloning via Modal ──
        const CHATTERBOX_URL = process.env.CHATTERBOX_MODAL_URL;
        if (!CHATTERBOX_URL) throw new Error('CHATTERBOX_MODAL_URL not set');

        console.log(`[generate-voice] CLONE mode chars=${text.length} file=${voiceSamplePath}`);

        let audioB64;
        try {
          audioB64 = fs.readFileSync(voiceSamplePath).toString('base64');
        } catch(e) {
          throw new Error('Failed to read voice sample file: ' + e.message);
        }

        let response;
        try {
          response = await axios.post(CHATTERBOX_URL, {
            text: text.trim(),
            exaggeration: parseFloat(exaggeration),
            cfg_weight: parseFloat(cfgWeight),
            temperature: parseFloat(temperature),
            audio_prompt_b64: audioB64,
          }, { headers: { 'Content-Type': 'application/json' }, timeout: 600000 }); // 10 minutes
        } catch(e) {
          throw new Error('Chatterbox request failed: ' + e.message + (e.response ? ' — ' + JSON.stringify(e.response.data).slice(0, 200) : ''));
        }

        console.log('[chatterbox] success:', response.data.success, 'has audio:', !!response.data.audio_b64);

        if (!response.data.audio_b64) {
          throw new Error('Chatterbox returned no audio. Response: ' + JSON.stringify(response.data).slice(0, 300));
        }

        const outputPath = path.resolve(`outputs/voice_${timestamp}.wav`);
        fs.writeFileSync(outputPath, Buffer.from(response.data.audio_b64, 'base64'));
        try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
        setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);

        return { success: true, audioUrl: `/outputs/voice_${timestamp}.wav` };

      } else {
        // ── Kie.ai ElevenLabs preset ──
        const KIE_API_KEY = process.env.KIE_API_KEY;
        if (!KIE_API_KEY) throw new Error('KIE_API_KEY not set in .env');
        if (!voiceId) throw new Error('No voiceId provided');

        console.log(`[generate-voice] PRESET mode model=${kieModel} voiceId=${voiceId} chars=${text.length}`);

        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model: kieModel,
          input: {
            text: text.trim(),
            voice: voiceId,
            stability: parseFloat(stability),
            similarity_boost: parseFloat(similarity),
            speed: parseFloat(speed),
            style: 0,
          },
        }, {
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        });

        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data));
        console.log(`[generate-voice] Kie taskId=${taskId}`);

        const audioUrl = await kieAiPoll(taskId, KIE_API_KEY);

        const outputPath = path.resolve(`outputs/voice_${timestamp}.mp3`);
        const dlRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
        fs.writeFileSync(outputPath, Buffer.from(dlRes.data));
        setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);

        return { success: true, audioUrl: `/outputs/voice_${timestamp}.mp3` };
      }
    });

    res.json(result);
  } catch(err) {
    console.error('[generate-voice] error:', err.message);
    if (voiceSamplePath) try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO UPSCALER  —  POST /upscale-video
// ══════════════════════════════════════════════════════════════════════════════
app.post('/upscale-video', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { quality } = req.body;
  try {
    await enqueue(async () => {
      const outputPath = path.resolve(`outputs/upscaled_${timestamp}.mp4`);
      const resMap = { '1080': '1920:-1', '2k': '2560:-1', '4k': '3840:-1' };
      runFFmpeg(['-y', '-i', videoPath, '-vf', `scale=${resMap[quality] || '1920:-1'}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', outputPath], 300000);
      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });
    res.json({ success: true, videoUrl: `/outputs/upscaled_${timestamp}.mp4` });
  } catch(err) {
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DEAD SPACE REMOVER  —  POST /remove-deadspace
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-deadspace', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { strength = 'medium' } = req.body;

  // Voice-tuned presets: db = noise floor, duration = min silence length to cut
  const presets = {
    light:  { db: '-45', duration: '1.2' },
    medium: { db: '-38', duration: '0.6' },
    strong: { db: '-32', duration: '0.25' },
  };
  const p = presets[strength] || presets.medium;

  try {
    await enqueue(async () => {
      let inputPath = videoPath;
      const outputPath = path.resolve(`outputs/trimmed_${timestamp}.mp4`);
      const compressedPath = path.resolve(`outputs/compressed_${timestamp}.mp4`);

      // Step 0: auto-compress if over 100MB
      const fileSizeMB = require('fs').statSync(videoPath).size / (1024 * 1024);
      if (fileSizeMB > 100) {
        console.log(`[deadspace] compressing ${fileSizeMB.toFixed(0)}MB file first...`);
        runFFmpeg([
          '-y', '-i', videoPath,
          '-c:v', 'libx264', '-crf', '28', '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '128k',
          '-vf', 'scale=1280:-2',
          compressedPath
        ], 300000);
        inputPath = compressedPath;
        console.log(`[deadspace] compressed to ${(fs.statSync(compressedPath).size/1024/1024).toFixed(0)}MB`);
      }

      // Step 1: detect silence using voice frequency range
      console.log(`[deadspace] detecting silence: db=${p.db} duration=${p.duration}s`);
      const detectResult = spawnSync(FFMPEG_PATH, [
        '-i', inputPath,
        '-af', `highpass=f=100,lowpass=f=6000,afftdn=nf=-25,silencedetect=noise=${p.db}dB:duration=${p.duration}`,
        '-f', 'null', '-'
      ], { encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 });

      const stderr = (detectResult.stderr || '') + (detectResult.stdout || '');
      const silenceStarts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
      const silenceEnds = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));

      console.log(`[deadspace] found ${silenceStarts.length} silence intervals`);

      if (silenceStarts.length === 0) {
        // No silence detected — just re-encode
        console.log('[deadspace] no silence found, copying...');
        runFFmpeg(['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', outputPath], 120000);
      } else {
        // Step 2: build keep intervals
        const keepIntervals = [];
        let cursor = 0;
        for (let i = 0; i < silenceStarts.length; i++) {
          if (silenceStarts[i] > cursor + 0.05) {
            keepIntervals.push([cursor, silenceStarts[i]]);
          }
          cursor = silenceEnds[i] !== undefined ? silenceEnds[i] : silenceStarts[i] + parseFloat(p.duration);
        }
        keepIntervals.push([cursor, 999999]);

        console.log(`[deadspace] keeping ${keepIntervals.length} segments`);

        // Step 3: cut video + audio in sync
        const selectExpr = keepIntervals
          .map(([s, e]) => `between(t,${s.toFixed(3)},${e.toFixed(3)})`)
          .join('+');

        runFFmpeg([
          '-y', '-i', inputPath,
          '-vf', `select='${selectExpr}',setpts=N/FRAME_RATE/TB`,
          '-af', `aselect='${selectExpr}',asetpts=N/SR/TB`,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
          '-c:a', 'aac', '-vsync', 'vfr', outputPath
        ], 300000);
      }

      try { fs.unlinkSync(videoPath); } catch(e) {}
      if (inputPath !== videoPath) try { fs.unlinkSync(inputPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });
    res.json({ success: true, videoUrl: `/outputs/trimmed_${timestamp}.mp4` });
  } catch(err) {
    console.error('[deadspace] error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// YT SCRAPER  —  POST /scrape-channel  (YouTube Data API v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/scrape-channel', express.json(), async (req, res) => {
  const { channelUrl, count = 25, sort = 'newest' } = req.body;
  if (!channelUrl) return res.json({ success: false, error: 'No channel URL provided' });

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY) return res.json({ success: false, error: 'YOUTUBE_API_KEY not set' });

  try {
    const handle = channelUrl.replace(/\/$/, '').split('/').pop().replace('@', '');
    console.log(`[scraper] resolving handle=${handle} sort=${sort} count=${count}`);

    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: handle, type: 'channel', maxResults: 1, key: YT_KEY },
      timeout: 10000,
    });
    const channelId = searchRes.data.items?.[0]?.id?.channelId;
    if (!channelId) throw new Error('Could not find channel: ' + handle);
    console.log(`[scraper] channelId=${channelId}`);

    const chanRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'contentDetails', id: channelId, key: YT_KEY },
      timeout: 10000,
    });
    const uploadsPlaylistId = chanRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error('Could not get uploads playlist');

    const fetchCount = Math.min(parseInt(count) * (sort === 'newest' ? 1 : 4), 200);
    let videoIds = [];
    let pageToken = '';
    while (videoIds.length < fetchCount) {
      const plRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: 50, pageToken, key: YT_KEY },
        timeout: 10000,
      });
      videoIds.push(...plRes.data.items.map(i => i.contentDetails.videoId));
      if (!plRes.data.nextPageToken || videoIds.length >= fetchCount) break;
      pageToken = plRes.data.nextPageToken;
    }
    videoIds = videoIds.slice(0, fetchCount);
    console.log(`[scraper] got ${videoIds.length} video IDs`);

    let videos = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const vRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,statistics,contentDetails', id: batch.join(','), key: YT_KEY },
        timeout: 15000,
      });
      for (const item of vRes.data.items) {
        const dur = item.contentDetails.duration || '';
        const mMatch = dur.match(/(\d+)M/);
        const sMatch = dur.match(/(\d+)S/);
        const hMatch = dur.match(/(\d+)H/);
        const durSec = (hMatch ? parseInt(hMatch[1]) * 3600 : 0) +
                       (mMatch ? parseInt(mMatch[1]) * 60 : 0) +
                       (sMatch ? parseInt(sMatch[1]) : 0);
        if (durSec > 180) continue;
        const mins = Math.floor(durSec / 60);
        const secs = durSec % 60;

        // Fetch transcript via python script
        let transcript = '';
        const tResult = spawnSync('python3', ['get_transcript.py', item.id], {
          encoding: 'utf8', timeout: 8000, cwd: __dirname
        });
        transcript = (tResult.stdout || '').trim();

        videos.push({
          video_id: item.id,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          channel_id: item.snippet.channelId,
          channel_url: channelUrl,
          view_count: parseInt(item.statistics.viewCount || 0),
          like_count: parseInt(item.statistics.likeCount || 0),
          comment_count: parseInt(item.statistics.commentCount || 0),
          duration_seconds: durSec,
          duration_human: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
          publish_date: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
          description: item.snippet.description || '',
          tags: (item.snippet.tags || []).join(', '),
          transcript,
          is_live: false,
          category: item.snippet.categoryId || '',
        });
      }
    }

    if (sort === 'popular') videos.sort((a, b) => b.view_count - a.view_count);
    if (sort === 'trending') {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      videos = videos.filter(v => new Date(v.publish_date).getTime() > cutoff);
      videos.sort((a, b) => b.view_count - a.view_count);
    }
    videos = videos.slice(0, parseInt(count));
    console.log(`[scraper] returning ${videos.length} videos`);
    res.json({ success: true, videos });

  } catch(err) {
    console.error('[scraper] error:', err.message);
    res.json({ success: false, error: err.message });
  }
});


// ── Legal pages ──
app.get('/terms', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Terms of Service - DubShorts</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:60px auto;padding:0 20px;line-height:1.7;color:#222;}h1{color:#000;}a{color:#0066cc;}</style></head>
  <body>
  <h1>Terms of Service</h1>
  <p><strong>Last updated: April 2026</strong></p>
  <p>By using DubShorts AI Studio ("the Service"), you agree to these terms.</p>
  <h2>1. Use of Service</h2>
  <p>DubShorts provides AI-powered tools for content creation. You are responsible for all content you create and publish using the Service.</p>
  <h2>2. TikTok Integration</h2>
  <p>When you connect your TikTok account, you authorize DubShorts to upload content on your behalf. You may revoke access at any time through TikTok's settings.</p>
  <h2>3. Content</h2>
  <p>You retain ownership of all content you create. You grant DubShorts a limited license to process your content solely to provide the Service.</p>
  <h2>4. Prohibited Use</h2>
  <p>You may not use the Service to create content that violates TikTok's Community Guidelines or any applicable laws.</p>
  <h2>5. Disclaimer</h2>
  <p>The Service is provided "as is" without warranties of any kind. DubShorts is not responsible for any content published to third-party platforms.</p>
  <h2>6. Contact</h2>
  <p>For questions, contact us at support@dubshorts.ai</p>
  </body></html>`);
});

app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Privacy Policy - DubShorts</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:60px auto;padding:0 20px;line-height:1.7;color:#222;}h1{color:#000;}a{color:#0066cc;}</style></head>
  <body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated: April 2026</strong></p>
  <h2>1. Information We Collect</h2>
  <p>We collect information you provide when using DubShorts, including prompts, uploaded media, and account connection tokens.</p>
  <h2>2. TikTok Data</h2>
  <p>When you connect your TikTok account via OAuth, we store only the access token required to upload content on your behalf. We do not store your TikTok password. You can revoke access at any time.</p>
  <h2>3. How We Use Your Data</h2>
  <p>We use your data solely to provide the Service. We do not sell your data to third parties.</p>
  <h2>4. Data Storage</h2>
  <p>Generated content is temporarily stored on our servers and automatically deleted after 10 minutes. Access tokens are encrypted at rest.</p>
  <h2>5. Third-Party Services</h2>
  <p>DubShorts uses the following third-party services: TikTok (content posting), Kie.ai (AI generation), Modal (voice processing), Railway (hosting).</p>
  <h2>6. Your Rights</h2>
  <p>You may request deletion of your data at any time by contacting support@dubshorts.ai</p>
  <h2>7. Contact</h2>
  <p>For privacy questions, contact support@dubshorts.ai</p>
  </body></html>`);
});


// ── TikTok domain verification ──
app.get('/tiktokmbOjActDa5ANJmRCnS6hvkmXi09O0Nt7.txt', (req, res) => {
  res.type('text/plain').send('tiktok-developers-site-verification=mbOjActDa5ANJmRCnS6hvkmXi09O0Nt7');
});


// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE API PROXY  —  POST /api/claude
// ══════════════════════════════════════════════════════════════════════════════
res.json(response.data);


// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE API PROXY  —  POST /api/claude
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/claude', express.json(), async (req, res) => {
  const { prompt, max_tokens = 1000 } = req.body;
  if (!prompt) return res.json({ success: false, error: 'No prompt provided' });
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY not set' });
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens,
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    res.json(response.data);
  } catch(err) {
    console.error('[claude-api] error:', err.message);
    const detail = err.response?.data || err.message;
    console.error('[claude-api] detail:', JSON.stringify(detail));
    res.status(500).json({ success: false, error: err.message, detail });
  }
});

app.post('/enable-repurpose', async (req, res) => {
  const { ytChannel, platforms } = req.body;
  res.json({ success: true, status: 'active', monitoring: ytChannel, platforms });
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n✅ DubShorts v3 running at http://localhost:' + PORT);
  console.log('   MODELSLAB_API_KEY :', process.env.MODELSLAB_API_KEY   ? '✓ set' : '✗ not set');
  console.log('   KIE_API_KEY       :', process.env.KIE_API_KEY         ? '✓ set' : '✗ not set');
  console.log('   CHATTERBOX_URL    :', process.env.CHATTERBOX_MODAL_URL ? '✓ set' : '✗ not set (voice cloning disabled)');
  console.log('   YOUTUBE_API_KEY   :', process.env.YOUTUBE_API_KEY     ? '✓ set' : '✗ not set');
  console.log('');
});

process.on('uncaughtException', err => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught exception:', err.message);
});
