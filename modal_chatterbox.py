import modal
import io
import base64
import tempfile
import os
import re
import concurrent.futures

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "chatterbox-tts",
        "torchaudio",
        "soundfile",
        "numpy==1.26.4",
    )
)

app = modal.App("dubshorts-chatterbox", image=image)


def split_into_chunks(text: str, max_chars: int = 1200) -> list:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks = []
    current = ''
    for sentence in sentences:
        if len(sentence) > max_chars:
            sub = re.split(r'(?<=[,;:])\s+', sentence)
            for s in sub:
                if len(current) + len(s) + 1 <= max_chars:
                    current = (current + ' ' + s).strip()
                else:
                    if current:
                        chunks.append(current)
                    current = s
        elif len(current) + len(sentence) + 1 <= max_chars:
            current = (current + ' ' + sentence).strip()
        else:
            if current:
                chunks.append(current)
            current = sentence
    if current:
        chunks.append(current)
    return [c for c in chunks if c.strip()]


@app.cls(gpu="T4", scaledown_window=3600)
class ChatterboxWorker:
    @modal.enter()
    def load_model(self):
        from chatterbox.tts import ChatterboxTTS
        print("[chatterbox] Loading model...")
        self.model = ChatterboxTTS.from_pretrained(device="cuda")
        print("[chatterbox] Model loaded.")

    @modal.method()
    def generate(
        self,
        text: str,
        audio_prompt_b64: str = None,
        exaggeration: float = 0.5,
        cfg_weight: float = 0.5,
        temperature: float = 0.8,
    ) -> str:
        import torchaudio as ta
        import torch
        import subprocess

        audio_prompt_path = None
        if audio_prompt_b64:
            audio_bytes = base64.b64decode(audio_prompt_b64)
            raw_tmp = tempfile.NamedTemporaryFile(suffix=".audio", delete=False)
            raw_tmp.write(audio_bytes)
            raw_tmp.close()
            wav_path = raw_tmp.name + ".wav"
            try:
                subprocess.run(
                    ["ffmpeg", "-y", "-i", raw_tmp.name,
                     "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav_path],
                    check=True, capture_output=True,
                )
                audio_prompt_path = wav_path
            except subprocess.CalledProcessError as e:
                raise RuntimeError("Failed to convert audio: " + e.stderr.decode()[:200])
            finally:
                os.unlink(raw_tmp.name)

        try:
            chunks = split_into_chunks(text, max_chars=1200)
            print(f"[chatterbox] {len(chunks)} chunk(s) for {len(text)} chars — running in parallel")

            sr = self.model.sr

            def gen_chunk(chunk):
                return self.model.generate(
                    chunk,
                    audio_prompt_path=audio_prompt_path,
                    exaggeration=exaggeration,
                    cfg_weight=cfg_weight,
                    temperature=temperature,
                )

            with concurrent.futures.ThreadPoolExecutor() as executor:
                all_wavs = list(executor.map(gen_chunk, chunks))

            if len(all_wavs) == 1:
                final_wav = all_wavs[0]
            else:
                silence_samples = int(sr * 0.3)
                silence = torch.zeros(1, silence_samples)
                parts = []
                for i, w in enumerate(all_wavs):
                    parts.append(w)
                    if i < len(all_wavs) - 1:
                        parts.append(silence)
                final_wav = torch.cat(parts, dim=1)

            buf = io.BytesIO()
            ta.save(buf, final_wav, sr, format="wav")
            buf.seek(0)
            return base64.b64encode(buf.read()).decode("utf-8")

        finally:
            if audio_prompt_path and os.path.exists(audio_prompt_path):
                os.unlink(audio_prompt_path)


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def generate_voice(request: dict) -> dict:
    text = request.get("text", "").strip()
    if not text:
        return {"success": False, "error": "No text provided"}

    try:
        audio_b64 = ChatterboxWorker().generate.remote(
            text=text,
            audio_prompt_b64=request.get("audio_prompt_b64"),
            exaggeration=float(request.get("exaggeration", 0.5)),
            cfg_weight=float(request.get("cfg_weight", 0.5)),
            temperature=float(request.get("temperature", 0.8)),
        )
        return {"success": True, "audio_b64": audio_b64}

    except Exception as e:
        return {"success": False, "error": str(e)}