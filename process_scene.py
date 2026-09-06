"""
Command-Line Interface for Chandrayaan-2 Ingestion & Processing
==============================================================
Run on any PDS3/PDS4 Chandrayaan-2 scene:
  python process_scene.py --label path/to/label.lbl --image path/to/image.img --output path/to/output.tif
"""

import argparse
import sys
from pipeline import PlanetaryImagePipeline


def main():
    parser = argparse.ArgumentParser(description="Process Chandrayaan-2 OHRC/TMC-2/IIRS PDS files into Analysis-Ready GeoTIFFs.")
    parser.add_argument("--label", "-l", required=True, help="Path to PDS label (.lbl or .xml)")
    parser.add_argument("--image", "-i", required=True, help="Path to raw image (.img or .qub)")
    parser.add_argument("--output", "-o", required=True, help="Path to output GeoTIFF (.tif)")
    parser.add_argument("--photometric", "-p", choices=["lommel_seeliger", "lambertian"], default="lommel_seeliger",
                        help="Photometric model (default: lommel_seeliger)")
    parser.add_argument("--ref-geotiff", "-r", default=None,
                        help="Optional reference GeoTIFF for cross-sensor histogram matching")

    parser.add_argument("--crop-lines", type=int, default=None,
                        help="Optional number of lines to crop (for massive scenes like OHRC)")
    parser.add_argument("--crop-samples", type=int, default=None,
                        help="Optional number of samples to crop")
    parser.add_argument("--row-offset", type=int, default=0,
                        help="Row offset for cropping")
    parser.add_argument("--col-offset", type=int, default=0,
                        help="Column offset for cropping")

    args = parser.parse_args()

    print(f"[*] Parsing label: {args.label}")
    meta = PlanetaryImagePipeline.load_pds_label(args.label)
    print(f"    Instrument: {meta.instrument_name}")
    print(f"    Product ID: {meta.product_id}")
    print(f"    Dimensions: {meta.lines} lines x {meta.samples} samples")
    print(f"    Incidence Angle: {meta.incidence_angle:.2f} deg | Sun Distance: {meta.solar_distance_au:.4f} AU")

    # Handle windowed read if requested or if file is colossal (> 20,000 lines)
    if args.crop_lines is not None or meta.lines > 20000:
        crop_h = args.crop_lines if args.crop_lines is not None else min(2048, meta.lines)
        crop_w = args.crop_samples if args.crop_samples is not None else min(2048, meta.samples)
        row_off = args.row_offset if args.row_offset > 0 else (meta.lines - crop_h) // 2
        col_off = args.col_offset if args.col_offset > 0 else (meta.samples - crop_w) // 2

        print(f"[*] Extracting window to preserve RAM: {crop_w}x{crop_h} at row={row_off}, col={col_off}")
        import rasterio
        from rasterio.windows import Window
        
        # Read window via label (PDS4 XML) or image directly
        read_target = args.label if args.label.lower().endswith(".xml") else args.image
        try:
            with rasterio.open(read_target) as src:
                raw_dn = src.read(1, window=Window(col_off, row_off, crop_w, crop_h)).astype("float32")
        except Exception:
            raw_full = PlanetaryImagePipeline.load_raster(args.image, meta)
            raw_dn = raw_full[row_off:row_off + crop_h, col_off:col_off + crop_w]

        out_lines, out_samples = crop_h, crop_w
    else:
        print(f"[*] Loading full raster: {args.image}")
        raw_dn = PlanetaryImagePipeline.load_raster(args.image, meta)
        out_lines, out_samples = meta.lines, meta.samples

    print("[*] Radiometric calibration: DN -> Radiance")
    radiance = PlanetaryImagePipeline.dn_to_radiance(raw_dn, scale=meta.scaling_factor, offset=meta.offset)

    print(f"[*] Photometric correction: Radiance -> Reflectance ({args.photometric})")
    reflectance = PlanetaryImagePipeline.radiance_to_reflectance(
        radiance,
        incidence_angle_deg=meta.incidence_angle,
        solar_distance_au=meta.solar_distance_au,
        solar_irradiance=meta.solar_irradiance,
        photometric_model=args.photometric
    )

    if args.ref_geotiff:
        import rasterio
        print(f"[*] Performing histogram matching to reference: {args.ref_geotiff}")
        with rasterio.open(args.ref_geotiff) as ref_src:
            ref_data = ref_src.read(1)
        reflectance = PlanetaryImagePipeline.match_sensor_contrast(reflectance, ref_data)

    print("[*] Constructing Lunar CRS & Geotransform")
    crs, transform = PlanetaryImagePipeline.build_geotransform(meta, out_lines, out_samples)

    print(f"[*] Writing GeoTIFF: {args.output}")
    PlanetaryImagePipeline.export_analysis_ready_geotiff(
        reflectance,
        args.output,
        crs,
        transform,
        extra_metadata={
            "INSTRUMENT": meta.instrument_name,
            "PRODUCT_ID": meta.product_id,
            "PHOTOMETRIC_MODEL": args.photometric
        }
    )
    print("[+] Done! The resulting file is ready for downstream computer vision / ML models.")


if __name__ == "__main__":
    main()
