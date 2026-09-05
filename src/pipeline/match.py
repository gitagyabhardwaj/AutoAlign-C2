import torch
import kornia
import numpy as np
import warnings

# Suppress annoying JIT warnings from PyTorch inside hackathon logs
warnings.filterwarnings("ignore", category=FutureWarning)

# --- Configuration Constants ---
# Minimum confidence score to accept a match (0.0 to 1.0).
# Matches below this are likely false positives — RANSAC will struggle with them.
CONFIDENCE_THRESHOLD = 0.2

# Minimum number of matches required after filtering.
# Homography estimation needs at least 4, but fewer than 10 is unreliable in practice.
MIN_MATCH_COUNT = 10


class LunarMatcher:
    """
    Core ML matching engine for AutoAlign-C2.
    Uses pre-trained LoFTR to extract geometric keypoints across modalities.
    Implemented as a class to cache the model in memory (prevents reloading 100MB every run).
    """
    def __init__(self, confidence_threshold: float = CONFIDENCE_THRESHOLD):
        # Hardware Routing
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.confidence_threshold = confidence_threshold
        print(f"[ML Engine] Initializing LoFTR on {self.device.type.upper()}...")
        print(f"[ML Engine] Confidence threshold: {self.confidence_threshold}")

        # Model Caching
        self.matcher = kornia.feature.LoFTR(pretrained='outdoor').to(self.device)
        self.matcher.eval()  # Lock model in inference mode (no training)

    def _prepare_tensor(self, img_array: np.ndarray) -> torch.Tensor:
        """Validates and converts a 2D numpy array into a LoFTR-ready tensor."""
        # Data Type Handling & Validation
        if len(img_array.shape) != 2:
            raise ValueError(
                f"ML Matcher expected 2D grayscale image, got shape {img_array.shape}. "
                "Convert RGB to grayscale with cv2.cvtColor(img, cv2.COLOR_BGR2GRAY). "
                "For IIRS multi-band: average bands with np.mean(cube, axis=2)."
            )

        # Tensor Wrangling: add Batch(B) and Channel(C) dims -> (1, 1, H, W)
        tensor = torch.from_numpy(img_array).float().unsqueeze(0).unsqueeze(0)

        # Normalize to [0, 1] range (kornia requirement)
        if tensor.max() > 1.0:
            tensor = tensor / 255.0

        return tensor.to(self.device)

    def get_keypoint_matches(self, img1_array: np.ndarray, img2_array: np.ndarray) -> dict:
        """
        Main entry point for the pipeline.
        Takes two grayscale numpy arrays, runs LoFTR inference, filters low-confidence
        matches, validates the count, and returns clean coordinate arrays.

        Args:
            img1_array: 2D uint8 numpy array — source image (or its edge map)
            img2_array: 2D uint8 numpy array — target image (or its edge map)

        Returns:
            dict with keys:
                "src_pts"           np.ndarray shape (N, 2) — filtered x,y coords in img1
                "dst_pts"           np.ndarray shape (N, 2) — filtered x,y coords in img2
                "confidence"        np.ndarray shape (N,)   — confidence scores [0, 1]
                "total_raw"         int — total matches before filtering
                "total_filtered"    int — matches kept after confidence filtering
                "avg_confidence"    float — mean confidence of kept matches

        Raises:
            RuntimeError: If fewer than MIN_MATCH_COUNT matches survive filtering.
                          Caller (Streamlit UI) should catch this and show an error banner.
        """
        tensor1 = self._prepare_tensor(img1_array)
        tensor2 = self._prepare_tensor(img2_array)

        # Run Inference (Zero-shot, no gradients needed)
        with torch.no_grad():
            matches = self.matcher({"image0": tensor1, "image1": tensor2})

        # Extract raw outputs from GPU -> CPU -> numpy
        src_pts_raw   = matches['keypoints0'].cpu().numpy()
        dst_pts_raw   = matches['keypoints1'].cpu().numpy()
        confidence_raw = matches['confidence'].cpu().numpy()

        total_raw = len(src_pts_raw)

        # --- Phase 4: Confidence Filtering ---
        # Keep only matches where the model is sufficiently certain
        keep_mask = confidence_raw >= self.confidence_threshold
        src_pts   = src_pts_raw[keep_mask]
        dst_pts   = dst_pts_raw[keep_mask]
        confidence = confidence_raw[keep_mask]

        total_filtered = len(src_pts)

        # --- Failure Guard ---
        # If too few matches survive, RANSAC will produce garbage or crash entirely.
        # Raise a clean, human-readable error so the UI can display a failure banner.
        if total_filtered < MIN_MATCH_COUNT:
            raise RuntimeError(
                f"Registration Failed: Only {total_filtered} high-confidence matches found "
                f"after filtering (minimum required: {MIN_MATCH_COUNT}). "
                f"Try applying the modality bridge (apply_modality_bridge) before matching, "
                f"or lower CONFIDENCE_THRESHOLD in match.py."
            )

        avg_confidence = float(confidence.mean())

        return {
            "src_pts":        src_pts,
            "dst_pts":        dst_pts,
            "confidence":     confidence,
            "total_raw":      total_raw,
            "total_filtered": total_filtered,
            "avg_confidence": avg_confidence,
        }


# Singleton instance — import this directly in the rest of the pipeline
# e.g., from src.pipeline.match import ml_engine
ml_engine = LunarMatcher()

