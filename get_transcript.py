import sys
import os
import tempfile
import subprocess

def get_transcript(video_id):
    # First try YouTube captions (fast, free)
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        t = api.fetch(video_id)
        text = ' '.join([x.text for x in t])
        if text.strip():
            return text.strip()
    except Exception:
        pass

    # Fallback: download audio and transcribe with faster-whisper
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            audio_path = os.path.join(tmpdir, 'audio.mp3')
            # Download audio only (fast, small)
            result = subprocess.run([
                'yt-dlp',
                f'https://www.youtube.com/watch?v={video_id}',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '5',
                '--no-playlist',
                '--quiet',
                '-o', audio_path,
            ], capture_output=True, timeout=60)

            if not os.path.exists(audio_path):
                return ''

            # Transcribe with faster-whisper
            from faster_whisper import WhisperModel
            model = WhisperModel('tiny', device='cpu', compute_type='int8')
            segments, _ = model.transcribe(audio_path, beam_size=1, language='en')
            return ' '.join([s.text for s in segments]).strip()
    except Exception as e:
        return ''

if __name__ == '__main__':
    if len(sys.argv) > 1:
        print(get_transcript(sys.argv[1]))
