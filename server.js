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
  if (result.status !== 0) {
    const stderr = (result.stderr || '').toString();
    const errorLine = stderr.split('\n').filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('invalid') || l.toLowerCase().includes('no such')).join(' ') || stderr.slice(-300);
    throw new Error('FFmpeg failed: ' + errorLine);
  }
}

function runFFmpegGetStderr(args, timeout = 180000) {
  const result = spawnSync(FFMPEG_PATH, args, { timeout, maxBuffer: 100 * 1024 * 1024 });
  return { status: result.status, stderr: (result.stderr || '').toString() };
}

// ── App ──
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); });
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/outputs', express.static('outputs'));

// Serve static files from root and pages/ directory
app.use(express.static(__dirname));
app.use('/pages', express.static(path.join(__dirname, 'pages')));

const upload = multer({ dest: 'uploads/', limits: { fileSize: 500 * 1024 * 1024 } });

['uploads', 'outputs', 'cache'].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

// ── PAGE ROUTES ──
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'signup.html')));
app.get('/legal', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'legal.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'checkout.html')));
app.get('/pricing', (req, res) => res.redirect('/#pricing'));

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

// ── Chatterbox warmup ──
function warmupChatterbox() {
  const CHATTERBOX_URL = process.env.CHATTERBOX_MODAL_URL;
  if (!CHATTERBOX_URL) return;
  axios.post(CHATTERBOX_URL, {
    text: 'warm', exaggeration: 0.5, cfg_weight: 0.5, temperature: 0.8, audio_prompt_b64: null,
  }, { timeout: 30000 }).then(() => {
    console.log('[warmup] Chatterbox pinged OK');
  }).catch(e => {
    console.log('[warmup] Chatterbox ping failed:', e.message);
  });
}
setInterval(warmupChatterbox, 4 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE API HELPER
// ══════════════════════════════════════════════════════════════════════════════
async function callClaude(messages, systemPrompt = '', maxTokens = 4096) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set in .env');

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await axios.post('https://api.anthropic.com/v1/messages', body, {
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 120000,
  });

  return res.data.content?.[0]?.text || '';
}

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
// PIPELINE ROUTES
// ══════════════════════════════════════════════════════════════════════════════
app.post('/pipeline/ideate', upload.array('channelFiles', 10), async (req, res) => {
  const { customIdea } = req.body;
  const files = req.files || [];
  try {
    let channelData = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(file.path, 'utf8');
        const parsed = JSON.parse(raw);
        channelData.push(parsed);
        fs.unlinkSync(file.path);
      } catch(e) { try { fs.unlinkSync(file.path); } catch(e2) {} }
    }
    if (customIdea && customIdea.trim()) {
      return res.json({ success: true, ideas: [customIdea.trim()], custom: true });
    }
    if (channelData.length === 0) {
      return res.json({ success: false, error: 'Please upload at least one channel data file or enter your own idea.' });
    }
    const channelSummary = channelData.map((ch, i) => {
      const videos = Array.isArray(ch) ? ch : (ch.videos || []);
      const topVideos = videos.slice(0, 15).map(v => `  - "${v.title}" — ${(v.view_count || 0).toLocaleString()} views`).join('\n');
      return `Channel ${i + 1}:\n${topVideos}`;
    }).join('\n\n');
    const prompt = `Based on all the data from the channels above, could you give me 5 viral worthy ideas for yt shorts (in viral worthy title format)\n\nChannel data:\n${channelSummary}\n\nReturn ONLY a JSON array of exactly 5 strings, no other text:\n["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]`;
    const response = await callClaude([{ role: 'user', content: prompt }], '', 1000);
    let ideas;
    try {
      const clean = response.replace(/```json|```/g, '').trim();
      ideas = JSON.parse(clean);
    } catch(e) {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) ideas = JSON.parse(match[0]);
      else throw new Error('Could not parse ideas from Claude response');
    }
    res.json({ success: true, ideas });
  } catch(err) {
    console.error('[pipeline/ideate] error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

app.post('/pipeline/script', express.json(), async (req, res) => {
  const { idea, channelData, customPrompt } = req.body;
  if (!idea) return res.json({ success: false, error: 'No idea provided' });
  try {
    let channelContext = '';
    if (channelData && channelData.length > 0) {
      const topScripts = channelData.flatMap(ch => {
        const videos = Array.isArray(ch) ? ch : (ch.videos || []);
        return videos.slice(0, 5).map(v => `Title: "${v.title}"\nViews: ${(v.view_count || 0).toLocaleString()}\nDescription: ${(v.description || '').slice(0, 200)}`);
      }).slice(0, 10).join('\n\n---\n\n');
      channelContext = `\n\nHere are the competitor's most viral videos for reference on style, length, and pacing:\n\n${topScripts}`;
    }
    const prompt = `With the idea we just got, and based on channels attached and their success, make me a similar length viral script for the idea above (put it in 1 big paragraph).\n\nIdea: ${idea}${channelContext}\n\nReturn ONLY the script text, nothing else.`;
    const script = await callClaude([{ role: 'user', content: prompt }], '', 2000);
    res.json({ success: true, script: script.trim() });
  } catch(err) {
    console.error('[pipeline/script] error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

app.post('/pipeline/scenes', express.json(), async (req, res) => {
  const { script, idea } = req.body;
  if (!script) return res.json({ success: false, error: 'No script provided' });
  try {
    const prompt = `You are creating a YouTube Shorts production breakdown for the skeleton niche.\n\nThe video idea is: "${idea || 'skeleton transformation video'}"\n\nHere is the full script:\n---\n${script}\n---\n\nYOUR TASK: Split this script into scenes and generate image + video prompts for each scene.\n\nSCENE SPLITTING RULES:\n- SKIP the very first sentence of the script entirely (do not make it a scene)\n- Split logically where the visual would need to change\n- Each scene = one distinct visual moment\n- Keep the exact script text for each scene\n\nIMAGE PROMPT RULES:\n- Start EVERY image prompt with exactly: "Keep the skeleton the exact same as the reference image (with the white body and clear skin) make the skeleton the size of a normal human compared to the environment, and make the skeleton naturally apart of the environment. Make the skeleton naturally a part of the environment. Not just forward, facing the camera strangely"\n- Then describe the scene in vivid detail\n- Optimised for 9:16 vertical format\n\nVIDEO PROMPT RULES:\n- Start EVERY video prompt with exactly: "Keep the bone character the exact same (with white body and clear skin), and no dialogue, no music. Don't make the bone character walk with its hips shaking. Keep the bone characters' eyes the same throughout."\n- Replace "skeleton" with "bone character" everywhere\n\nReturn ONLY a JSON array:\n[\n  {\n    "sceneNumber": 1,\n    "scriptText": "exact script text for this scene",\n    "imagePrompt": "full image prompt...",\n    "videoPrompt": "full video prompt..."\n  }\n]\n\nNo other text, just the JSON array.`;
    const response = await callClaude([{ role: 'user', content: prompt }], '', 8000);
    let scenes;
    try {
      const clean = response.replace(/```json|```/g, '').trim();
      scenes = JSON.parse(clean);
    } catch(e) {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) { try { scenes = JSON.parse(match[0]); } catch(e2) { throw new Error('Could not parse scenes JSON from Claude'); } }
      else throw new Error('Could not parse scenes from Claude response');
    }
    res.json({ success: true, scenes });
  } catch(err) {
    console.error('[pipeline/scenes] error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

app.post('/pipeline/generate-scene-image', upload.single('refImage'), async (req, res) => {
  const refImagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const { prompt, model = 'nano-banana-pro', sceneIndex } = req.body;
  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
    return res.json({ success: false, error: 'KIE_API_KEY not configured' });
  }
  try {
    const result = await enqueue(async () => {
      const body = { model, input: { prompt, aspect_ratio: '9:16', resolution: '1K', output_format: 'png' } };
      if (refImagePath && fs.existsSync(refImagePath)) {
        body.input.image_input = fs.readFileSync(refImagePath).toString('base64');
        body.input.image_mime_type = req.file.mimetype || 'image/jpeg';
      }
      const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', body, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
      if (!taskId) throw new Error('No taskId: ' + JSON.stringify(submitRes.data));
      const imageUrl = await kieAiPoll(taskId, KIE_API_KEY);
      const outputPath = path.resolve(`outputs/scene_img_${timestamp}.png`);
      const dlRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });
      fs.writeFileSync(outputPath, Buffer.from(dlRes.data));
      if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 3600000);
      return { success: true, imageUrl: `/outputs/scene_img_${timestamp}.png`, sceneIndex: parseInt(sceneIndex) };
    });
    res.json(result);
  } catch(err) {
    console.error('[pipeline/scene-image] error:', err.message);
    if (refImagePath) try { fs.unlinkSync(refImagePath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/pipeline/generate-scene-video', express.json(), async (req, res) => {
  const timestamp = Date.now();
  const { prompt, model = 'grok', quality = '480p', sceneIndex } = req.body;
  const KIE_KEY = process.env.KIE_API_KEY;
  const ML_KEY = process.env.MODELSLAB_API_KEY;
  try {
    const result = await enqueue(async () => {
      let videoUrl;
      if (model === 'grok') {
        if (!KIE_KEY) throw new Error('KIE_API_KEY not configured');
        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model: 'grok-imagine/text-to-video',
          input: { prompt: prompt || 'Cinematic motion', aspect_ratio: '9:16', duration: 6, resolution: quality },
        }, { headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 });
        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data).slice(0, 200));
        videoUrl = await kieAiPoll(taskId, KIE_KEY);
      } else if (model === 'veo3' || model === 'sora2') {
        if (!ML_KEY) throw new Error('MODELSLAB_API_KEY not configured');
        const modelIdMap = { 'veo3': 'veo-3.1-lite-t2v', 'sora2': 'sora-2' };
        const body = { key: ML_KEY, model_id: modelIdMap[model], prompt: prompt || 'Cinematic motion', aspect_ratio: model === 'sora2' ? '720x1280' : '9:16', duration: '6', enhance_prompt: true, negative_prompt: null, webhook: null, track_id: null };
        if (model === 'veo3') body.generate_audio = true;
        const submitRes = await axios.post('https://modelslab.com/api/v7/video-fusion/text-to-video', body, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
        const d = submitRes.data;
        if (d.status === 'success' && d.output?.[0]) videoUrl = d.output[0];
        else if (d.status === 'processing' && d.fetch_result) videoUrl = await modelsLabPoll(d.fetch_result, ML_KEY);
        else throw new Error('Unexpected ModelsLab response: ' + JSON.stringify(d).slice(0, 300));
      } else throw new Error('Unknown video model: ' + model);
      const outputPath = path.resolve(`outputs/scene_vid_${timestamp}.mp4`);
      const dlRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 300000 });
      fs.writeFileSync(outputPath, Buffer.from(dlRes.data));
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 3600000);
      return { success: true, videoUrl: `/outputs/scene_vid_${timestamp}.mp4`, sceneIndex: parseInt(sceneIndex) };
    });
    res.json(result);
  } catch(err) {
    console.error('[pipeline/scene-video] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI VIDEO GEN
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-video', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const { model = 'veo3-lite', prompt = '', duration = '8', aspectRatio = '9:16', quality = '720p' } = req.body;
  const ML_KEY = process.env.MODELSLAB_API_KEY;
  const KIE_KEY = process.env.KIE_API_KEY;
  try {
    const result = await enqueue(async () => {
      let videoUrl;
      if (model === 'grok') {
        if (!KIE_KEY) throw new Error('KIE_API_KEY not configured in .env');
        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model: 'grok-imagine/text-to-video',
          input: { prompt: prompt || 'Cinematic motion', aspect_ratio: aspectRatio, duration: parseInt(duration), resolution: quality },
        }, { headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 });
        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data).slice(0, 200));
        videoUrl = await kieAiPoll(taskId, KIE_KEY);
      } else {
        if (!ML_KEY) throw new Error('MODELSLAB_API_KEY not configured in .env');
        const modelIdMap = { 'veo3-lite': 'veo-3.1-lite-t2v', 'veo3lite': 'veo-3.1-lite-t2v', 'sora2': 'sora-2' };
        const modelId = modelIdMap[model] || 'veo-3.1-lite-t2v';
        const soraAspectMap = { '9:16': '720x1280', '16:9': '1280x720' };
        const soraAspect = model === 'sora2' ? (soraAspectMap[aspectRatio] || '720x1280') : aspectRatio;
        const body = { key: ML_KEY, model_id: modelId, prompt: prompt || 'Cinematic motion', aspect_ratio: soraAspect, duration: String(parseInt(duration)), enhance_prompt: true, negative_prompt: null, webhook: null, track_id: null };
        if (model === 'veo3-lite' || model === 'veo3lite') body.generate_audio = true;
        if (imagePath && fs.existsSync(imagePath) && (model === 'veo3-lite' || model === 'veo3lite')) {
          body.init_image = `data:${req.file.mimetype || 'image/jpeg'};base64,${fs.readFileSync(imagePath).toString('base64')}`;
        }
        const submitRes = await axios.post('https://modelslab.com/api/v7/video-fusion/text-to-video', body, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
        const d = submitRes.data;
        if (d.status === 'success' && d.output?.[0]) videoUrl = d.output[0];
        else if (d.status === 'processing' && d.fetch_result) videoUrl = await modelsLabPoll(d.fetch_result, ML_KEY);
        else throw new Error('Unexpected ModelsLab response: ' + JSON.stringify(d).slice(0, 300));
      }
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
// AI IMAGE GEN
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
  const RESOLUTION_MAP = { 'Basic': '1K', 'Standard': '2K', 'High': '4K', '1K': '1K', '2K': '2K', '4K': '4K' };
  const kieResolution = RESOLUTION_MAP[resolution] || '1K';
  try {
    const result = await enqueue(async () => {
      const body = { model, input: { prompt, aspect_ratio: aspectRatio, resolution: kieResolution, output_format: 'png' } };
      if (refImagePath && fs.existsSync(refImagePath)) {
        body.input.image_input = fs.readFileSync(refImagePath).toString('base64');
        body.input.image_mime_type = req.file.mimetype || 'image/jpeg';
      }
      const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', body, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
      if (!taskId) throw new Error('No taskId: ' + JSON.stringify(submitRes.data));
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
// VOICE GEN
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-voice', upload.single('voiceSample'), async (req, res) => {
  const voiceSamplePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();
  const { text = '', voiceId, model: kieModel = 'elevenlabs/text-to-speech-turbo-2-5', speed = '1.0', stability = '0.5', similarity = '0.75', exaggeration = '0.5', cfgWeight = '0.5', temperature = '0.8' } = req.body;
  if (!text.trim()) {
    if (voiceSamplePath) try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
    return res.json({ success: false, error: 'No text provided' });
  }
  const isCloneMode = !!voiceSamplePath;
  try {
    const result = await enqueue(async () => {
      if (isCloneMode) {
        const CHATTERBOX_URL = process.env.CHATTERBOX_MODAL_URL;
        if (!CHATTERBOX_URL) throw new Error('CHATTERBOX_MODAL_URL not set');
        const audioB64 = fs.readFileSync(voiceSamplePath).toString('base64');
        const response = await axios.post(CHATTERBOX_URL, {
          text: text.trim(), exaggeration: parseFloat(exaggeration), cfg_weight: parseFloat(cfgWeight), temperature: parseFloat(temperature), audio_prompt_b64: audioB64,
        }, { headers: { 'Content-Type': 'application/json' }, timeout: 600000 });
        if (!response.data.audio_b64) throw new Error('Chatterbox returned no audio.');
        const outputPath = path.resolve(`outputs/voice_${timestamp}.wav`);
        fs.writeFileSync(outputPath, Buffer.from(response.data.audio_b64, 'base64'));
        try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
        setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
        return { success: true, audioUrl: `/outputs/voice_${timestamp}.wav` };
      } else {
        const KIE_API_KEY = process.env.KIE_API_KEY;
        if (!KIE_API_KEY) throw new Error('KIE_API_KEY not set in .env');
        if (!voiceId) throw new Error('No voiceId provided');
        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model: kieModel,
          input: { text: text.trim(), voice: voiceId, stability: parseFloat(stability), similarity_boost: parseFloat(similarity), speed: parseFloat(speed), style: 0 },
        }, { headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 });
        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data));
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
// DEAD SPACE REMOVER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/remove-deadspace', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No video uploaded' });
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { dbThreshold = '-35', minDuration = '0.4', padding = '0.1' } = req.body;
  try {
    const result = await enqueue(async () => {
      const outputPath = path.resolve(`outputs/trimmed_${timestamp}.mp4`);

      const { stderr } = runFFmpegGetStderr([
        '-y', '-i', videoPath,
        '-af', `silencedetect=noise=${dbThreshold}dB:d=${minDuration}`,
        '-f', 'null', '-'
      ], 120000);

      const silences = [];
      const startMatches = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)];
      const endMatches   = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)];
      for (let i = 0; i < startMatches.length; i++) {
        const start = parseFloat(startMatches[i][1]);
        const end   = endMatches[i] ? parseFloat(endMatches[i][1]) : null;
        if (end !== null) silences.push({ start, end });
      }

      const { stderr: probeStderr } = runFFmpegGetStderr(['-i', videoPath, '-f', 'null', '-'], 30000);
      const durMatch = probeStderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      const totalDuration = durMatch
        ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
        : null;
      const hasAudio = probeStderr.includes('Audio:');

      if (silences.length === 0) {
        const noSilArgs = ['-y', '-i', videoPath, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22'];
        if (hasAudio) noSilArgs.push('-c:a', 'aac');
        noSilArgs.push(outputPath);
        runFFmpeg(noSilArgs, 300000);
        try { fs.unlinkSync(videoPath); } catch(e) {}
        setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
        return { success: true, videoUrl: `/outputs/trimmed_${timestamp}.mp4`, silencesRemoved: 0 };
      }

      // Cut at midpoint of each silence — keep 80ms buffer each side so speech is never clipped
      const keepSil = 0.08;
      const keepSegments = [];
      let cursor = 0;
      for (const { start, end } of silences) {
        const silDuration = end - start;
        if (silDuration < parseFloat(minDuration)) continue;
        const cutEnd = start + keepSil;
        const cutStart = end - keepSil;
        if (cutEnd > cursor + 0.05) keepSegments.push({ start: cursor, end: cutEnd });
        cursor = Math.max(cursor, cutStart);
      }
      if (!totalDuration || cursor < totalDuration - 0.05) {
        keepSegments.push({ start: cursor, end: totalDuration || 999999 });
      }
      if (keepSegments.length === 0) {
        try { fs.unlinkSync(videoPath); } catch(e) {}
        throw new Error('Nothing to trim — try a lower dB threshold');
      }

      const segmentFiles = [];
      for (let i = 0; i < keepSegments.length; i++) {
        const seg = keepSegments[i];
        const segPath = path.resolve(`outputs/seg_${timestamp}_${i}.mp4`);
        const args = ['-y', '-i', videoPath, '-ss', seg.start.toFixed(3), '-to', seg.end.toFixed(3), '-c:v', 'libx264', '-preset', 'fast', '-crf', '22'];
        if (hasAudio) args.push('-c:a', 'aac');
        args.push(segPath);
        runFFmpeg(args, 120000);
        segmentFiles.push(segPath);
      }

      const concatList = path.resolve(`outputs/concat_${timestamp}.txt`);
      fs.writeFileSync(concatList, segmentFiles.map(f => `file '${f}'`).join('\n'));
      runFFmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', outputPath], 300000);

      for (const f of segmentFiles) try { fs.unlinkSync(f); } catch(e) {}
      try { fs.unlinkSync(concatList); } catch(e) {}
      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
      return { success: true, videoUrl: `/outputs/trimmed_${timestamp}.mp4`, silencesRemoved: silences.length, segmentsKept: keepSegments.length };
    });
    res.json(result);
  } catch(err) {
    console.error('[remove-deadspace] error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// YT SCRAPER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/scrape-channel', express.json(), async (req, res) => {
  const { channelUrl, count = 25, sort = 'newest' } = req.body;
  if (!channelUrl) return res.json({ success: false, error: 'No channel URL provided' });
  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY) return res.json({ success: false, error: 'YOUTUBE_API_KEY not set' });
  try {
    const handle = channelUrl.replace(/\/$/, '').split('/').pop().replace('@', '');
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: handle, type: 'channel', maxResults: 1, key: YT_KEY }, timeout: 10000,
    });
    const channelId = searchRes.data.items?.[0]?.id?.channelId;
    if (!channelId) throw new Error('Could not find channel: ' + handle);
    const chanRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'contentDetails', id: channelId, key: YT_KEY }, timeout: 10000,
    });
    const uploadsPlaylistId = chanRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error('Could not get uploads playlist');
    const fetchCount = Math.min(parseInt(count) * (sort === 'newest' ? 1 : 4), 200);
    let videoIds = [];
    let pageToken = '';
    while (videoIds.length < fetchCount) {
      const plRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: 50, pageToken, key: YT_KEY }, timeout: 10000,
      });
      videoIds.push(...plRes.data.items.map(i => i.contentDetails.videoId));
      if (!plRes.data.nextPageToken || videoIds.length >= fetchCount) break;
      pageToken = plRes.data.nextPageToken;
    }
    videoIds = videoIds.slice(0, fetchCount);
    let videos = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const vRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,statistics,contentDetails', id: batch.join(','), key: YT_KEY }, timeout: 15000,
      });
      for (const item of vRes.data.items) {
        const dur = item.contentDetails.duration || '';
        const mMatch = dur.match(/(\d+)M/); const sMatch = dur.match(/(\d+)S/); const hMatch = dur.match(/(\d+)H/);
        const durSec = (hMatch ? parseInt(hMatch[1]) * 3600 : 0) + (mMatch ? parseInt(mMatch[1]) * 60 : 0) + (sMatch ? parseInt(sMatch[1]) : 0);
        if (durSec > 180) continue;
        const mins = Math.floor(durSec / 60); const secs = durSec % 60;
        videos.push({
          video_id: item.id, url: `https://www.youtube.com/watch?v=${item.id}`, title: item.snippet.title,
          channel: item.snippet.channelTitle, channel_id: item.snippet.channelId, channel_url: channelUrl,
          view_count: parseInt(item.statistics.viewCount || 0), like_count: parseInt(item.statistics.likeCount || 0),
          comment_count: parseInt(item.statistics.commentCount || 0), duration_seconds: durSec,
          duration_human: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`, publish_date: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
          description: item.snippet.description || '', tags: (item.snippet.tags || []).join(', '), transcript: '',
        });
      }
    }
    if (sort === 'popular') videos.sort((a, b) => b.view_count - a.view_count);
    else if (sort === 'trending') {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      videos = videos.filter(v => new Date(v.publish_date).getTime() > cutoff);
      videos.sort((a, b) => b.view_count - a.view_count);
    }
    videos = videos.slice(0, parseInt(count));
    res.json({ success: true, videos });
  } catch(err) {
    console.error('[scraper] error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n✅ Viralmax running at http://localhost:' + PORT);
  console.log('   Routes: / (home)  /app (tools)  /login  /signup  /legal  /checkout');
  console.log('   MODELSLAB_API_KEY :', process.env.MODELSLAB_API_KEY   ? '✓' : '✗');
  console.log('   KIE_API_KEY       :', process.env.KIE_API_KEY         ? '✓' : '✗');
  console.log('   CHATTERBOX_URL    :', process.env.CHATTERBOX_MODAL_URL ? '✓' : '✗');
  console.log('   YOUTUBE_API_KEY   :', process.env.YOUTUBE_API_KEY     ? '✓' : '✗');
  console.log('   ANTHROPIC_API_KEY :', process.env.ANTHROPIC_API_KEY   ? '✓' : '✗');
});

process.on('uncaughtException', err => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught exception:', err.message);
});