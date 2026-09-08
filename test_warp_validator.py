"""
Unit Tests for Role 4 Warp, Transform & Validation Pipeline
"""

import pytest
import numpy as np
import cv2

try:
    from warp_validator import WarpValidator, warp_and_validate, WarpResult
except ImportError:
    from src.pipeline.warp_validator import WarpValidator, warp_and_validate, WarpResult


@pytest.fixture
def sample_images():
    """Create sample source and destination synthetic images (200x200 BGR)."""
    src_img = np.zeros((200, 200, 3), dtype=np.uint8)
    # Draw a rectangle and circle on source
    cv2.rectangle(src_img, (30, 30), (150, 150), (0, 255, 0), -1)
    cv2.circle(src_img, (100, 100), 20, (0, 0, 255), -1)

    dst_img = np.zeros((200, 200, 3), dtype=np.uint8)
    return src_img, dst_img


def test_input_normalization():
    validator = WarpValidator()

    # Test (N, 2) array
    pts_2d = np.array([[10, 20], [30, 40], [50, 60], [70, 80]], dtype=np.float32)
    norm_2d = validator.normalize_points(pts_2d)
    assert norm_2d.shape == (4, 1, 2)

    # Test (N, 1, 2) array
    pts_3d = pts_2d.reshape(-1, 1, 2)
    norm_3d = validator.normalize_points(pts_3d)
    assert norm_3d.shape == (4, 1, 2)

    # Test invalid shape
    with pytest.raises(ValueError):
        validator.normalize_points(np.zeros((4, 4)))


def test_synthetic_homography_pass(sample_images):
    src_img, dst_img = sample_images
    validator = WarpValidator()

    # Define a known Homography (Translation + Rotation + Perspective)
    H_gt = np.array([
        [1.05, 0.05, 10.0],
        [-0.02, 0.98, 15.0],
        [0.0001, -0.0001, 1.0]
    ], dtype=np.float32)

    # Generate 50 random source points
    np.random.seed(42)
    src_pts = np.random.uniform(20, 180, (50, 1, 2)).astype(np.float32)

    # Map destination points using exact ground truth H
    dst_pts = cv2.perspectiveTransform(src_pts, H_gt)

    result = validator.process(src_img, dst_img, src_pts, dst_pts, model="homography")

    assert result.status == "PASS"
    assert result.rmse < 0.1  # Sub-pixel accuracy < 0.1 px for exact points
    assert result.inlier_count == 50
    assert result.inlier_ratio == 1.0
    assert result.matrix is not None
    assert result.warped.shape == dst_img.shape
    assert result.overlay.shape == dst_img.shape


def test_synthetic_affine_pass(sample_images):
    src_img, dst_img = sample_images
    validator = WarpValidator()

    # Define a known Affine matrix (Scale + Rotation + Translation)
    theta = np.radians(15)
    cos_t, sin_t = np.cos(theta), np.sin(theta)
    M_gt = np.array([
        [1.1 * cos_t, -1.1 * sin_t, 12.0],
        [1.1 * sin_t,  1.1 * cos_t, 8.0]
    ], dtype=np.float32)

    np.random.seed(42)
    src_pts = np.random.uniform(20, 180, (40, 1, 2)).astype(np.float32)
    dst_pts = cv2.transform(src_pts, M_gt)

    result = validator.process(src_img, dst_img, src_pts, dst_pts, model="affine")

    assert result.status == "PASS"
    assert result.rmse < 0.1
    assert result.inlier_count == 40
    assert result.matrix.shape == (2, 3)


def test_ransac_outlier_filtering(sample_images):
    src_img, dst_img = sample_images
    validator = WarpValidator()

    H_gt = np.array([
        [1.0, 0.0, 5.0],
        [0.0, 1.0, 10.0],
        [0.0, 0.0, 1.0]
    ], dtype=np.float32)

    np.random.seed(123)
    src_pts = np.random.uniform(20, 180, (60, 1, 2)).astype(np.float32)
    dst_pts = cv2.perspectiveTransform(src_pts, H_gt)

    # Inject 15 bad outliers (25% corruption)
    outlier_indices = [5, 12, 19, 23, 29, 33, 38, 41, 45, 49, 52, 54, 56, 57, 59]
    dst_pts[outlier_indices] += np.random.uniform(50, 100, (len(outlier_indices), 1, 2)).astype(np.float32)

    result = validator.process(src_img, dst_img, src_pts, dst_pts, model="homography", ransac_reproj_thresh=3.0)

    assert result.status == "PASS"
    assert result.inlier_count >= 40  # Should successfully reject outliers
    assert result.inlier_ratio < 1.0
    assert result.rmse < 1.0  # Inlier RMSE should remain sub-pixel


def test_degenerate_matrix_detection(sample_images):
    src_img, dst_img = sample_images
    validator = WarpValidator()

    # Collinear points cause degenerate homography estimation
    src_pts = np.array([[[10, 10]], [[20, 20]], [[30, 30]], [[40, 40]]], dtype=np.float32)
    dst_pts = np.array([[[15, 10]], [[25, 20]], [[35, 30]], [[45, 40]]], dtype=np.float32)

    result = validator.process(src_img, dst_img, src_pts, dst_pts, model="homography")
    assert result.status == "FAIL"


def test_functional_entry_point(sample_images):
    src_img, dst_img = sample_images
    src_pts = np.array([[10, 10], [100, 10], [100, 100], [10, 100]], dtype=np.float32)
    dst_pts = np.array([[12, 12], [102, 11], [101, 102], [11, 101]], dtype=np.float32)

    res_dict = warp_and_validate(src_img, dst_img, src_pts, dst_pts, model="homography")
    assert isinstance(res_dict, dict)
    assert "H" in res_dict
    assert "rmse" in res_dict
    assert "status" in res_dict
    assert res_dict["status"] in ["PASS", "WARN", "FAIL"]


if __name__ == "__main__":
    pytest.main(["-v", __file__])
