"""
Chandrayaan-2 Planetary Imagery Processing Pipeline (OHRC / TMC-2 / IIRS)
========================================================================
Dual-Engine Planetary GIS Pipeline leveraging both OSGeo GDAL and Rasterio.

Roles of each library:
  - GDAL (osgeo.gdal):
      * Native planetary drivers (PDS, PDS4, ISIS3) to read labels directly
      * C-accelerated reprojection (gdal.Warp) between Lunar projections
      * Memory-efficient Virtual Rasters (gdal.BuildVRT) for large mosaics
      * Subdataset extraction (gdal.Translate) for IIRS hyperspectral cubes
  - Rasterio:
      * Pythonic NumPy array I/O with context managers
      * In-memory warp (rasterio.warp.reproject)
      * Cloud-Optimized GeoTIFF (COG) profile creation with metadata tags
"""

import os
import math
import numpy as np
import pvl
from osgeo import gdal, osr
import rasterio
from rasterio.transform import from_origin, Affine
from rasterio.crs import CRS
from rasterio.warp import calculate_default_transform, reproject, Resampling
from skimage.exposure import match_histograms

# Configure GDAL to surface exceptions and handle planetary headers
gdal.UseExceptions()


class LunarCRS:
    """
    Standard IAU 2000 Moon Coordinate Reference Systems.
    Lunar mean volumetric radius: R = 1737400.0 meters.
    """
    LUNAR_RADIUS = 1737400.0  # meters

    @classmethod
    def get_equirectangular(cls, center_lon=0.0, center_lat=0.0) -> CRS:
        """Lunar Equirectangular Projection (Plate Carree / Simple Cylindrical)."""
        proj4 = (
            f"+proj=eqc +lat_ts={center_lat} +lat_0={center_lat} +lon_0={center_lon} "
            f"+x_0=0 +y_0=0 +R={cls.LUNAR_RADIUS} +units=m +no_defs"
        )
        return CRS.from_proj4(proj4)

    @classmethod
    def get_polar_stereographic(cls, center_lon=0.0, is_south_pole=True) -> CRS:
        """Lunar Polar Stereographic Projection (used for polar craters e.g. South Pole)."""
        lat_0 = -90.0 if is_south_pole else 90.0
        proj4 = (
            f"+proj=stere +lat_0={lat_0} +lat_ts={lat_0} +lon_0={center_lon} "
            f"+k=1 +x_0=0 +y_0=0 +R={cls.LUNAR_RADIUS} +units=m +no_defs"
        )
        return CRS.from_proj4(proj4)

    @classmethod
    def get_spatial_reference_gdal(cls, center_lon=0.0, center_lat=0.0) -> osr.SpatialReference:
        """Constructs an OSR SpatialReference object for GDAL operations."""
        srs = osr.SpatialReference()
        proj4 = (
            f"+proj=eqc +lat_ts={center_lat} +lat_0={center_lat} +lon_0={center_lon} "
            f"+x_0=0 +y_0=0 +R={cls.LUNAR_RADIUS} +units=m +no_defs"
        )
        srs.ImportFromProj4(proj4)
        return srs


import xml.etree.ElementTree as ET


