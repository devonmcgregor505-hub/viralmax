// ══════════════════════════════════════════════════════════════════════════════
// VOICE GEN — POST /generate-voice
// Handles both modes:
//   - Preset (Kie.ai ElevenLabs): form fields only, no file
//   - Clone (Chatterbox on Modal): includes voiceSample file
// ══════════════════════════════════════════════════════════════════════════════
app.post('/generate-voice', upload.single('voiceSample'), async (req, res) => {
  const voiceSamplePath = req.file ? path.resolve(req.file.path) : null;
  const timestamp = Date.now();

  const {
    text = '',
    // Preset mode fields
    voiceId,
    model = 'elevenlabs/text-to-speech-turbo-2-5',
    speed = '1.0',
    stability = '0.5',
    similarity = '0.75',
    // Clone mode fields
    exaggeration = '0.5',
    cfgWeight = '0.5',
    temperature = '0.8',
  } = req.body;

  if (!text.trim()) {
    if (voiceSamplePath) try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
    return res.json({ success: false, error: 'No text provided' });
  }

  // ── Determine mode ──
  const isCloneMode = !!voiceSamplePath;

  try {
    const result = await enqueue(async () => {

      if (isCloneMode) {
        // ══ CLONE MODE — Chatterbox on Modal ══
        const CHATTERBOX_URL = process.env.CHATTERBOX_MODAL_URL;
        if (!CHATTERBOX_URL) throw new Error('CHATTERBOX_MODAL_URL not set in .env — deploy modal_chatterbox.py first');

        console.log(`[generate-voice] CLONE mode chars=${text.length}`);

        const body = {
          text: text.trim(),
          exaggeration: parseFloat(exaggeration),
          cfg_weight: parseFloat(cfgWeight),
          temperature: parseFloat(temperature),
          audio_prompt_b64: fs.readFileSync(voiceSamplePath).toString('base64'),
        };

        const response = await axios.post(CHATTERBOX_URL, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000,
        });

        const data = response.data;
        if (!data.success) throw new Error(data.error || 'Chatterbox generation failed');

        const audioBuffer = Buffer.from(data.audio_b64, 'base64');
        const outputPath = path.resolve(`outputs/voice_${timestamp}.wav`);
        fs.writeFileSync(outputPath, audioBuffer);

        if (voiceSamplePath) try { fs.unlinkSync(voiceSamplePath); } catch(e) {}
        setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);

        return { success: true, audioUrl: `/outputs/voice_${timestamp}.wav` };

      } else {
        // ══ PRESET MODE — Kie.ai ElevenLabs ══
        const KIE_API_KEY = process.env.KIE_API_KEY;
        if (!KIE_API_KEY) throw new Error('KIE_API_KEY not set in .env');
        if (!voiceId) throw new Error('No voiceId provided for preset mode');

        console.log(`[generate-voice] PRESET mode model=${model} voiceId=${voiceId} chars=${text.length}`);

        // Submit task to Kie.ai
        const submitRes = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
          model,
          input: {
            text: text.trim(),
            voice: voiceId,
            stability: parseFloat(stability),
            similarity_boost: parseFloat(similarity),
            speed: parseFloat(speed),
            style: 0,
          },
        }, {
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        const taskId = submitRes.data?.data?.taskId || submitRes.data?.data?.task_id;
        if (!taskId) throw new Error('No taskId from Kie.ai: ' + JSON.stringify(submitRes.data));
        console.log(`[generate-voice] Kie taskId=${taskId}`);

        // Poll for result
        let audioUrl = null;
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const pollRes = await axios.get('https://api.kie.ai/api/v1/jobs/recordInfo', {
            params: { taskId },
            headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
            timeout: 15000,
          });

          const taskData = pollRes.data?.data || pollRes.data;
          const state = taskData?.state;
          console.log(`[generate-voice] poll ${i+1} state=${state}`);

          if (state === 'success') {
            try {
              const resultJson = JSON.parse(taskData.resultJson);
              audioUrl = resultJson?.resultUrls?.[0] || resultJson?.result_urls?.[0];
            } catch(e) {
              audioUrl = taskData?.audio_url || taskData?.output?.audio_url;
            }
            break;
          }
          if (state === 'failed' || state === 'error' || state === 'fail') {
            throw new Error('Kie.ai voice generation failed');
          }
        }

        if (!audioUrl) throw new Error('Voice generation timed out');

        // Download and save
        const dlRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const outputPath = path.resolve(`outputs/voice_${timestamp}.mp3`);
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
