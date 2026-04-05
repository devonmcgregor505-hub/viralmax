import modal
import io
import base64
import tempfile
import os
import subprocess

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "wget", "libgl1", "libglib2.0-0")
    .pip_install(
        "basicsr",
        "realesrgan",
        "opencv-python-headless",
        "numpy",
        "torch",
        "torchvision",
        "Pillow",
    )
)

app = modal.App("dubshorts-upscaler", image=image)

@app.cls(gpu="T4", scaledown_window=3600)
class UpscalerWorker:
    @modal.enter()
    def load_model(self):
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        import torch

        print("[upscaler] Downloading Real-ESRGAN model...")
        model_path = "/root/RealESRGAN_x4plus.pth"
        if not os.path.exists(model_path):
            subprocess.run([
                "wget", "-q", "-O", model_path,
                "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
            ], check=True)

        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                        num_block=23, num_grow_ch=32, scale=4)
        self.upsampler = RealESRGANer(
            scale=4,
            model_path=model_path,
            model=model,
            tile=256,
            tile_pad=10,
            pre_pad=0,
            half=True,
            device=torch.device("cuda"),
        )
        print("[upscaler] Model loaded.")

    @modal.method()
    def upscale(self, video_b64: str, target_res: str = "1080") -> str:
        import cv2
        import numpy as np
        import torch

        # Decode video
        video_bytes = base64.b64decode(video_b64)
        tmp_in = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp_in.write(video_bytes)
        tmp_in.close()

        tmp_out = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp_out.close()

        frames_dir = tempfile.mkdtemp()
        upscaled_dir = tempfile.mkdtemp()

        try:
            # Extract frames
            subprocess.run([
                "ffmpeg", "-y", "-i", tmp_in.name,
                "-q:v", "2", f"{frames_dir}/%06d.jpg"
            ], check=True, capture_output=True)

            # Get fps
            result = subprocess.run([
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=r_frame_rate",
                "-of", "default=noprint_wrappers=1:nokey=1", tmp_in.name
            ], capture_output=True, text=True)
            fps_str = result.stdout.strip()
            fps = eval(fps_str) if fps_str else 30

            # Upscale frames
            frame_files = sorted(os.listdir(frames_dir))
            print(f"[upscaler] Upscaling {len(frame_files)} frames...")
            for fname in frame_files:
                img = cv2.imread(os.path.join(frames_dir, fname), cv2.IMREAD_COLOR)
                output, _ = self.upsampler.enhance(img, outscale=4)
                # Resize to target resolution
                res_map = {"1080": 1080, "2k": 1440, "4k": 2160}
                target_h = res_map.get(target_res, 1080)
                h, w = output.shape[:2]
                if h > target_h:
                    scale = target_h / h
                    output = cv2.resize(output, (int(w*scale), target_h), interpolation=cv2.INTER_LANCZOS4)
                cv2.imwrite(os.path.join(upscaled_dir, fname), output)

            # Stitch frames + copy audio
            subprocess.run([
                "ffmpeg", "-y",
                "-framerate", str(fps),
                "-i", f"{upscaled_dir}/%06d.jpg",
                "-i", tmp_in.name,
                "-map", "0:v", "-map", "1:a?",
                "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                "-c:a", "aac", "-shortest",
                tmp_out.name
            ], check=True, capture_output=True)

            with open(tmp_out.name, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")

        finally:
            for d in [frames_dir, upscaled_dir]:
                for f in os.listdir(d):
                    os.unlink(os.path.join(d, f))
                os.rmdir(d)
            os.unlink(tmp_in.name)
            os.unlink(tmp_out.name)


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def upscale_video(request: dict) -> dict:
    video_b64 = request.get("video_b64", "")
    target_res = request.get("target_res", "1080")
    if not video_b64:
        return {"success": False, "error": "No video provided"}
    try:
        result_b64 = UpscalerWorker().upscale.remote(
            video_b64=video_b64,
            target_res=target_res,
        )
        return {"success": True, "video_b64": result_b64}
    except Exception as e:
        return {"success": False, "error": str(e)}