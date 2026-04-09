import sys
import os
import subprocess
import tempfile
import json

def transcribe(video_id):
    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, 'audio.mp3')
        
        # Download audio only
        cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')
        cmd = [
            'yt-dlp',
            '-f', 'bestaudio/best',
            '-x', '--audio-format', 'mp3',
            '--audio-quality', '5',
            '--no-playlist',
            '--extractor-args', 'youtube:skip=dash,hls',
            '-o', audio_path,
        ]
        if os.path.exists(cookies_path):
            cmd += ['--cookies', cookies_path]
        cmd.append(f'https://www.youtube.com/watch?v={video_id}')
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            print(json.dumps({'error': 'yt-dlp failed: ' + result.stderr[-200:]}))
            return
        
        if not os.path.exists(audio_path):
            # yt-dlp sometimes adds extension
            candidates = [f for f in os.listdir(tmpdir) if f.startswith('audio')]
            if not candidates:
                print(json.dumps({'error': 'no audio file found'}))
                return
            audio_path = os.path.join(tmpdir, candidates[0])
        
        # Transcribe with faster-whisper
        from faster_whisper import WhisperModel
        model = WhisperModel('tiny', device='cpu', compute_type='int8')
        segments, _ = model.transcribe(audio_path, language='en')
        transcript = ' '.join(seg.text.strip() for seg in segments)
        print(json.dumps({'transcript': transcript}))

if __name__ == '__main__':
    video_id = sys.argv[1]
    transcribe(video_id)
