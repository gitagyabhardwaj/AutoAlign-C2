import math
import cv2
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage.transform import resize
from rasterio.transform import Affine

def downsample_to_resolution(image, profile, source_res_m, target_res_m):
    scale_factor = target_res_m / source_res_m
    n_pyramid_steps = int(math.floor(math.log2(scale_factor)))
    remaining_factor = scale_factor / (2 ** n_pyramid_steps)

    current = image.astype(np.float64)
    sigma = 1.0

    for step in range(n_pyramid_steps):
        blurred = gaussian_filter(current, sigma=sigma)
        new_shape = (blurred.shape[0] // 2, blurred.shape[1] // 2)
        current = resize(blurred, new_shape, anti_aliasing=False, preserve_range=True)

    if not np.isclose(remaining_factor, 1.0, atol=1e-3):
        final_shape = (
            int(round(current.shape[0] / remaining_factor)),
            int(round(current.shape[1] / remaining_factor)),
        )
        current = resize(current, final_shape, anti_aliasing=True, preserve_range=True)

    new_profile = profile.copy()
    old_transform = profile["transform"]
    actual_scale_y = image.shape[0] / current.shape[0]
    actual_scale_x = image.shape[1] / current.shape[1]

    new_transform = old_transform * Affine.scale(actual_scale_x, actual_scale_y)
    new_profile.update({
        "height": current.shape[0],
        "width": current.shape[1],
        "transform": new_transform,
        "dtype": "float64",
    })

    return current, new_profile

def normalize_independently(image, method="zscore"):
    if method == "zscore":
        mean, std = np.mean(image), np.std(image)
        return (image - mean) / (std + 1e-8)
    elif method == "minmax":
        lo, hi = np.min(image), np.max(image)
        return (image - lo) / (hi - lo + 1e-8)
    else:
        raise ValueError(f"Unknown method: {method}")

def extract_canny_edges(image, low_thresh=50, high_thresh=150):
    norm = cv2.normalize(image, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    img_8u = norm.astype(np.uint8)
    return cv2.Canny(img_8u, low_thresh, high_thresh)
