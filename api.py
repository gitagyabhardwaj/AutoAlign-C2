import base64
import os
import sys
import cv2
import numpy as np
import rasterio
import zipfile
import tempfile
import glob
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil

# Import pipeline modules
from src.pipeline.match import LoFTRMatcher
from src.pipeline.warp import align_images
from src.pipeline.validate import compute_metrics, create_checkerboard
from src.pipeline.viz import draw_match_visualization
from pipeline import PlanetaryImagePipeline

app = FastAPI(title="AutoAlign-C2 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global LoFTR instance (loaded once on startup)
matcher = None

@app.on_event("startup")
def load_model():
    global matcher
    print("[ML Engine] Initializing LoFTRMatcher on CUDA...")
    matcher = LoFTRMatcher()

def encode_image(img_array: np.ndarray, ext: str = ".jpg") -> str:
    """Encode numpy array to base64 data URI."""
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
    _, buffer = cv2.imencode(ext, img_array)
    encoded = base64.b64encode(buffer).decode("utf-8")
    mime = "image/png" if ext.lower() == ".png" else "image/jpeg"
    return f"data:{mime};base64,{encoded}"

def pad_to_multiple_of_8(image):
    """LoFTR requires image dimensions to be multiples of 8."""
    h, w = image.shape[:2]
    pad_h = (8 - (h % 8)) % 8
    pad_w = (8 - (w % 8)) % 8
    if pad_h == 0 and pad_w == 0:
        return image, (0, 0)
    padded = np.pad(image, ((0, pad_h), (0, pad_w)), mode='constant')
    return padded, (pad_h, pad_w)

def to_uint8(img):
    """Normalize float/uint16 to uint8 for visualization."""
    norm = cv2.normalize(img.astype(np.float64), None, 0, 255, cv2.NORM_MINMAX)
    return norm.astype(np.uint8)

def extract_and_load(zip_file: UploadFile, temp_dir: str, prefix: str):
    """Extracts a PRADAN zip, finds the .img file, and returns the numpy array."""
    zip_path = os.path.join(temp_dir, f"{prefix}.zip")
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(zip_file.file, f)
        
    extract_dir = os.path.join(temp_dir, prefix)
    os.makedirs(extract_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    # Find .img file (or .tif if it's already processed)
    img_files = glob.glob(os.path.join(extract_dir, "**", "*.img"), recursive=True)
    tif_files = glob.glob(os.path.join(extract_dir, "**", "*.tif*"), recursive=True)
    
    target_file = None
    if img_files:
        target_file = img_files[0]
    elif tif_files:
        target_file = tif_files[0]
        
    if not target_file:
        raise Exception(f"No .img or .tif found in {prefix} zip file.")
        
    # Use rasterio or Piyush's pipeline to load
    try:
        with rasterio.open(target_file) as src:
            img = src.read(1)
            transform = src.transform
            crs = src.crs
        return img, transform, crs
    except Exception as e:
        print(f"Rasterio load failed: {e}. Attempting raw load.")
        img = PlanetaryImagePipeline.load_raster(target_file)
        return img, None, None

@app.get("/")
def root():
    return {"message": "AutoAlign-C2 Backend is Running!", "endpoints": ["/api/health", "/api/run-pipeline"]}

@app.get("/api/health")
def health():
    import torch
    device = "CUDA" if torch.cuda.is_available() else "CPU"
    return {"status": "ok", "device": device, "model_loaded": matcher is not None}

@app.post("/api/run-pipeline")
async def run_pipeline(
    ohrc_zip: UploadFile = File(...),
    tmc_zip: UploadFile = File(...),
    iirs_zip: UploadFile = File(None)
):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print("[1] Extracting and loading raw datasets...")
            img_ohrc, _, _ = extract_and_load(ohrc_zip, temp_dir, "ohrc")
            img_tmc, tmc_transform, tmc_crs = extract_and_load(tmc_zip, temp_dir, "tmc")
            
            # (Optional) Extract IIRS if provided
            # img_iirs, _, _ = extract_and_load(iirs_zip, temp_dir, "iirs") if iirs_zip else (None, None, None)
            
            # --- PREPROCESSING (Role 2 / Downsampling & Canny) ---
            print("[2] Downsampling and Modality Bridge...")
            # Downsample OHRC (0.25m) to TMC (5m) by approx factor of 20
            h, w = img_ohrc.shape
            img_ohrc_down = cv2.resize(img_ohrc, (w // 20, h // 20), interpolation=cv2.INTER_AREA)
            
            # Normalize to uint8 for LoFTR
            img_ohrc_uint = to_uint8(img_ohrc_down)
            img_tmc_uint = to_uint8(img_tmc)
            
            # Pad to multiple of 8
            img1_pad, _ = pad_to_multiple_of_8(img_ohrc_uint)
            img2_pad, _ = pad_to_multiple_of_8(img_tmc_uint)
            
            # --- CORE ML MATCHING (Role 3 - YOU) ---
            print("[3] Running LoFTR Machine Learning Engine...")
            match_result = matcher.match_pair(img1_pad, img2_pad)
            src_pts = match_result["keypoints_src"]
            dst_pts = match_result["keypoints_dst"]
            conf = match_result.get("confidence", np.ones(len(src_pts)))
            
            if len(src_pts) < 10:
                return {"success": False, "error": "Not enough matches found (min 10 required)."}
                
            # --- CV RANSAC & WARPING (Role 4 - Ananya) ---
            print("[4] RANSAC Outlier Rejection and Homography Warp...")
            warp_result = align_images(img1_pad, src_pts, dst_pts)
            if not warp_result["success"]:
                return {"success": False, "error": "Homography estimation failed."}
                
            homography = warp_result["homography"]
            inlier_mask = warp_result["inlier_mask"]
            warped_img = warp_result["warped_image"]
            
            # Calculate Metrics
            metrics = compute_metrics(src_pts, dst_pts, homography, inlier_mask)
            metrics["total_raw"] = match_result.get("total_raw", len(src_pts))
            metrics["total_filtered"] = match_result.get("total_filtered", len(src_pts))
            
            # --- VISUALIZATIONS & EXPORT ---
            print("[5] Generating Visuals and Saving Aligned GeoTIFF...")
            img1_pad_viz = to_uint8(img1_pad)
            img2_pad_viz = to_uint8(img2_pad)
            warped_viz = to_uint8(warped_img)
            
            checkerboard = create_checkerboard(img2_pad_viz, warped_viz)
            match_viz = draw_match_visualization(img1_pad_viz, img2_pad_viz, src_pts, dst_pts)
            
            h2, w2 = img2_pad_viz.shape[:2]
            warped_resized = cv2.resize(warped_viz, (w2, h2))
            overlay = cv2.addWeighted(img2_pad_viz, 0.5, warped_resized, 0.5, 0)
            
            # Export Aligned GeoTIFF using Rasterio
            output_dir = "/home/yash/Documents/projects/AutoAlign-C2/outputs"
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, "Aligned_Composite.tif")
            
            try:
                with rasterio.open(
                    output_path, 'w', driver='GTiff',
                    height=h2, width=w2, count=1, dtype=str(warped_img.dtype),
                    crs=tmc_crs, transform=tmc_transform
                ) as dst:
                    dst.write(warped_img, 1)
            except Exception as e:
                print(f"Warning: GeoTIFF Export failed: {e}")
            
            print("[6] Pipeline Complete. Returning UI payload.")
            return {
                "success": True,
                "metrics": metrics,
                "homography": homography.tolist(),
                "images": {
                    "ohrc_preview": encode_image(img1_pad_viz, ".png"),
                    "tmc_preview": encode_image(img2_pad_viz, ".png"),
                    "match_visualization": encode_image(match_viz, ".jpg"),
                    "warped_overlay": encode_image(overlay, ".jpg"),
                    "checkerboard": encode_image(checkerboard, ".jpg")
                },
                "keypoints": {
                    "src": src_pts.tolist(),
                    "dst": dst_pts.tolist(),
                    "confidence": conf.tolist()
                },
                "export_path": output_path
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
