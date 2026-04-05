
import re

with open('server.js', 'r') as f:
    content = f.read()

old = """app.post('/remove-deadspace', upload.single('video'), async (req, res) => {
  const videoPath = path.resolve(req.file.path);
  const timestamp = Date.now();
  const { intensity = 'medium' } = req.body;
  const intensityMap = { light: '-50', medium: '-40', aggressive: '-30' };
  const db = intensityMap[intensity] || '-40';
  try {
    const result = await enqueue(async () => {
      const outputPath = path.resolve(`outputs/trimmed_${timestamp}.mp4`);
      // Use afade for smooth cuts, silenceremove on audio stream only, copy video
      runFFmpeg([
        '-y', '-i', videoPath,
        '-af', `silenceremove=start_periods=1:start_duration=0.1:start_threshold=${db}dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=0.1:start_threshold=${db}dB:detection=peak,aformat=dblp,areverse`,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
        '-c:a', 'aac',
        outputPath
      ], 300000);
      try { fs.unlinkSync(videoPath); } catch(e) {}
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e) {} }, 600000);
      return { success: true, videoUrl: `/outputs/trimmed_${timestamp}.mp4` };
    });
    res.json(result);
  } catch(err) {
    console.error('[deadspace] error:', err.message);
    try { fs.unlinkSync(videoPath); } catch(e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});"""

print('old found:', old in content)
