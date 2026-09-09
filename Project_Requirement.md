# Project Requirements — AutoAlign-C2

## 1. Objective
Build an automated, real-time pipeline that accepts raw Chandrayaan-2 imagery uploads, bridges the optical-to-spectral modality gap, and produces pixel-accurate co-registered outputs — proving alignment via a cinematic Next.js dashboard AND exporting a scientifically valid, multi-band GeoTIFF file.

---

## 2. Sensor Specifications (Ground Truth)

| Sensor | Type | Spatial Resolution | Bands | Data Format |
|--------|------|--------------------|-------|-------------|
| OHRC | Panchromatic optical | 0.25 m/px | 1 (grayscale) | GeoTIFF |
| TMC-2 | Panchromatic optical | 5 m/px | 1 (grayscale) | GeoTIFF |
| IIRS | Hyperspectral (VNIR+SWIR) | ~80 m/px | 256 narrow bands | GeoTIFF / IMG |

**Critical resolution gaps:**
- OHRC → TMC-2: 20× gap (both optical — same modality)
- TMC-2 → IIRS: 16× gap (optical vs spectral — cross-modal)
- OHRC → IIRS direct: 320× gap — **never attempt this directly**

---

## 3. Pipeline Stages (What To Build)

### Stage 0 — UI File Upload & Ingestion
- User drags and drops unaligned raw PRADAN `.zip` archives (OHRC, TMC-2, IIRS) into the Next.js frontend.
- Files are POSTed to the local FastAPI backend via `multipart/form-data`.
- Backend unzips the archives, parses the PDS4 `.xml` metadata, and reads the raw binary `.img` pixel arrays.

### Stage 1 — OHRC-to-TMC Alignment (Optical ↔ Optical)
- **Downsampling:** Gaussian-blur then downsample OHRC from 0.25m to 5m to match TMC spatial scale.
- **Feature Matching:** Run pre-trained LoFTR (via `kornia`) on downsampled-OHRC and TMC.
- **Outlier Rejection:** Feed keypoints into `cv2.findHomography(..., cv2.RANSAC)`. Discard outliers.
- **Warp:** Apply the homography via `cv2.warpPerspective()` using Nearest-Neighbor interpolation to align OHRC into TMC's coordinate frame.

### Stage 2 — TMC-to-IIRS Alignment (Optical ↔ Spectral)
- **Downsampling:** Downsample TMC from 5m to 80m to match IIRS spatial scale.
- **Edge Extraction (Modality Bridge):** Run `cv2.Canny()` on both the downsampled TMC and a representative IIRS band. This strips away spectral differences and isolates structural terrain geometry.
- **Feature Matching:** Run LoFTR on the two edge maps.
- **Warp:** Apply homography to warp TMC into IIRS's coordinate frame.

### Stage 3 — Validation & GeoTIFF Export
- **RMSE & Visuals:** Calculate RMSE, Inlier Ratio, and generate Base64 visualizations (Checkerboard, Overlays) for the UI.
- **Scientific Export:** `rasterio` writes the co-registered pixel arrays into a new physical GeoTIFF file (`outputs/Aligned_Composite.tif`). The backend embeds the TMC master affine transform and CRS to ensure strict radiometric and spatial integrity.

---

## 4. System Architecture (Localhost Monolith)

To bypass cloud timeout limits and payload restrictions, the entire application runs locally on the presentation machine, utilizing the local NVIDIA GPU.

### 4.1 FastAPI Backend (`localhost:8000`)
- Initializes the heavy PyTorch `LoFTRMatcher` on the local CUDA GPU.
- Exposes `POST /api/run-pipeline` which accepts `UploadFile` objects (the GeoTIFFs).
- Returns visual dashboard data (JSON/Base64) AND triggers the local physical GeoTIFF file export.

### 4.2 Next.js Frontend (`localhost:3000`)
- **Landing Page (`/`)**: 3D interactive model of Chandrayaan-2/Moon.
- **Mission Control Dashboard (`/dashboard`)**:
  - **Phase 1 (Setup & Simulation)**: Interactive Drag-and-Drop file upload zone for the 3 sensors. Submits async POST request.
  - **Phase 2 (Payload Reveal)**: Full-viewport display of the fused lunar terrain (Warped Overlay).
  - **Metrics Dashboard**: Displays real-time RMSE, Inlier Ratio, Match counts, and the computed Homography matrix.
  - **Interactive Viz Tabs**: Toggles between the Warped Overlay, LoFTR Match lines, and Checkerboard alignment verification.
  - **Export Button**: A glowing "Download Aligned GeoTIFF" button to retrieve the actual scientific file.

---

## 5. Deliverables Checklist

| # | Deliverable | Owner | Status |
|---|-------------|-------|--------|
| 1 | `ingest.py` — File Upload parsing & Metadata extraction | Role 1 (Data Ingestion Lead) | |
| 2 | `preprocess.py` — Downsampling / Canny Bridge | Role 2 (Resolution Handling) | |
| 3 | `match.py` — LoFTR Core ML Engine | Role 3 (Core ML Lead - YOU) | |
| 4 | `warp.py`, `validate.py` — RANSAC, Viz, & **GeoTIFF Export** | Role 4 (Warp & Validation Lead) | |
| 5 | `frontend/` — Next.js UI, File Uploads, Download Button | Role 5 (UI/Demo Lead) | |
| 6 | `api.py` — FastAPI Integration Layer handling `UploadFile` | Role 6 (Integration/Presenter) | |
