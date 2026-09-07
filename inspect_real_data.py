from osgeo import gdal
import rasterio

xml_path = r"data\raw\20211023\ch2_ohr_nrp_20211023T0027462822_d_img_d18.xml"
img_path = r"data\raw\20211023\ch2_ohr_nrp_20211023T0027462822_d_img_d18.img"

print("--- Testing GDAL on XML label ---")
ds = gdal.Open(xml_path)
if ds:
    print(f"SUCCESS: GDAL opened PDS4 XML!")
    print(f"Driver: {ds.GetDriver().ShortName} ({ds.GetDriver().LongName})")
    print(f"Raster Size: {ds.RasterXSize} samples x {ds.RasterYSize} lines")
    print(f"Bands: {ds.RasterCount}")
    band = ds.GetRasterBand(1)
    print(f"Data type: {gdal.GetDataTypeName(band.DataType)}")
    # Read a small 512x512 window from center without loading 1.1GB into RAM
    center_y = ds.RasterYSize // 2
    center_x = ds.RasterXSize // 2
    sample_window = band.ReadAsArray(center_x, center_y, 512, 512)
    print(f"Sample window shape: {sample_window.shape}, min={sample_window.min()}, max={sample_window.max()}, mean={sample_window.mean():.2f}")
    ds = None
else:
    print("GDAL failed on XML.")

print("\n--- Testing Rasterio on XML label ---")
try:
    with rasterio.open(xml_path) as src:
        print(f"SUCCESS: Rasterio opened PDS4 XML!")
        print(f"Profile: {src.profile}")
        # Read a 512x512 window using Rasterio Window
        from rasterio.windows import Window
        window_data = src.read(1, window=Window(center_x, center_y, 512, 512))
        print(f"Rasterio window data read successfully! Shape={window_data.shape}, mean={window_data.mean():.2f}")
except Exception as e:
    print(f"Rasterio on XML error: {e}")
