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
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil

# Import pipeline modules
from src.pipeline.match import LoFTRMatcher
from src.pipeline.modality_bridge import apply_canny_edge_map
from src.pipeline.warp import align_images
from src.pipeline.validate import compute_metrics, create_checkerboard
from src.pipeline.viz import draw_match_visualization
# PlanetaryImagePipeline is imported lazily below (requires GDAL/osgeo)

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
    """Extracts a PRADAN zip, finds the .xml label, and returns the numpy array natively."""
    extract_dir = os.path.join(temp_dir, prefix)
    os.makedirs(extract_dir, exist_ok=True)
    
    # Read directly from the uploaded file buffer to save disk IO
    with zipfile.ZipFile(zip_file.file, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    # For PDS4 datasets, Rasterio/GDAL must open the .xml label file, not the raw .img file
    xml_files = [f for f in glob.glob(os.path.join(extract_dir, "**", "*.xml"), recursive=True) if "brw" not in f and "browse" not in f]
    tif_files = glob.glob(os.path.join(extract_dir, "**", "*.tif*"), recursive=True)
    
    target_file = None
    if xml_files:
        target_file = xml_files[0]
    elif tif_files:
        target_file = tif_files[0]
        
    if not target_file:
        raise Exception(f"No .xml label or .tif found in {prefix} zip file.")
        
    # Use rasterio to load the image and its metadata natively
    with rasterio.open(target_file) as src:
        img = src.read(1)
        transform = src.transform
        crs = src.crs
    return img, transform, crs

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
        # Use a physical disk directory instead of RAM-based /tmp to avoid Disk Quota (tmpfs) issues
        temp_base = "/home/yash/Documents/projects/AutoAlign-C2/outputs/temp"
        os.makedirs(temp_base, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=temp_base) as temp_dir:
            print("[1] Extracting and loading raw datasets...")
            img_ohrc, _, _ = extract_and_load(ohrc_zip, temp_dir, "ohrc")
            img_tmc, tmc_transform, tmc_crs = extract_and_load(tmc_zip, temp_dir, "tmc")
            
            # (Optional) Extract IIRS if provided
            img_iirs, iirs_transform, iirs_crs = extract_and_load(iirs_zip, temp_dir, "iirs") if iirs_zip else (None, None, None)
            
            # --- PREPROCESSING (Role 2 / Downsampling & Canny) ---
            print("[2] Downsampling and Modality Bridge...")
            print(f"RAW SHAPES: OHRC={img_ohrc.shape}, TMC={img_tmc.shape}")
            
            # Massive 100k+ line planetary swaths will turn into 18px-wide slivers if we just resize.
            # We must take a square-ish center crop first (e.g. 4000x4000) to preserve geometry.
            def crop_center(img, crop_size=4000):
                h, w = img.shape[:2]
                ch = min(crop_size, h)
                cw = min(crop_size, w)
                row_off = (h - ch) // 2
                col_off = (w - cw) // 2
                return img[row_off:row_off+ch, col_off:col_off+cw]
                
            img_ohrc_cropped = crop_center(img_ohrc, crop_size=12000) # OHRC is ~12k wide
            img_tmc_cropped = crop_center(img_tmc, crop_size=4000)    # TMC is ~4k wide
            
            # Prevent CUDA OOM on 4GB GPUs: Constrain max dimensions to 840px for LoFTR
            def resize_to_max_and_scale(img, max_dim=840):
                ih, iw = img.shape[:2]
                if max(ih, iw) > max_dim:
                    scale = max_dim / float(max(ih, iw))
                    return cv2.resize(img, (int(iw * scale), int(ih * scale)), interpolation=cv2.INTER_AREA), scale
                return img, 1.0
                
            img_ohrc_down, scale_ohrc = resize_to_max_and_scale(img_ohrc_cropped)
            img_tmc, scale_tmc = resize_to_max_and_scale(img_tmc_cropped)
            
            if img_iirs is not None:
                # IIRS is 80m/px. TMC is 5m/px. 
                # To match the 20km x 20km physical swath of TMC (4000px * 5m), 
                # we must crop exactly 250 pixels of IIRS (250px * 80m = 20km).
                img_iirs_cropped = crop_center(img_iirs, crop_size=250)
                img_iirs_down, scale_iirs = resize_to_max_and_scale(img_iirs_cropped)
            else:
                img_iirs_cropped = None
                img_iirs_down = None
            
            print(f"RESIZED SHAPES: OHRC={img_ohrc_down.shape}, TMC={img_tmc.shape}")
            
            # --- MODALITY BRIDGE (Canny Edge) ---
            print("Applying Canny Edge Modality Bridge for multi-sensor invariance...")
            img_ohrc_edge = apply_canny_edge_map(img_ohrc_down)
            img_tmc_edge = apply_canny_edge_map(img_tmc)
            img_iirs_edge = apply_canny_edge_map(img_iirs_down) if img_iirs_down is not None else None
            
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Pad to multiple of 8 (feed edges to LoFTR)
            img1_pad, pad1 = pad_to_multiple_of_8(img_ohrc_edge)
            img2_pad, pad2 = pad_to_multiple_of_8(img_tmc_edge)
            pad_h1, pad_w1 = pad1
            pad_h2, pad_w2 = pad2
            
            # Also pad raw for UI visual overlay
            img1_raw_pad, _ = pad_to_multiple_of_8(to_uint8(img_ohrc_down))
            img2_raw_pad, _ = pad_to_multiple_of_8(to_uint8(img_tmc))
            
            cv2.imwrite("/home/yash/Documents/projects/AutoAlign-C2/outputs/debug_ohrc_edge.jpg", img1_pad)
            cv2.imwrite("/home/yash/Documents/projects/AutoAlign-C2/outputs/debug_tmc_edge.jpg", img2_pad)
            
            # --- CORE ML MATCHING ---
            print("[3] Running LoFTR Machine Learning Engine on Edge Maps...")
            match_result = matcher.match_pair(img1_pad, img2_pad)
            src_pts = match_result["keypoints_src"]
            dst_pts = match_result["keypoints_dst"]
            conf = match_result.get("confidence", np.ones(len(src_pts)))
            
            if len(src_pts) < 10:
                return {"success": False, "error": "Not enough matches found across structural edges."}
                
            # --- CV RANSAC & WARPING ---
            print("[4] RANSAC Outlier Rejection and Homography Warp...")
            
            warp_result = align_images(img1_raw_pad, src_pts, dst_pts)
            if not warp_result["success"]:
                return {"success": False, "error": "Homography estimation failed."}
                
            homography = warp_result["homography"]
            inlier_mask = warp_result["inlier_mask"]
            warped_img = warp_result["warped_image"]
            
            # Upscale Keypoints
            src_pts_orig = (src_pts - np.array([pad_w1, pad_h1])) / scale_ohrc
            dst_pts_orig = (dst_pts - np.array([pad_w2, pad_h2])) / scale_tmc
            
            H_affine_orig, inlier_mask_orig = cv2.estimateAffinePartial2D(src_pts_orig, dst_pts_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)
            if H_affine_orig is not None:
                homography_orig = np.vstack([H_affine_orig, [0, 0, 1]])
            else:
                homography_orig = None
            
            if homography_orig is None:
                return {"success": False, "error": "High-res homography estimation failed."}
                
            h_tmc_orig, w_tmc_orig = img_tmc_cropped.shape[:2]
            
            print("[5] Generating High-Res Scientific GeoTIFF...")
            
            # Warp the ORIGINAL scientific data arrays (retaining float32/uint16 radiometry)
            warped_orig_science = cv2.warpPerspective(img_ohrc_cropped, homography_orig, (w_tmc_orig, h_tmc_orig))
            
            # --- STRICT IIRS FUSION ---
            print("Fusing IIRS Hyperspectral data...")
            if img_iirs_edge is None:
                raise RuntimeError("STRICT MODE: IIRS edge map is missing. 3-sensor fusion requires IIRS.")
                
            img_iirs_pad, pad_iirs = pad_to_multiple_of_8(img_iirs_edge)
            
            # SCIENTIFIC FIX: IIRS is 80m/px (blurry). TMC is 5m/px (sharp).
            # To match topologies, we must artificially degrade the TMC image to match IIRS frequency domain.
            img_tmc_degraded = cv2.GaussianBlur(img_tmc, (15, 15), 0)
            img_tmc_degraded_edge = apply_canny_edge_map(img_tmc_degraded)
            img_tmc_degraded_pad, _ = pad_to_multiple_of_8(img_tmc_degraded_edge)
            
            # This will naturally throw a RuntimeError from matcher.py if < 10 matches are found
            match_result_iirs = matcher.match_pair(img_iirs_pad, img_tmc_degraded_pad)
            
            src_pts_iirs = match_result_iirs["keypoints_src"]
            dst_pts_iirs = match_result_iirs["keypoints_dst"]
            
            src_pts_iirs_orig = (src_pts_iirs - np.array([pad_iirs[1], pad_iirs[0]])) / scale_iirs
            dst_pts_iirs_orig = (dst_pts_iirs - np.array([pad_w2, pad_h2])) / scale_tmc
            
            H_iirs_affine_orig, _ = cv2.estimateAffinePartial2D(src_pts_iirs_orig, dst_pts_iirs_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)
            
            if H_iirs_affine_orig is None:
                raise RuntimeError("STRICT MODE: IIRS Affine Homography failed. Geometric alignment rejected.")
                
            homography_iirs_orig = np.vstack([H_iirs_affine_orig, [0, 0, 1]])
            warped_iirs_science = cv2.warpPerspective(img_iirs_cropped, homography_iirs_orig, (w_tmc_orig, h_tmc_orig))
            
            print("SUCCESS: 3-Band Stack Created (TMC + OHRC + IIRS)")
            science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32), warped_iirs_science.astype(np.float32)], axis=0)
            
            metrics = compute_metrics(src_pts, dst_pts, homography, inlier_mask)
            metrics["total_raw"] = match_result.get("total_raw", len(src_pts))
            metrics["total_filtered"] = match_result.get("total_filtered", len(src_pts))
            
            # --- UI VISUALIZATIONS (uint8 for the web dashboard only) ---
            img1_pad_viz = img1_raw_pad
            img2_pad_viz = img2_raw_pad
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
                    height=h_tmc_orig, width=w_tmc_orig, count=science_stack.shape[0], dtype=str(science_stack.dtype),
                    crs=tmc_crs, transform=tmc_transform
                ) as dst:
                    dst.write(science_stack)
            except Exception as e:
                print(f"Warning: GeoTIFF Export failed: {e}")
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

@app.get("/api/download-result")
def download_result():
    """Serve the last aligned GeoTIFF for download."""
    output_path = "/home/yash/Documents/projects/AutoAlign-C2/outputs/Aligned_Composite.tif"
    if not os.path.exists(output_path):
        return {"success": False, "error": "No aligned result found. Run the pipeline first."}
    return FileResponse(
        path=output_path,
        filename="Aligned_Composite.tif",
        media_type="image/tiff"
    )