class PDSMetadata:
    """
    Extracts and standardizes metadata from PDS3 (.lbl) or PDS4 (.xml) labels.
    Handles ISRO Chandrayaan-2 specific keywords for OHRC, TMC-2, and IIRS.
    """
    def __init__(self, label_source, is_pds4: bool = False):
        self.is_pds4 = is_pds4
        if is_pds4:
            self.xml_root = label_source
            self.raw = {}
            self._parse_pds4()
        else:
            self.raw = label_source
            self._parse_pds3()

    def _get_val(self, *keys, default=None):
        for k in keys:
            if k in self.raw:
                return self.raw[k]
            for sub in self.raw.values():
                if isinstance(sub, dict) and k in sub:
                    return sub[k]
        return default

    def _parse_pds3(self):
        # Instrument & Product
        self.instrument_name = str(self._get_val("INSTRUMENT_NAME", "INSTRUMENT_ID", default="UNKNOWN"))
        self.product_id = str(self._get_val("PRODUCT_ID", default="UNKNOWN"))
        
        # Dimensions & Data Format
        self.lines = int(self._get_val("LINES", default=0))
        self.samples = int(self._get_val("LINE_SAMPLES", default=0))
        self.bands = int(self._get_val("BANDS", default=1))
        self.sample_bits = int(self._get_val("SAMPLE_BITS", default=16))
        self.sample_type = str(self._get_val("SAMPLE_TYPE", default="MSB_UNSIGNED_INTEGER"))

        # Calibration & Illumination Parameters
        self.scaling_factor = float(self._get_val("SCALING_FACTOR", "CORE_BASE", default=1.0))
        self.offset = float(self._get_val("OFFSET", "CORE_MULTIPLIER", default=0.0))
        
        # Solar geometry (incidence angle in degrees)
        self.incidence_angle = float(self._get_val("INCIDENCE_ANGLE", "SOLAR_ZENITH_ANGLE", default=30.0))
        self.emission_angle = float(self._get_val("EMISSION_ANGLE", default=0.0))
        self.phase_angle = float(self._get_val("PHASE_ANGLE", default=30.0))
        
        # Solar distance (AU)
        dist = self._get_val("SOLAR_DISTANCE", "SUN_DISTANCE", default=1.0)
        self.solar_distance_au = float(dist) / 149597870.7 if float(dist) > 1000.0 else float(dist)

        # Solar irradiance (W/(m^2 * um))
        self.solar_irradiance = float(self._get_val("SOLAR_IRRADIANCE", "SOLAR_FLUX", default=1361.0))

        # Map Projection & Coordinates
        self.projection_type = str(self._get_val("MAP_PROJECTION_TYPE", default="EQUIRECTANGULAR")).upper()
        self.center_lat = float(self._get_val("CENTER_LATITUDE", "REFERENCE_LATITUDE", default=0.0))
        self.center_lon = float(self._get_val("CENTER_LONGITUDE", "REFERENCE_LONGITUDE", default=0.0))
        self.map_scale = float(self._get_val("MAP_SCALE", "MAP_RESOLUTION", default=1.0))
        
        self.line_offset = float(self._get_val("LINE_PROJECTION_OFFSET", default=0.0))
        self.sample_offset = float(self._get_val("SAMPLE_PROJECTION_OFFSET", default=0.0))

    def _parse_pds4(self):
        tags = {}
        for elem in self.xml_root.iter():
            clean_tag = elem.tag.split("}")[-1]
            if elem.text and elem.text.strip():
                tags[clean_tag] = elem.text.strip()

        self.instrument_name = tags.get("instrument_name", tags.get("title", "OHRC"))
        self.product_id = tags.get("logical_identifier", tags.get("file_name", "UNKNOWN"))

        # Extract axes
        self.lines, self.samples = 0, 0
        for axis in self.xml_root.iter():
            if axis.tag.split("}")[-1] == "Axis_Array":
                name, count = None, 0
                for child in axis:
                    ctag = child.tag.split("}")[-1]
                    if ctag == "axis_name":
                        name = child.text.strip()
                    elif ctag == "elements":
                        count = int(child.text.strip())
                if name == "Line":
                    self.lines = count
                elif name == "Sample":
                    self.samples = count

        self.bands = 1
        data_type = tags.get("data_type", "UnsignedByte")
        if "Byte" in data_type:
            self.sample_bits = 8
            self.sample_type = "MSB_UNSIGNED_INTEGER"
        else:
            self.sample_bits = 16
            self.sample_type = "MSB_UNSIGNED_INTEGER"

        self.scaling_factor = float(tags.get("scaling_factor", 1.0))
        self.offset = float(tags.get("offset", 0.0))
        self.incidence_angle = float(tags.get("solar_incidence", 30.0))
        self.emission_angle = 0.0
        self.phase_angle = float(tags.get("solar_incidence", 30.0))
        self.solar_distance_au = 1.002
        self.solar_irradiance = 1361.0

        proj_str = tags.get("projection", "POLAR STEREOGRAPHIC").upper()
        self.projection_type = proj_str
        self.map_scale = float(tags.get("pixel_resolution", 0.26))
        self.center_lat = float(tags.get("upper_left_latitude", -90.0))
        self.center_lon = float(tags.get("upper_left_longitude", 0.0))
        self.line_offset = 0.0
        self.sample_offset = 0.0


