import os
import rasterio
import matplotlib.pyplot as plt
from rasterio.windows import Window

xml_path = r"data\raw\20211023\ch2_ohr_nrp_20211023T0027462822_d_img_d18.xml"
out_dir = "output_analysis_ready"
os.makedirs(out_dir, exist_ok=True)
out_png = os.path.join(out_dir, "real_ohrc_preview.png")

print(f"Opening {xml_path}...")
with rasterio.open(xml_path) as src:
    print(f"Raster dimensions: {src.width} samples x {src.height} lines")
    # Take a 1500 x 1500 pixel window from the center of the swath
    col_off = (src.width - 1500) // 2
    row_off = 30000  # 30,000 lines into the track
    print(f"Reading window at row={row_off}, col={col_off}...")
    patch = src.read(1, window=Window(col_off, row_off, 1500, 1500))
    print(f"Window extracted! Shape: {patch.shape}, min={patch.min()}, max={patch.max()}, mean={patch.mean():.2f}")
    
    plt.figure(figsize=(8, 8))
    plt.imshow(patch, cmap="gray")
    plt.title("Chandrayaan-2 OHRC (0.26m/pixel) - Lunar South Pole")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_png, dpi=200, bbox_inches="tight")
    print(f"Saved real OHRC preview image to: {out_png}")
