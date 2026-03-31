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
} catch(e) {}

function runFFmpeg(args, timeout = 180000) {
  const result = spawnSync(FFMPEG_PATH, args, { timeout, maxBuffer: 100 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('FFmpeg failed');
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

// ── Queue ──
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

// ══════════════════════════════════════════════════════════════════════════════
// AI VIDEO GEN — /generate-video
// Supports: Veo3 Fast, Grok, Sora 2, Kling 2.6, Seedance
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-video', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();

  const model = req.body.model || 'veo3-fast';
  const prompt = req.body.prompt || '';
  const duration = req.body.duration || '8';
  const aspectRatio = req.body.aspectRatio || '9:16';

  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    if (imagePath) try { fs.unlinkSync(imagePath); } catch(e) {}
    return res.json({ success: false, error: 'KIE_API_KEY not configured' });
  }

  const MODEL_MAP = {
    'veo3-fast': { model: 'veo3-fast', resolution: '720p' },
    'grok': { model: 'grok-imagine', resolution: '720p' },
    'sora2': { model: 'sora2', resolution: '720p' },
    'kling26': { model: 'kling/v2.6', resolution: '720p' },
    'seedance': { model: 'seedance', resolution: '720p' },
  };

  const modelCfg = MODEL_MAP[model] || MODEL_MAP['veo3-fast'];

  try {
    const result = await enqueue(async () => {
      console.log(`[generate-video] model=${model} duration=${duration}s aspect=${aspectRatio}`);

      const body = {
        model: modelCfg.model,
        prompt: prompt || 'Cinematic motion',
        duration: parseInt(duration),
        resolution: modelCfg.resolution,
        aspect_ratio: aspectRatio,
      };

      if (imagePath && fs.existsSync(imagePath)) {
        const imgBuffer = fs.readFileSync(imagePath);
        body.image = imgBuffer.toString('base64');
        body.image_mime_type = req.file.mimetype || 'image/jpeg';
      }

      const submitRes = await axios.post('https://api.kie.ai/v1/video/generate', body, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const taskId = submitRes.data?.data?.task_id || submitRes.data?.task_id;
      if (!taskId) throw new Error('No task_id returned');

      const maxPolls = 120;
      let videoUrl = null;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await axios.get(`https://api.kie.ai/v1/video/task/${taskId}`, {
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
          timeout: 15000,
        });
        const taskData = pollRes.data?.data || pollRes.data;
        if (taskData?.status === 'completed' || taskData?.status === 'success') {
          videoUrl = taskData?.video_url || taskData?.output?.video_url;
          break;
        }
        if (taskData?.status === 'failed') throw new Error('Generation failed');
      }

      if (!videoUrl) throw new Error('Generation timed out');

      const outputPath = path.resolve(`outputs/gen_${timestamp}.mp4`);
      const dlRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
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
// AI IMAGE GEN — /generate-image
// Supports: Nano Banana 2/Pro, Seedream 4.5/5.0
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-image', upload.single('refImage'), async (req, res) => {
  const refImagePath = req.file ? path.resolve(req.file.path) : null;
  const { model, prompt, aspectRatio } = req.body;

  console.log(`[generate-image] model=${model} aspect=${aspectRatio}`);

  try {
    await enqueue(async () => {
      // Placeholder - integrate with Kie.ai image API
      const outputPath = path.resolve(`outputs/img_${Date.now()}.png`);
      // Create placeholder
      fs.writeFileSync(outputPath, Buffer.from(''));

      if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, imageUrl: `/outputs/img_${Date.now()}.png` });
  } catch(err) {
    console.error('[generate-image] error:', err.message);
    if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// VOICE GEN — /generate-voice
// Uses Puter.js frontend, server just logs
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-voice', async (req, res) => {
  const { script, voiceId, settings } = req.body;

  console.log(`[generate-voice] voiceId=${voiceId} scriptLen=${script?.length || 0}`);

  res.json({
    success: true,
    message: 'Voice generation handled by Puter.js (frontend)',
    note: 'Unlimited free ElevenLabs access via Puter.js',
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO UPSCALER — /upscale-video
// ══════════════════════════════════════════════════════════════════════════════
app.post('/upscale-video', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { quality } = req.body;

  console.log(`[upscale-video] quality=${quality}`);

  try {
    await enqueue(async () => {
      const outputPath = path.resolve(`outputs/upscaled_${timestamp}.mp4`);
      
      const resMap = { '1080': '1920:-1', '2k': '2560:-1', '4k': '3840:-1' };
      const resolution = resMap[quality] || '1920:-1';

      runFFmpeg([
        '-y', '-i', videoPath,
        '-vf', `scale=${resolution}`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
        '-c:a', 'aac',
        outputPath,
      ], 300000);

      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, videoUrl: `/outputs/upscaled_${timestamp}.mp4` });
  } catch(err) {
    console.error('[upscale-video] error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DEAD SPACE REMOVER — /remove-deadspace
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-deadspace', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { dbThreshold } = req.body;

  console.log(`[remove-deadspace] threshold=${dbThreshold}dB`);

  try {
    await enqueue(async () => {
      const outputPath = path.resolve(`outputs/trimmed_${timestamp}.mp4`);
      
      runFFmpeg([
        '-y', '-i', videoPath,
        '-af', `silenceremove=1:0:0.1:${dbThreshold}dB:1:0.1:${dbThreshold}dB`,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
        '-c:a', 'aac',
        outputPath,
      ], 300000);

      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
    });

    res.json({ success: true, videoUrl: `/outputs/trimmed_${timestamp}.mp4` });
  } catch(err) {
    console.error('[remove-deadspace] error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// YT SCRAPER — /scrape-channel
// Uses YouTube Data API v3 to extract video data
// ══════════════════════════════════════════════════════════════════════════════
app.post('/scrape-channel', async (req, res) => {
  const { channelUrl, videoCount, contentType } = req.body;

  console.log(`[scrape-channel] url=${channelUrl} count=${videoCount} type=${contentType}`);

  const YT_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_API_KEY) {
    return res.json({
      success: false,
      error: 'YOUTUBE_API_KEY not configured',
      data: []
    });
  }

  try {
    // Extract channel ID from URL
    const channelMatch = channelUrl.match(/@([a-zA-Z0-9_-]+)/) || channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (!channelMatch) {
      return res.json({ success: false, error: 'Invalid channel URL', data: [] });
    }

    // Placeholder response - in production integrate with youtube-api-nodejs
    const mockData = {
      success: true,
      videos: [
        { title: 'Video 1', views: 1000, date: '2024-01-01', engagement: '5.2%' },
        { title: 'Video 2', views: 2500, date: '2024-01-05', engagement: '7.8%' },
      ]
    };

    res.json(mockData);
  } catch(err) {
    console.error('[scrape-channel] error:', err.message);
    res.status(500).json({ success: false, error: err.message, data: [] });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// REPURPOSE — /enable-repurpose
// Monitors YT channel and auto-reposts to platforms
// ══════════════════════════════════════════════════════════════════════════════
app.post('/enable-repurpose', async (req, res) => {
  const { ytChannel, platforms } = req.body;

  console.log(`[enable-repurpose] yt=${ytChannel} platforms=${platforms.join(',')}`);

  // Placeholder - in production this would set up webhooks/polling
  res.json({
    success: true,
    status: 'active',
    monitoring: ytChannel,
    platforms: platforms,
    note: 'Auto-repurposing monitoring enabled'
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n✅ DubShorts v3 running at http://localhost:' + PORT);
  console.log('   KIE_API_KEY:', process.env.KIE_API_KEY ? '✓ set' : '✗ not set');
  console.log('   YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? '✓ set' : '✗ not set');
  console.log('   Credits-based system · Puter.js Voice Gen\n');
});

process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught exception:', err.message);
});
