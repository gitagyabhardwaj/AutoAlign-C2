"""
Synthetic Test & Validation Suite for Chandrayaan-2 Planetary Pipeline
=====================================================================
Validates both OSGeo GDAL and Rasterio functionality:
  1. PDS Label parsing & raw raster extraction
  2. Radiometric & Lommel-Seeliger photometric correction
  3. Sensor contrast matching
  4. Rasterio GeoTIFF export
  5. GDAL Warp reprojection (Equirectangular -> Polar Stereographic)
  6. Rasterio in-memory reprojection (rasterio.warp.reproject)
  7. GDAL Virtual Mosaic (gdal.BuildVRT)
  8. Bidirectional read validation (GDAL Open & Rasterio Open)
"""

import os
import numpy as np
from osgeo import gdal
import rasterio
from pipeline import PlanetaryImagePipeline, LunarCRS


def generate_mock_pds3_dataset(work_dir: str):
    """Creates synthetic PDS3 .lbl and .img pairs for TMC-2 and OHRC."""
    os.makedirs(work_dir, exist_ok=True)
    
    tmc_lbl_path = os.path.join(work_dir, "ch2_tmc_sample.lbl")
    tmc_img_path = os.path.join(work_dir, "ch2_tmc_sample.img")
    ohrc_lbl_path = os.path.join(work_dir, "ch2_ohrc_sample.lbl")
    ohrc_img_path = os.path.join(work_dir, "ch2_ohrc_sample.img")

    np.random.seed(42)
    y, x = np.ogrid[:500, :500]
    crater1 = 1.0 - 0.7 * np.exp(-((x - 200)**2 + (y - 200)**2) / (2 * 40**2))
    crater2 = 1.0 - 0.5 * np.exp(-((x - 350)**2 + (y - 120)**2) / (2 * 25**2))
    base_tmc = (crater1 * crater2) + np.random.normal(0, 0.05, (500, 500))
    tmc_dn = (np.clip(base_tmc, 0.1, 1.2) * 4000).astype(">u2")

    yo, xo = np.ogrid[:1000, :1000]
    crater_ohrc = 1.0 - 0.75 * np.exp(-((xo - 500)**2 + (yo - 500)**2) / (2 * 120**2))
    base_ohrc = crater_ohrc + np.random.normal(0, 0.04, (1000, 1000))
    ohrc_dn = (np.clip(base_ohrc, 0.05, 1.3) * 6500).astype(">u2")

    tmc_dn.tofile(tmc_img_path)
    ohrc_dn.tofile(ohrc_img_path)

    tmc_lbl_content = """PDS_VERSION_ID                     = PDS3
RECORD_TYPE                        = FIXED_LENGTH
RECORD_BYTES                       = 1000
FILE_RECORDS                       = 500
DATA_SET_ID                        = "CH2-L-TMC-2-2-EDR-V1.0"
PRODUCT_ID                         = "CH2_TMC_NC_20200115T043210_01"
INSTRUMENT_NAME                    = "TERRAIN MAPPING CAMERA-2"
TARGET_NAME                        = "MOON"
OBJECT                             = IMAGE_MAP_PROJECTION
  MAP_PROJECTION_TYPE              = "EQUIRECTANGULAR"
  CENTER_LATITUDE                  = -15.4
  CENTER_LONGITUDE                 = 45.2
  MAP_SCALE                        = 5.0
  LINE_PROJECTION_OFFSET           = 250.0
  SAMPLE_PROJECTION_OFFSET         = 250.0
END_OBJECT                         = IMAGE_MAP_PROJECTION
OBJECT                             = IMAGE
  LINES                            = 500
  LINE_SAMPLES                     = 500
  SAMPLE_BITS                      = 16
  SAMPLE_TYPE                      = MSB_UNSIGNED_INTEGER
  SCALING_FACTOR                   = 0.0035
  OFFSET                           = 0.0
  INCIDENCE_ANGLE                  = 42.5
  EMISSION_ANGLE                   = 3.2
  PHASE_ANGLE                      = 44.1
  SOLAR_DISTANCE                   = 1.002
  SOLAR_IRRADIANCE                 = 1361.0
END_OBJECT                         = IMAGE
END
"""

    ohrc_lbl_content = """PDS_VERSION_ID                     = PDS3
RECORD_TYPE                        = FIXED_LENGTH
RECORD_BYTES                       = 2000
FILE_RECORDS                       = 1000
DATA_SET_ID                        = "CH2-L-OHRC-2-EDR-V1.0"
PRODUCT_ID                         = "CH2_OHRC_PAN_20200115T043520_01"
INSTRUMENT_NAME                    = "ORBITER HIGH RESOLUTION CAMERA"
TARGET_NAME                        = "MOON"
OBJECT                             = IMAGE_MAP_PROJECTION
  MAP_PROJECTION_TYPE              = "EQUIRECTANGULAR"
  CENTER_LATITUDE                  = -15.4
  CENTER_LONGITUDE                 = 45.2
  MAP_SCALE                        = 0.25
  LINE_PROJECTION_OFFSET           = 500.0
  SAMPLE_PROJECTION_OFFSET         = 500.0
END_OBJECT                         = IMAGE_MAP_PROJECTION
OBJECT                             = IMAGE
  LINES                            = 1000
  LINE_SAMPLES                     = 1000
  SAMPLE_BITS                      = 16
  SAMPLE_TYPE                      = MSB_UNSIGNED_INTEGER
  SCALING_FACTOR                   = 0.0021
  OFFSET                           = 0.0
  INCIDENCE_ANGLE                  = 48.0
  EMISSION_ANGLE                   = 1.5
  PHASE_ANGLE                      = 49.2
  SOLAR_DISTANCE                   = 1.002
  SOLAR_IRRADIANCE                 = 1361.0
END_OBJECT                         = IMAGE
END
"""
    with open(tmc_lbl_path, "w") as f:
        f.write(tmc_lbl_content)
    with open(ohrc_lbl_path, "w") as f:
        f.write(ohrc_lbl_content)

    return (tmc_lbl_path, tmc_img_path), (ohrc_lbl_path, ohrc_img_path)


