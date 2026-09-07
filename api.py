import base64
import os
import sys
import cv2
import numpy as np
import rasterio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path so src imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.pipeline.match import LoFTRMatcher
from src.pipeline.warp import align_images
from src.pipeline.validate import compute_metrics, create_checkerboard
from src.pipeline.viz import draw_match_visualization

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global matcher instance
matcher = None

@app.on_event("startup")
async def startup_event():
    global matcher
    # Initialize LoFTR matcher ONCE at startup
    matcher = LoFTRMatcher()

class PipelineRequest(BaseModel):
    ohrc_path: str = ""
    tmc_path: str = ""

def encode_image(img_arr: np.ndarray, ext: str = ".png") -> str:
    """Helper to convert numpy array to base64 data URI"""
    success, encoded = cv2.imencode(ext, img_arr)
    if not success:
        return ""
    b64 = base64.b64encode(encoded.tobytes()).decode("utf-8")
    mime = "image/png" if ext == ".png" else "image/jpeg"
    return f"data:{mime};base64,{b64}"

def pad_to_multiple_of_8(image: np.ndarray):
    """Pad image dimensions to multiples of 8 (required for LoFTR)"""
    h, w = image.shape[:2]
    new_h = (h + 7) // 8 * 8
    new_w = (w + 7) // 8 * 8
    
    pad_h = new_h - h
    pad_w = new_w - w
    
    if pad_h == 0 and pad_w == 0:
        return image, (0, 0)
        
    padded = np.pad(image, ((0, pad_h), (0, pad_w)), mode='constant')
    return padded, (pad_h, pad_w)

@app.get("/")
def root():
    return {
        "message": "AutoAlign-C2 Backend is Running!",
        "endpoints": ["/api/health", "/api/run-pipeline"]
    }

@app.get("/api/health")
def health():
    import torch
    device = "CUDA" if torch.cuda.is_available() else "CPU"
    return {
        "status": "ok",
        "device": device,
        "model_loaded": matcher is not None
    }

@app.post("/api/run-pipeline")
def run_pipeline(req: PipelineRequest):
    # Use provided paths or defaults
    ohrc_path = req.ohrc_path or "/home/yash/Documents/projects/AutoAlign-C2/output_analysis_ready/OHRC_matched.tif"
    tmc_path = req.tmc_path or "/home/yash/Documents/projects/AutoAlign-C2/output_analysis_ready/TMC_reflectance.tif"
    
    try:
        # Load images using rasterio (handles GeoTIFF properly)
        with rasterio.open(ohrc_path) as src:
            img1 = src.read(1)
        with rasterio.open(tmc_path) as src:
            img2 = src.read(1)

        if img1 is None or img1.size == 0:
            return {"success": False, "error": f"Failed to load OHRC image at {ohrc_path}"}
        if img2 is None or img2.size == 0:
            return {"success": False, "error": f"Failed to load TMC image at {tmc_path}"}

        # Normalize to uint8 for visualization
        def to_uint8(img):
            norm = cv2.normalize(img.astype(np.float64), None, 0, 255, cv2.NORM_MINMAX)
            return norm.astype(np.uint8)

        img1_viz = to_uint8(img1)
        img2_viz = to_uint8(img2)

        # Generate previews before padding
        ohrc_preview = encode_image(img1_viz, ".png")
        tmc_preview = encode_image(img2_viz, ".png")
        
        # Pad images to multiples of 8
        img1_pad, _ = pad_to_multiple_of_8(img1)
        img2_pad, _ = pad_to_multiple_of_8(img2)
        
        # 1. Match
        match_result = matcher.match_pair(img1_pad, img2_pad)
        src_pts = match_result["keypoints_src"]
        dst_pts = match_result["keypoints_dst"]
        conf = match_result["confidence"]
        
        if len(src_pts) < 4:
            return {"success": False, "error": "Not enough matches found to compute homography."}
            
        # 2. Warp
        warp_result = align_images(img1_pad, src_pts, dst_pts)
        if not warp_result["success"]:
            return {"success": False, "error": "Homography estimation or image warping failed."}
            
        homography = warp_result["homography"]
        inlier_mask = warp_result["inlier_mask"]
        warped_img = warp_result["warped_image"]
        
        # 3. Validate
        metrics = compute_metrics(src_pts, dst_pts, homography, inlier_mask)
        metrics["total_raw"] = match_result.get("total_raw", len(src_pts))
        metrics["total_filtered"] = match_result.get("total_filtered", len(src_pts))
        
        # 4. Generate Visualizations (need uint8 for OpenCV drawing)
        img1_pad_viz = to_uint8(img1_pad)
        img2_pad_viz = to_uint8(img2_pad)
        warped_viz = to_uint8(warped_img)

        checkerboard = create_checkerboard(img2_pad_viz, warped_viz)
        match_viz = draw_match_visualization(img1_pad_viz, img2_pad_viz, src_pts, dst_pts)
        
        # Overlay: resize warped to match target dimensions, then blend
        h2, w2 = img2_pad_viz.shape[:2]
        warped_resized = cv2.resize(warped_viz, (w2, h2))
        overlay = cv2.addWeighted(img2_pad_viz, 0.5, warped_resized, 0.5, 0)
        
        return {
            "success": True,
            "metrics": metrics,
            "homography": homography.tolist(),
            "images": {
                "ohrc_preview": ohrc_preview,
                "tmc_preview": tmc_preview,
                "match_visualization": encode_image(match_viz, ".jpg"),
                "warped_overlay": encode_image(overlay, ".jpg"),
                "checkerboard": encode_image(checkerboard, ".jpg")
            },
            "keypoints": {
                "src": src_pts.tolist(),
                "dst": dst_pts.tolist(),
                "confidence": conf.tolist()
            }
        }
        
    except Exception as e:
        # Graceful error handling for the frontend
        return {"success": False, "error": str(e)}
