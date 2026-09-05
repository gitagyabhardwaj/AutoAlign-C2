# Project Requirements — AutoAlign-C2

## 1. Objective
Build an automated pipeline that takes raw, loosely geo-referenced imagery from three Chandrayaan-2 sensors (OHRC, TMC-2, IIRS) and produces pixel-accurate co-registered outputs — proving alignment via an interactive Streamlit dashboard.

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

### Stage 0 — Data Ingestion
- Load GeoTIFF strips using `rasterio`.
- Extract the pixel array, CRS (Coordinate Reference System), and affine transform metadata.
- Crop overlapping regions using the geo-referenced bounding boxes so we only process the area where all three sensors have coverage.

### Stage 1 — OHRC-to-TMC Alignment (Optical ↔ Optical)
- **Downsampling:** Gaussian-blur then downsample OHRC from 0.25m to 5m to match TMC spatial scale.
- **Feature Matching:** Run pre-trained LoFTR (via `kornia`) on downsampled-OHRC and TMC. Extract matched keypoint coordinate pairs.
- **Outlier Rejection:** Feed keypoints into `cv2.findHomography(..., cv2.RANSAC)`. Discard outliers.
- **Warp:** Apply the homography via `cv2.warpPerspective()` to align OHRC into TMC's coordinate frame.

### Stage 2 — TMC-to-IIRS Alignment (Optical ↔ Spectral)
- **Downsampling:** Downsample TMC from 5m to 80m to match IIRS spatial scale.
- **Edge Extraction (Modality Bridge):** Run `cv2.Canny()` on both the downsampled TMC and a representative IIRS band (or band average). This strips away brightness/spectral differences and isolates structural terrain geometry (crater rims, ridges).
- **Feature Matching:** Run LoFTR on the two edge maps. Extract matched keypoint coordinate pairs.
- **Outlier Rejection:** RANSAC via `cv2.findHomography()`.
- **Warp:** Apply homography to warp TMC into IIRS's coordinate frame.

### Stage 3 — Compositing
- Stack the aligned OHRC (high-res structure) and IIRS (mineral/spectral data) into a single multi-band output.
- Save as a multi-band GeoTIFF with preserved geo-referencing metadata.

### Stage 4 — Validation
- **RMSE:** Compute Root Mean Square Error of the residual distances between RANSAC inlier keypoints after warping. Target: < 2.0 px.
- **Inlier Ratio:** `(number of RANSAC inliers) / (total LoFTR matches)`. Target: > 50%.
- **Visual Checkerboard:** Generate a checkerboard blend of the two aligned images — alternating tiles from each sensor. Misalignment shows as broken edges at tile boundaries.

---

## 4. UI Dashboard Features (Streamlit)

### 4.1 Region Selector
- Dropdown with 2-3 pre-loaded lunar regions (e.g., "Tycho Crater", "Shackleton Crater").
- Selecting a region loads corresponding OHRC, TMC, IIRS strips from `./data/`.
- No manual file upload during the demo.

### 4.2 "Run Pipeline" Button
- Triggers the full Stage 1 → Stage 2 → Stage 3 → Stage 4 sequence.
- Displays a progress bar or step indicator.

### 4.3 Before/After Swipe Slider
- Uses `streamlit-image-comparison` to render an interactive slider.
- Left side: OHRC optical (grayscale).
- Right side: IIRS heatmap (false-color) overlaid on the same frame.
- Dragging the slider proves pixel-perfect alignment.

### 4.4 Keypoint Match Visualization
- Draws colored lines connecting matched keypoints between the two source images (using `cv2.drawMatches` or matplotlib).
- Proves the ML model dynamically found geometric correspondences.

### 4.5 Metrics Panel (Sidebar)
- **RMSE** value with a color-coded indicator (green < 1.0, yellow < 2.0, red > 2.0).
- **Inlier Ratio** as a percentage.
- **Number of Keypoints Matched.**
- **Homography Matrix** (the raw 3×3 warp matrix, displayed as a table).

### 4.6 Checkerboard View (Optional Bonus)
- Toggle to show the checkerboard blend for visual validation.

### 4.7 Failure Handling
- If LoFTR returns < 10 keypoints, display a red banner: `"Registration Failed: Insufficient geometric overlap between the selected datasets."`.
- Do not silently fail or show a broken warp.

---

## 5. Deliverables Checklist

| # | Deliverable | Owner |
|---|-------------|-------|
| 1 | Pre-downloaded OHRC, TMC, IIRS strips | Role 1 (Data Ingestion Lead) |
| 2 | `ingest.py` — GeoTIFF loader & cropping | Role 1 (Data Ingestion Lead) |
| 3 | `preprocess.py` — Downsampling / Scale Pyramids | Role 2 (Resolution Handling) |
| 4 | `match.py` — LoFTR + Canny Edge Modality Bridge | Role 3 (Core ML Lead - YOU) |
| 5 | `warp.py` — RANSAC + warpPerspective | Role 4 (Warp & Validation Lead) |
| 6 | `validate.py` — RMSE & Inlier Ratio | Role 4 (Warp & Validation Lead) |
| 7 | `app.py` — Streamlit dashboard | Role 5 (UI/Demo Lead) |
| 8 | Git, Docker, Pitch Presentation | Role 6 (Integration/Presenter) |

