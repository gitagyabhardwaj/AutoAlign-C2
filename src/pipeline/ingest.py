import rasterio

def load_dataset(region_path):
    with rasterio.open(f"{region_path}/ohrc.tif") as f:
        ohrc = f.read(1)
        ohrc_meta = f.profile
    with rasterio.open(f"{region_path}/tmc.tif") as f:
        tmc = f.read(1)
        tmc_meta = f.profile
    with rasterio.open(f"{region_path}/iirs.tif") as f:
        iirs = f.read(1)
        iirs_meta = f.profile

    return {
        "ohrc": ohrc, "ohrc_meta": ohrc_meta,
        "tmc": tmc, "tmc_meta": tmc_meta,
        "iirs": iirs, "iirs_meta": iirs_meta
    }
