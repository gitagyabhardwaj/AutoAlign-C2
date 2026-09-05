"""
Phase 3 Test: Cross-Modal Hack Verification

Simulates the TMC-to-IIRS modality gap by:
  - Creating an "optical" image (normal crater terrain)
  - Creating a "spectral" image (same craters, but with inverted brightness + added noise)
    This simulates how hyperspectral data looks completely different from optical.

Then:
  1. Feeds raw images into LoFTR (expected to fail or find very few matches)
  2. Feeds edge-extracted images into LoFTR (expected to find solid matches)
  3. Saves a side-by-side visual comparison
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import cv2
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from src.pipeline.preprocess import apply_modality_bridge, normalize
from src.pipeline.match import ml_engine


def create_optical_image() -> np.ndarray:
    """Simulates an optical (OHRC/TMC-style) grayscale image."""
    base = np.random.randint(50, 100, (256, 256), dtype=np.uint8)
    cv2.circle(base, (80, 80), 25, 200, -1)
    cv2.circle(base, (80, 80), 18, 40, -1)
    cv2.circle(base, (180, 160), 35, 220, -1)
    cv2.circle(base, (180, 160), 28, 30, -1)
    cv2.circle(base, (130, 50), 12, 190, -1)
    cv2.circle(base, (130, 50), 8, 60, -1)
    base = cv2.GaussianBlur(base, (3, 3), 0)
    return base


def create_spectral_image(optical: np.ndarray) -> np.ndarray:
    """
    Simulates a spectral (IIRS-style) image of the same terrain.
    Key differences to simulate the modality gap:
      - Inverted brightness (mineral reflectance vs sunlight shadow)
      - Heavy sensor noise (IIRS has lower SNR than OHRC)
      - Slight spatial shift (telemetry error)
    """
    # Invert brightness — what's bright in optical may be dark in spectral
    spectral = 255 - optical

    # Add heavy sensor noise (IIRS is much noisier than optical cameras)
    noise = np.random.randint(0, 60, spectral.shape, dtype=np.uint8)
    spectral = cv2.add(spectral, noise)

    # Slight spatial shift to simulate telemetry offset
    M = np.float32([[1, 0, 15], [0, 1, 10]])
    spectral = cv2.warpAffine(spectral, M, (spectral.shape[1], spectral.shape[0]))

    return spectral


def test_raw_matching(optical, spectral):
    """Direct matching without the modality bridge."""
    print("\n[TEST A] Raw Matching (No modality bridge)")
    result = ml_engine.get_keypoint_matches(optical, spectral)
    n = len(result["src_pts"])
    avg_conf = result["confidence"].mean() if n > 0 else 0.0
    print(f"  → Found {n} matches | Avg Confidence: {avg_conf:.3f}")
    return result


def test_edge_matching(optical, spectral):
    """Matching after applying the modality bridge to both images."""
    print("\n[TEST B] Edge Map Matching (With modality bridge)")
    edge_optical = apply_modality_bridge(optical, mode="auto")
    edge_spectral = apply_modality_bridge(spectral, mode="auto")
    result = ml_engine.get_keypoint_matches(edge_optical, edge_spectral)
    n = len(result["src_pts"])
    avg_conf = result["confidence"].mean() if n > 0 else 0.0
    print(f"  → Found {n} matches | Avg Confidence: {avg_conf:.3f}")
    return result, edge_optical, edge_spectral


def save_visual(optical, spectral, edge_opt, edge_spec):
    """Saves a 2x2 grid showing: raw images and their edge maps."""
    # Normalize edge maps for display
    grid_top = np.hstack([optical, spectral])
    grid_bot = np.hstack([edge_opt, edge_spec])
    grid = np.vstack([grid_top, grid_bot])

    # Add labels
    cv2.putText(grid, "Optical (Raw)",        (5,  15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)
    cv2.putText(grid, "Spectral (Raw)",       (261, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)
    cv2.putText(grid, "Optical (Edge Map)",   (5,  271), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)
    cv2.putText(grid, "Spectral (Edge Map)",  (261, 271), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)

    cv2.imwrite("phase3_modality_bridge_test.jpg", grid)
    print("\n[SAVED] Visual comparison saved as phase3_modality_bridge_test.jpg")


def main():
    print("=== AUTOALIGN-C2 : PHASE 3 — CROSS-MODAL HACK TEST ===")

    # Generate synthetic multi-modal pair
    optical  = create_optical_image()
    spectral = create_spectral_image(optical)

    # TEST A: Raw (should be bad)
    result_raw = test_raw_matching(optical, spectral)

    # TEST B: Edge-extracted (should be much better)
    result_edge, edge_opt, edge_spec = test_edge_matching(optical, spectral)

    # Summary
    print("\n=== RESULTS SUMMARY ===")
    raw_n  = len(result_raw["src_pts"])
    edge_n = len(result_edge["src_pts"])

    print(f"Raw Matches:       {raw_n}")
    print(f"Edge-Map Matches:  {edge_n}")

    if edge_n > raw_n:
        improvement = ((edge_n - raw_n) / max(raw_n, 1)) * 100
        print(f"Modality Bridge improvement: +{improvement:.1f}% more matches found!")
    else:
        print("Note: Edge map matched fewer or equal — may need threshold tuning on real data.")

    save_visual(optical, spectral, edge_opt, edge_spec)


if __name__ == "__main__":
    main()
