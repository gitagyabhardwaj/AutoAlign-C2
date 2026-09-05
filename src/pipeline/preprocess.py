import cv2
import numpy as np


def downsample(img_array: np.ndarray, source_res_m: float, target_res_m: float) -> np.ndarray:
    """
    Downsamples an image from its native resolution to a target resolution.
    Uses Gaussian blur BEFORE resizing to prevent aliasing artifacts.

    Args:
        img_array:      2D numpy array (grayscale)
        source_res_m:   Native resolution in meters/pixel (e.g., 0.25 for OHRC)
        target_res_m:   Target resolution in meters/pixel (e.g., 5.0 for TMC)

    Returns:
        Downsampled 2D numpy array
    """
    scale_factor = source_res_m / target_res_m
    if scale_factor >= 1.0:
        # Already at or coarser than target resolution, nothing to do
        return img_array

    # Determine Gaussian kernel size based on the downsample ratio
    # Rule of thumb: kernel = 2 * floor(scale_factor * 3) + 1 (must be odd)
    k = max(3, int(2 * np.floor(1 / scale_factor * 1.5) + 1))
    if k % 2 == 0:
        k += 1

    blurred = cv2.GaussianBlur(img_array, (k, k), 0)

    new_h = int(img_array.shape[0] * scale_factor)
    new_w = int(img_array.shape[1] * scale_factor)

    downsampled = cv2.resize(blurred, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return downsampled


def normalize(img_array: np.ndarray) -> np.ndarray:
    """
    Z-score normalizes a single image independently.
    Each image is normalized on its own values — NEVER matched to another image.
    This is different from histogram matching, which destroys spectral data.

    Returns:
        Float32 array scaled to [0, 255] uint8 range
    """
    img = img_array.astype(np.float32)
    mean = img.mean()
    std = img.std()

    if std < 1e-6:
        # Flat image (e.g., all-black IIRS region), return zeros safely
        return np.zeros_like(img_array, dtype=np.uint8)

    normalized = (img - mean) / std
    # Clip to ±3 standard deviations and rescale to [0, 255]
    normalized = np.clip(normalized, -3, 3)
    normalized = ((normalized + 3) / 6.0 * 255).astype(np.uint8)
    return normalized


def apply_modality_bridge(img_array: np.ndarray, mode: str = "auto") -> np.ndarray:
    """
    THE CROSS-MODAL HACK — The core of Bridge 2 (TMC -> IIRS).

    Strips away sensor-specific brightness, color, and spectral values.
    Leaves behind only structural terrain geometry (crater rims, ridges, edges).
    This lets LoFTR match images from completely different sensors on pure geometry.

    Strategy:
        1. Normalize (eliminate brightness/contrast differences between sensors)
        2. Canny Edge Detection (structural edges only)
        3. Dilate edges (thicken lines so LoFTR's patch-based attention can latch on)

    Args:
        img_array:  2D numpy array (grayscale or band-averaged hyperspectral)
        mode:       "auto"      — auto-compute Canny thresholds using Otsu's method
                    "sensitive" — lower thresholds, captures faint/subtle edges
                    "sharp"     — higher thresholds, captures only dominant features

    Returns:
        2D uint8 numpy array of edge map (same spatial dimensions as input)
    """
    if len(img_array.shape) != 2:
        raise ValueError(
            f"apply_modality_bridge expects a 2D array, got shape {img_array.shape}. "
            "For IIRS multi-band: average bands first using `np.mean(iirs_cube, axis=2)`."
        )

    # Step 1: Normalize independently
    img_normalized = normalize(img_array)

    # Step 2: Gentle blur before Canny to suppress noise speckle
    # (crucial for IIRS which has much more sensor noise than OHRC)
    img_blurred = cv2.GaussianBlur(img_normalized, (5, 5), 1.5)

    # Step 3: Compute Canny thresholds
    if mode == "auto":
        # Otsu's method: finds the optimal threshold based on image histogram
        otsu_thresh, _ = cv2.threshold(img_blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        low = otsu_thresh * 0.5
        high = otsu_thresh
    elif mode == "sensitive":
        # Lower thresholds — catches faint structural features in IIRS
        low, high = 20, 60
    elif mode == "sharp":
        # Higher thresholds — only dominant crater rims
        low, high = 80, 200
    else:
        raise ValueError(f"Unknown mode '{mode}'. Choose from: 'auto', 'sensitive', 'sharp'.")

    edges = cv2.Canny(img_blurred, low, high)

    # Step 4: Dilate edges to thicken them
    # LoFTR works on 8x8 patches. A single-pixel edge vanishes in a patch.
    # Dilation makes edges thick enough for the attention mechanism to detect.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges_dilated = cv2.dilate(edges, kernel, iterations=2)

    return edges_dilated
