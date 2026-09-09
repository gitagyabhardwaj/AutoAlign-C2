# Rules & Safeguards — AutoAlign-C2

---

## Rule 1: Never Train from Scratch
- Use pre-trained LoFTR weights via `kornia.feature.LoFTR(pretrained="outdoor")`.
- Zero training loops. Zero custom datasets. Zero epochs.
- All ML work is **inference only**.

## Rule 2: Never Match OHRC Directly to IIRS
- The 320× resolution gap (0.25m vs 80m) will produce zero valid keypoints.
- Always go OHRC → TMC → IIRS using the Bridge strategy.

## Rule 3: Never Apply Histogram Matching Across Modalities
- Do not force IIRS spectral data to match OHRC optical brightness distributions.
- This destroys mineral signatures (water-ice, pyroxene, etc.) and creates scientifically invalid data.
- Normalize each image independently (Z-score or min-max per image).

## Rule 4: Always Edge-Extract Before Cross-Modal Matching
- Before matching TMC (optical) against IIRS (spectral), run `cv2.Canny()` on both.
- This strips away the modality gap and exposes shared structural geometry (crater rims, ridges).
- Without this step, LoFTR will fail on cross-modal pairs.

## Rule 5: Local PRADAN .Zip Uploads (No Cloud Limits)
- Because the stack runs exclusively on localhost, the UI must accept raw PRADAN `.zip` archives directly from the user via Drag-and-Drop.
- The Next.js frontend sends these files via `multipart/form-data` to the local FastAPI backend.
- The backend unzips them, parses the PDS4 `.xml` metadata, and reads the `.img` binaries in memory.

## Rule 6: Generate Real Scientific Output (GeoTIFF Export)
- The pipeline MUST NOT just generate web-friendly JPGs for the dashboard.
- The backend must use `rasterio` to write the final aligned pixel arrays into a physical, downloadable GeoTIFF file.
- The exported GeoTIFF must strictly preserve the affine transform, CRS metadata, and use Nearest-Neighbor resampling to maintain raw radiometric integrity.

## Rule 7: Always Fail Gracefully
- If LoFTR returns fewer than 10 keypoints → display a red error banner, do not attempt warp.
- If RANSAC inlier ratio drops below 20% → display a warning, flag the result as low-confidence.
- Never show a silently broken or torn warp to the judges.

## Rule 8: Never Commit Data to Git
- Add `data/` and `outputs/` to `.gitignore`.
- GeoTIFF strips can be hundreds of MB to several GB.
- Share data via Google Drive or an external hard drive.

## Rule 9: Always Preserve Geo-Metadata
- When warping images, carry the `rasterio` profile (CRS, affine transform) through the pipeline.
- The final multi-band GeoTIFF must retain valid coordinates so it can be opened in QGIS.
- Do not discard the transform metadata after reading the pixel array.

## Rule 10: Acknowledge the 2D Warp Limitation
- Our MVP uses a 2D Homography (assumes flat terrain).
- The Moon has significant 3D topography (craters, mountains) that causes parallax distortion.
- In the pitch, explicitly state: *"For production, we would upgrade to DEM-based orthorectification."*
- This shows technical maturity, not weakness.

## Rule 11: Pin All Dependencies
- Use exact versions in `requirements.txt` (e.g., `kornia==0.7.3`, not `kornia`).
- A breaking update to kornia or torch mid-hackathon will cost hours of debugging.

## Rule 12: GPU Fallback
- LoFTR runs on GPU by default. If no NVIDIA GPU is available, the code must gracefully fall back to CPU.
- Add a device check: `device = torch.device("cuda" if torch.cuda.is_available() else "cpu")`.
- CPU inference will be slower but must still work for the demo.

## Rule 13: Maintain MEMORY.md
- Always document critical decisions, ML architecture tweaks, and current state in MEMORY.md.
- This ensures context survives if the chat window is closed or reset.
