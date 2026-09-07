# Chandrayaan-2 Planetary Imagery Preprocessing Pipeline

This repository provides an end-to-end, analysis-ready preprocessing pipeline for **Chandrayaan-2** instruments (**OHRC**, **TMC-2**, and **IIRS**) downloaded from ISRO's **PRADAN** portal.

---

## 🚀 Quick Start

### 1. Environment
Your conda environment `lunar` is already set up with all required libraries (`gdal`, `rasterio`, `pvl`, `scikit-image`, `numpy`, `scipy`).

To activate:
```powershell
conda activate lunar
```

### 2. Verify with Synthetic Test Data
Run the built-in end-to-end test suite (generates synthetic TMC-2 and OHRC scenes, calibrates them, matches histograms, and exports GeoTIFFs):
```powershell
python synthetic_test.py
```

### 3. Process Real Scenes from PRADAN
```powershell
python process_scene.py --label path/to/scene.lbl --image path/to/scene.img --output path/to/analysis_ready.tif
```

Optional: To histogram-match an OHRC image to an existing TMC-2 mosaic/scene:
```powershell
python process_scene.py --label ohrc.lbl --image ohrc.img --output ohrc_calibrated.tif --ref-geotiff tmc_calibrated.tif
```

---

## 🌕 Understanding PRADAN & Chandrayaan-2 Data

### 1. Data Levels on PRADAN (https://pradan.issdc.gov.in/)
| Product Level | Description | What you get | Recommendation for Hackathons |
|---|---|---|---|
| **Level-1 (L1 / EDR)** | Raw telemetry / DN | Raw uncalibrated digital numbers. Detached `.lbl` + `.img`. | Use this pipeline to calibrate DN $\to$ Radiance $\to$ Reflectance. |
| **Level-1B (L1B / CDR)** | Calibrated Radiance | Radiance values ($W / m^2 \cdot sr \cdot \mu m$), sensor artifacts removed. | Recommended if available! Skip DN calibration and proceed directly to reflectance & georeferencing. |
| **Level-2 (L2 / RDR)** | Map-Projected / DEM | Already orthorectified onto Moon 2000 ellipsoid / projection. | **Gold standard for ML teams** — ready for GeoTIFF tiling immediately. |

### 2. File Formats & Quirks
- **Detached Headers**: Most PDS3 products have a detached ASCII label (`.lbl`) and raw binary file (`.img`). Standard GDAL/Rasterio often crashes (`file format not recognized`) because it cannot parse the label syntax without specialized drivers.
  - **Solution in this pipeline**: `pipeline.py` includes an automatic fallback that reads the raw binary byte stream directly using the `SAMPLE_TYPE`, `SAMPLE_BITS`, `LINES`, and `LINE_SAMPLES` parsed by `pvl`.
- **Projection Frame**: The lunar ellipsoid is typically represented by a sphere with radius **$R = 1,737,400\text{ meters}$**. Raw PDS records often lack standard EPSG codes. This pipeline generates explicit PROJ-compliant WKT and Affine geotransforms.
- **IIRS Hyperspectral Cubes**: IIRS data contains ~256 spectral bands from $800\text{ nm}$ to $5000\text{ nm}$. For mineral mapping (e.g. hydroxyl/water absorption at $\sim 2800-3000\text{ nm}$), select specific band slices before exporting.

---

## 🛠️ Calibration Math

1. **Radiometric Calibration**:
   $$\text{Radiance } (L) = \text{DN} \times \text{SCALING\_FACTOR} + \text{OFFSET}$$
2. **Reflectance / Illumination Correction ($I/F$)**:
   $$\rho = \frac{\pi \cdot L \cdot d_{\odot}^2}{F_{\odot} \cdot \cos(i)}$$
   - $d_{\odot}$: Sun-Moon distance in AU ($\approx 1.0$)
   - $F_{\odot}$: Solar irradiance at $1\text{ AU}$ ($\approx 1361\text{ W/m}^2$)
   - $i$: Solar incidence angle from PDS label
3. **Lommel-Seeliger Photometric Normalization**:
   Corrects for lunar regolith scattering behavior and normalizes scenes acquired at different sun angles to a standard $30^\circ$ phase geometry.