class PlanetaryImagePipeline:
    """
    Complete Ingestion, Radiometric Calibration, Photometric Normalization,
    Reprojection, Mosaicing, and Export Pipeline using GDAL and Rasterio.
    """

    # -------------------------------------------------------------
    # 1. INGESTION (GDAL, Rasterio, and PVL/XML)
    # -------------------------------------------------------------
    @staticmethod
    def load_pds_label(lbl_path: str) -> PDSMetadata:
        """Parses a PDS3 .lbl (via pvl) or PDS4 .xml (via ElementTree)."""
        if not os.path.exists(lbl_path):
            raise FileNotFoundError(f"PDS label not found: {lbl_path}")
        
        if lbl_path.lower().endswith(".xml"):
            tree = ET.parse(lbl_path)
            return PDSMetadata(tree.getroot(), is_pds4=True)
        else:
            lbl_data = pvl.load(lbl_path)
            return PDSMetadata(lbl_data, is_pds4=False)

    @staticmethod
    def load_raster_gdal(file_path: str) -> tuple[np.ndarray, tuple, str]:
        """
        Loads raster directly using GDAL's native PDS / PDS4 / GeoTIFF drivers.
        Returns: (array, geotransform, projection_wkt)
        """
        ds = gdal.Open(file_path, gdal.GA_ReadOnly)
        if ds is None:
            raise RuntimeError(f"GDAL failed to open {file_path}")
        band = ds.GetRasterBand(1)
        data = band.ReadAsArray().astype(np.float32)
        gt = ds.GetGeoTransform()
        proj = ds.GetProjection()
        ds = None
        return data, gt, proj

    @staticmethod
    def load_raster_rasterio(file_path: str) -> tuple[np.ndarray, Affine, CRS]:
        """
        Loads raster using Rasterio.
        Returns: (array, affine_transform, crs)
        """
        with rasterio.open(file_path) as src:
            data = src.read(1).astype(np.float32)
            transform = src.transform
            crs = src.crs
            return data, transform, crs

    @classmethod
    def load_raster(cls, img_path: str, meta: PDSMetadata = None) -> np.ndarray:
        """
        Robust 3-tier raster loader:
          1. Try GDAL native driver (handles PDS/PDS4/GeoTIFF)
          2. Try Rasterio
          3. Fallback: Parse raw binary stream using PVL metadata keywords
        """
        if not os.path.exists(img_path):
            raise FileNotFoundError(f"Raster file not found: {img_path}")

        # Strategy 1: GDAL
        try:
            data, _, _ = cls.load_raster_gdal(img_path)
            return data
        except Exception:
            pass

        # Strategy 2: Rasterio
        try:
            with rasterio.open(img_path) as src:
                return src.read(1).astype(np.float32)
        except Exception:
            pass

        # Strategy 3: Raw Binary Stream Fallback with PVL
        if meta is None:
            raise ValueError("PDSMetadata required for raw binary stream fallback reading.")

        endian = ">" if "MSB" in meta.sample_type else "<"
        if "REAL" in meta.sample_type or meta.sample_type.startswith("IEEE"):
            dtype_code = f"{endian}f{meta.sample_bits // 8}"
        elif "UNSIGNED" in meta.sample_type:
            dtype_code = f"{endian}u{meta.sample_bits // 8}"
        else:
            dtype_code = f"{endian}i{meta.sample_bits // 8}"

        expected_pixels = meta.lines * meta.samples
        byte_size = (meta.sample_bits // 8) * expected_pixels
        file_size = os.path.getsize(img_path)
        header_offset = file_size - byte_size if file_size > byte_size else 0

        with open(img_path, "rb") as f:
            if header_offset > 0:
                f.seek(header_offset)
            raw_data = np.fromfile(f, dtype=np.dtype(dtype_code), count=expected_pixels)
            return raw_data.reshape((meta.lines, meta.samples)).astype(np.float32)

    # -------------------------------------------------------------
    # 2. RADIOMETRIC & PHOTOMETRIC CORRECTION (NumPy)
    # -------------------------------------------------------------
    @staticmethod
    def dn_to_radiance(dn: np.ndarray, scale: float = 1.0, offset: float = 0.0) -> np.ndarray:
        """Converts Raw DN to Physical Radiance (W / (m^2 * sr * um))."""
        valid_mask = dn > 0
        radiance = np.zeros_like(dn, dtype=np.float32)
        radiance[valid_mask] = (dn[valid_mask] * scale) + offset
        return np.maximum(radiance, 0.0)

    @staticmethod
    def radiance_to_reflectance(
        radiance: np.ndarray,
        incidence_angle_deg: float,
        solar_distance_au: float = 1.0,
        solar_irradiance: float = 1361.0,
        photometric_model: str = "lommel_seeliger"
    ) -> np.ndarray:
        """
        Converts Radiance to Bidirectional Reflectance (I/F) with Lommel-Seeliger
        photometric normalization for lunar particulate regolith.
        """
        inc_rad = math.radians(min(incidence_angle_deg, 85.0))
        cos_i = max(math.cos(inc_rad), 0.087)

        scale = (math.pi * (solar_distance_au ** 2)) / (solar_irradiance * cos_i)
        reflectance = radiance * scale

        if photometric_model.lower() == "lommel_seeliger":
            standard_inc = math.cos(math.radians(30.0))
            lommel_factor = standard_inc / (standard_inc + 1.0)
            cur_lommel = cos_i / (cos_i + 1.0)
            reflectance = reflectance * (lommel_factor / max(cur_lommel, 1e-4))

        return np.clip(reflectance, 0.0, 1.0)

    # -------------------------------------------------------------
    # 3. CROSS-SENSOR NORMALIZATION (scikit-image)
    # -------------------------------------------------------------
    @staticmethod
    def match_sensor_contrast(target: np.ndarray, reference: np.ndarray, nodata: float = 0.0) -> np.ndarray:
        """Matches cumulative histograms between different instruments (e.g. OHRC & TMC-2)."""
        target_valid = target[target > nodata]
        ref_valid = reference[reference > nodata]
        if len(target_valid) == 0 or len(ref_valid) == 0:
            return target
        matched = match_histograms(target, reference)
        matched[target <= nodata] = nodata
        return matched

    # -------------------------------------------------------------
    # 4. REPROJECTION & GEOREFERENCING (GDAL Warp & Rasterio Warp)
    # -------------------------------------------------------------
    @staticmethod
    def build_geotransform(meta: PDSMetadata, height: int, width: int) -> tuple[CRS, Affine]:
        """Constructs Lunar Affine Geotransform and CRS from PDS label."""
        if "POLAR" in meta.projection_type or "STEREOGRAPHIC" in meta.projection_type:
            is_south = meta.center_lat < 0
            crs = LunarCRS.get_polar_stereographic(center_lon=meta.center_lon, is_south_pole=is_south)
        else:
            crs = LunarCRS.get_equirectangular(center_lon=meta.center_lon, center_lat=meta.center_lat)

        res = meta.map_scale if meta.map_scale > 0 else 1.0
        ul_x = -meta.sample_offset * res if meta.sample_offset != 0 else 0.0
        ul_y = meta.line_offset * res if meta.line_offset != 0 else height * res

        transform = from_origin(ul_x, ul_y, res, res)
        return crs, transform

    @staticmethod
    def reproject_with_gdal(
        src_path: str,
        dst_path: str,
        dst_crs: CRS,
        target_resolution_meters: float = None,
        resample_alg: str = "bilinear"
    ):
        """
        Reprojects a raster file using GDAL Warp (C-accelerated, disk-to-disk).
        Ideal for large planetary datasets and full swath transformations.
        """
        alg_map = {
            "nearest": gdal.GRA_NearestNeighbour,
            "bilinear": gdal.GRA_Bilinear,
            "cubic": gdal.GRA_Cubic,
            "lanczos": gdal.GRA_Lanczos
        }
        resample = alg_map.get(resample_alg.lower(), gdal.GRA_Bilinear)

        warp_options = {
            "dstSRS": dst_crs.to_proj4(),
            "resampleAlg": resample,
            "format": "GTiff",
            "creationOptions": ["COMPRESS=DEFLATE", "TILED=YES"]
        }
        if target_resolution_meters:
            warp_options["xRes"] = target_resolution_meters
            warp_options["yRes"] = target_resolution_meters

        gdal.Warp(dst_path, src_path, **warp_options)
        print(f"[GDAL Warp] Reprojected '{src_path}' -> '{dst_path}'")

    @staticmethod
    def reproject_with_rasterio(
        src_data: np.ndarray,
        src_crs: CRS,
        src_transform: Affine,
        dst_crs: CRS,
        resampling: Resampling = Resampling.bilinear
    ) -> tuple[np.ndarray, Affine]:
        """
        Reprojects an in-memory NumPy array using Rasterio Warp.
        Returns: (reprojected_array, new_transform)
        """
        height, width = src_data.shape
        dst_transform, dst_width, dst_height = calculate_default_transform(
            src_crs, dst_crs, width, height, *rasterio.transform.array_bounds(height, width, src_transform)
        )
        dst_data = np.zeros((dst_height, dst_width), dtype=src_data.dtype)

        reproject(
            source=src_data,
            destination=dst_data,
            src_transform=src_transform,
            src_crs=src_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=resampling
        )
        return dst_data, dst_transform

    # -------------------------------------------------------------
    # 5. MOSAICING & VIRTUAL RASTERS (GDAL BuildVRT)
    # -------------------------------------------------------------
    @staticmethod
    def create_mosaic_vrt(input_geotiffs: list[str], output_vrt_path: str):
        """
        Builds a zero-RAM GDAL Virtual Raster (VRT) mosaic connecting multiple tiles.
        Downstream teams can open the resulting .vrt with Rasterio without duplicating data.
        """
        vrt_options = gdal.BuildVRTOptions(resampleAlg="bilinear", addAlpha=True)
        gdal.BuildVRT(output_vrt_path, input_geotiffs, options=vrt_options)
        print(f"[GDAL VRT] Created Virtual Mosaic: {output_vrt_path} ({len(input_geotiffs)} tiles)")

    # -------------------------------------------------------------
    # 6. EXPORT (Rasterio Analysis-Ready GeoTIFF / COG)
    # -------------------------------------------------------------
    @classmethod
    def export_analysis_ready_geotiff(
        cls,
        data: np.ndarray,
        output_path: str,
        crs: CRS,
        transform: Affine,
        nodata: float = 0.0,
        extra_metadata: dict = None
    ):
        """
        Exports clean Cloud-Optimized GeoTIFF with full Lunar georeferencing
        and custom metadata tags using Rasterio.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        height, width = data.shape

        profile = {
            "driver": "GTiff",
            "height": height,
            "width": width,
            "count": 1,
            "dtype": rasterio.float32,
            "crs": crs,
            "transform": transform,
            "nodata": nodata,
            "compress": "deflate",
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256,
        }

        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(data.astype(np.float32), 1)
            if extra_metadata:
                dst.update_tags(**{str(k): str(v) for k, v in extra_metadata.items()})

        print(f"[Rasterio Export] Analysis-Ready GeoTIFF -> {output_path}")
        print(f"                  Dimensions: {width}x{height} | Res: {transform.a:.2f} m/px")
