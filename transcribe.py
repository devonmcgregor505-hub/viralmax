import sys
import os
import subprocess
import tempfile
import json

def transcribe(video_id):
    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, 'audio.mp3')
        cookies_path = '/app/cookies.txt'
        cookies_exist = os.path.exists(cookies_path)
        
        cmd = [
            'yt-dlp',
            '-f', 'bestaudio/best',
            '-x', '--audio-format', 'mp3',
            '--audio-quality', '5',
            '--no-playlist',
            '--extractor-args', 'youtube:skip=dash,hls',
            '-o', audio_path,
        ]
        if cookies_exist:
            cmd += ['--cookies', cookies_path]
        cmd.append(f'https://www.youtube.com/watch?v={video_id}')
        
        print(json.dumps({'debug': f'cookies={cookies_exist} cmd={" ".join(cmd[:6])}'}))
        sys.stdout.flush()
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            print(json.dumps({'error': 'yt-dlp failed: ' + result.stderr[-300:]}))
            return
        
        if not os.path.exists(audio_path):
            candidates = [f for f in os.listdir(tmpdir) if f.startswith('audio')]
            if not candidates:
                print(json.dumps({'error': 'no audio file found'}))
                return
            audio_path = os.path.join(tmpdir, candidates[0])
        
        from faster_whisper import WhisperModel
        model = WhisperModel('tiny', device='cpu', compute_type='int8')
        segments, _ = model.transcribe(audio_path, language='en')
        transcript = ' '.join(seg.text.strip() for seg in segments)
        print(json.dumps({'transcript': transcript}))

if __name__ == '__main__':
    video_id = sys.argv[1]
    transcribe(video_id)