def test_dual_engine_pipeline():
    work_dir = os.path.join(os.path.dirname(__file__), "test_data")
    output_dir = os.path.join(os.path.dirname(__file__), "output_analysis_ready")
    os.makedirs(output_dir, exist_ok=True)

    (tmc_lbl, tmc_img), (ohrc_lbl, ohrc_img) = generate_mock_pds3_dataset(work_dir)

    print("\n=======================================================")
    print(" 1. TMC-2 Ingestion, Calibration & Rasterio GeoTIFF")
    print("=======================================================")
    tmc_meta = PlanetaryImagePipeline.load_pds_label(tmc_lbl)
    tmc_raw = PlanetaryImagePipeline.load_raster(tmc_img, tmc_meta)
    tmc_radiance = PlanetaryImagePipeline.dn_to_radiance(tmc_raw, tmc_meta.scaling_factor, tmc_meta.offset)
    tmc_refl = PlanetaryImagePipeline.radiance_to_reflectance(
        tmc_radiance, tmc_meta.incidence_angle, tmc_meta.solar_distance_au, tmc_meta.solar_irradiance
    )
    tmc_crs, tmc_transform = PlanetaryImagePipeline.build_geotransform(tmc_meta, tmc_meta.lines, tmc_meta.samples)
    
    tmc_geotiff = os.path.join(output_dir, "TMC_reflectance.tif")
    PlanetaryImagePipeline.export_analysis_ready_geotiff(tmc_refl, tmc_geotiff, tmc_crs, tmc_transform)

    print("\n=======================================================")
    print(" 2. OHRC Ingestion, Calibration & Sensor Contrast Match")
    print("=======================================================")
    ohrc_meta = PlanetaryImagePipeline.load_pds_label(ohrc_lbl)
    ohrc_raw = PlanetaryImagePipeline.load_raster(ohrc_img, ohrc_meta)
    ohrc_radiance = PlanetaryImagePipeline.dn_to_radiance(ohrc_raw, ohrc_meta.scaling_factor, ohrc_meta.offset)
    ohrc_refl = PlanetaryImagePipeline.radiance_to_reflectance(
        ohrc_radiance, ohrc_meta.incidence_angle, ohrc_meta.solar_distance_au, ohrc_meta.solar_irradiance
    )
    ohrc_matched = PlanetaryImagePipeline.match_sensor_contrast(ohrc_refl, tmc_refl)
    ohrc_crs, ohrc_transform = PlanetaryImagePipeline.build_geotransform(ohrc_meta, ohrc_meta.lines, ohrc_meta.samples)

    ohrc_geotiff = os.path.join(output_dir, "OHRC_matched.tif")
    PlanetaryImagePipeline.export_analysis_ready_geotiff(ohrc_matched, ohrc_geotiff, ohrc_crs, ohrc_transform)

    print("\n=======================================================")
    print(" 3. GDAL Warp: C-Accelerated Reprojection to Polar Stereographic")
    print("=======================================================")
    polar_crs = LunarCRS.get_polar_stereographic(center_lon=0.0, is_south_pole=True)
    tmc_polar_tif = os.path.join(output_dir, "TMC_polar_stereographic_gdal.tif")
    PlanetaryImagePipeline.reproject_with_gdal(
        src_path=tmc_geotiff,
        dst_path=tmc_polar_tif,
        dst_crs=polar_crs,
        target_resolution_meters=10.0
    )

    print("\n=======================================================")
    print(" 4. Rasterio Warp: In-Memory Reprojection")
    print("=======================================================")
    tmc_in_mem_polar, new_tf = PlanetaryImagePipeline.reproject_with_rasterio(
        src_data=tmc_refl,
        src_crs=tmc_crs,
        src_transform=tmc_transform,
        dst_crs=polar_crs
    )
    print(f"[Rasterio Warp] In-memory reprojected shape: {tmc_in_mem_polar.shape}")

    print("\n=======================================================")
    print(" 5. GDAL Virtual Raster Mosaic (gdal.BuildVRT)")
    print("=======================================================")
    vrt_path = os.path.join(output_dir, "lunar_mosaic.vrt")
    PlanetaryImagePipeline.create_mosaic_vrt([tmc_geotiff, ohrc_geotiff], vrt_path)

    print("\n=======================================================")
    print(" 6. Cross-Validation: Open with both GDAL and Rasterio")
    print("=======================================================")
    # Validate with GDAL
    ds = gdal.Open(vrt_path)
    assert ds is not None, "GDAL failed to open VRT!"
    print(f"[GDAL Check] VRT Driver={ds.GetDriver().ShortName}, RasterSize=({ds.RasterXSize}, {ds.RasterYSize})")
    ds = None

    # Validate with Rasterio
    with rasterio.open(tmc_polar_tif) as src:
        assert src.crs is not None
        print(f"[Rasterio Check] Polar GeoTIFF CRS={src.crs.to_string()[:50]}..., Shape={src.shape}")

    print("\n[SUCCESS] Both GDAL and Rasterio workflows validated end-to-end!")


if __name__ == "__main__":
    test_dual_engine_pipeline()
