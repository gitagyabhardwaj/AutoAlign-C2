# Architecture — AutoAlign-C2

---

## 1. Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Language | Python 3.10+ | Ecosystem support for CV/ML/Geo |
| Deep Learning | `torch`, `kornia` | Pre-trained LoFTR with zero config |
| Classical CV | `opencv-python` (cv2) | RANSAC, Homography, warpPerspective, Canny, drawMatches |
| Numerical | `numpy` | Array ops for pixel data |
| Geospatial I/O | `rasterio` | Read/write GeoTIFF, handle CRS and affine transforms |
| Visualization | `matplotlib` | Keypoint match plots, checkerboard generation |
| Frontend | `streamlit` | Rapid dashboard prototyping |
| Swipe Widget | `streamlit-image-comparison` | Interactive before/after slider component |

---

## 2. Folder & File Structure

```
AutoAlign-C2/
│
├── data/                           # Pre-downloaded satellite strips
│   ├── tycho/                      # Region of Interest 1
│   │   ├── ohrc.tif
│   │   ├── tmc.tif
│   │   └── iirs.tif
│   └── shackleton/                 # Region of Interest 2
│       ├── ohrc.tif
│       ├── tmc.tif
│       └── iirs.tif
│
├── src/
│   ├── __init__.py
│   │
│   ├── pipeline/                   # Core processing engine
│   │   ├── __init__.py
│   │   ├── ingest.py               # GeoTIFF loading, bbox overlap cropping
│   │   ├── preprocess.py           # Gaussian blur, downsampling, Canny edge extraction
│   │   ├── match.py                # LoFTR inference wrapper (kornia)
│   │   ├── warp.py                 # RANSAC outlier rejection, Homography, warpPerspective
│   │   ├── validate.py             # RMSE calculation, Inlier Ratio, checkerboard blend
│   │   └── compose.py             # Stack aligned bands into multi-band GeoTIFF output
│   │
│   └── ui/
│       └── app.py                  # Streamlit dashboard — the entire frontend
│
├── notebooks/                      # Jupyter notebooks for experimentation
│   └── test_loftr.ipynb            # Quick sandbox to test LoFTR on sample images
│
├── outputs/                        # Generated aligned images and GeoTIFFs (gitignored)
│
├── Project_Requirement.md
├── architecture.md
├── rules.md
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 3. Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STREAMLIT FRONTEND                        │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Region   │  │   Run    │  │  Swipe   │  │  Metrics  │  │
│  │ Dropdown  │──│ Pipeline │──│  Slider  │  │  Sidebar  │  │
│  └───────────┘  └────┬─────┘  └──────────┘  └───────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                     BACKEND PIPELINE                          │
│                                                               │
│  ┌──────────┐                                                 │
│  │ ingest.py│  Load OHRC, TMC, IIRS GeoTIFFs                 │
│  │          │  Extract arrays + geo metadata                  │
│  │          │  Crop to overlapping bounding box                │
│  └────┬─────┘                                                 │
│       │                                                       │
│       ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐      │
│  │            BRIDGE 1: OHRC → TMC                     │      │
│  │                                                     │      │
│  │  preprocess.py                                      │      │
│  │    → Gaussian blur OHRC                             │      │
│  │    → Downsample OHRC from 0.25m to 5m               │      │
│  │                                                     │      │
│  │  match.py                                           │      │
│  │    → Load kornia LoFTR (pretrained="outdoor")       │      │
│  │    → Feed downsampled_OHRC + TMC as grayscale       │      │
│  │    → Return keypoints_ohrc[], keypoints_tmc[]       │      │
│  │                                                     │      │
│  │  warp.py                                            │      │
│  │    → cv2.findHomography(kp_ohrc, kp_tmc, RANSAC)   │      │
│  │    → cv2.warpPerspective(ohrc_full_res, H)          │      │
│  │    → Output: OHRC aligned to TMC frame              │      │
│  └─────────────────────────────────────────────────────┘      │
│       │                                                       │
│       ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐      │
│  │            BRIDGE 2: TMC → IIRS                     │      │
│  │                                                     │      │
│  │  preprocess.py                                      │      │
│  │    → Downsample TMC from 5m to 80m                  │      │
│  │    → cv2.Canny() on downsampled TMC                 │      │
│  │    → cv2.Canny() on IIRS band average               │      │
│  │                                                     │      │
│  │  match.py                                           │      │
│  │    → Feed edge_tmc + edge_iirs into LoFTR           │      │
│  │    → Return keypoints_tmc[], keypoints_iirs[]       │      │
│  │                                                     │      │
│  │  warp.py                                            │      │
│  │    → cv2.findHomography(kp_tmc, kp_iirs, RANSAC)   │      │
│  │    → cv2.warpPerspective(tmc_aligned, H)            │      │
│  │    → Output: TMC aligned to IIRS frame              │      │
│  └─────────────────────────────────────────────────────┘      │
│       │                                                       │
│       ▼                                                       │
│  ┌──────────┐                                                 │
│  │compose.py│  Stack aligned OHRC + TMC + IIRS bands          │
│  │          │  Write multi-band GeoTIFF to ./outputs/         │
│  └────┬─────┘                                                 │
│       │                                                       │
│       ▼                                                       │
│  ┌────────────┐                                               │
│  │validate.py │  Compute RMSE from residual keypoint errors   │
│  │            │  Compute Inlier Ratio                         │
│  │            │  Generate checkerboard blend image             │
│  └────────────┘                                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Key Data Flow Contracts

Each module communicates via simple Python objects. No complex serialization.

### `ingest.py` outputs:
```python
{
    "ohrc": np.ndarray,       # 2D grayscale pixel array
    "tmc": np.ndarray,
    "iirs": np.ndarray,       # 2D (band-averaged) or 3D (H x W x Bands)
    "ohrc_meta": dict,        # rasterio profile (CRS, transform, shape)
    "tmc_meta": dict,
    "iirs_meta": dict,
}
```

### `match.py` outputs:
```python
{
    "keypoints_src": np.ndarray,   # shape (N, 2) — x,y coords in source image
    "keypoints_dst": np.ndarray,   # shape (N, 2) — x,y coords in target image
    "confidence": np.ndarray,      # shape (N,) — match confidence scores
}
```

### `warp.py` outputs:
```python
{
    "warped_image": np.ndarray,    # the source image warped into target's frame
    "homography": np.ndarray,      # 3x3 matrix
    "inlier_mask": np.ndarray,     # boolean mask from RANSAC
}
```

### `validate.py` outputs:
```python
{
    "rmse": float,
    "inlier_ratio": float,
    "num_inliers": int,
    "num_total_matches": int,
    "checkerboard": np.ndarray,    # blended checkerboard image for display
}
```
