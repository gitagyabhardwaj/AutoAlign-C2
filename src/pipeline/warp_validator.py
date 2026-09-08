"""
Role 4 — Warp, Transform & Validation Pipeline
===============================================
Production-ready Python implementation for estimating transformations (Homography / Affine),
warping source images, validating sub-pixel RMSE accuracy, and generating visual alignment overlays.
"""

from dataclasses import dataclass
from typing import Dict, Tuple, Union, Optional, Any
import numpy as np
import cv2


@dataclass
class WarpResult:
    """Encapsulates the complete outputs and validation status of Role 4 pipeline."""
    matrix: Optional[np.ndarray]           # 3x3 for Homography, 2x3 for Affine
    warped: Optional[np.ndarray]           # Warped source image
    overlay: Optional[np.ndarray]          # Translucent overlay check image
    rmse: float                            # Sub-pixel RMSE error on inliers (px)
    max_error: float                       # Maximum reprojection error on inliers (px)
    inlier_ratio: float                    # Fraction of RANSAC inliers (0.0 to 1.0)
    inlier_count: int                      # Total RANSAC inliers count
    status: str                            # "PASS", "WARN", or "FAIL"
    message: str                           # Detailed diagnostic message


class WarpValidator:
    """
    Role 4 Warp, Transform & Validation Pipeline Processor.
    """

    def __init__(
        self,
        rmse_pass_thresh: float = 3.0,
        rmse_warn_thresh: float = 5.0,
        min_inlier_ratio: float = 0.3,
        min_inlier_count: int = 10,
        min_det_thresh: float = 1e-6
    ):
        self.rmse_pass_thresh = rmse_pass_thresh
        self.rmse_warn_thresh = rmse_warn_thresh
        self.min_inlier_ratio = min_inlier_ratio
        self.min_inlier_count = min_inlier_count
        self.min_det_thresh = min_det_thresh

    def normalize_points(self, pts: np.ndarray) -> np.ndarray:
        """
        Step 1: Confirm and normalize keypoints array shape to (N, 1, 2) float32.
        Accepts shapes: (N, 2), (N, 1, 2), or List of coordinates/KeyPoints.
        """
        if pts is None or len(pts) == 0:
            raise ValueError("Input points array is empty or None")

        pts_arr = np.asarray(pts, dtype=np.float32)

        if pts_arr.ndim == 2 and pts_arr.shape[1] == 2:
            pts_arr = pts_arr.reshape(-1, 1, 2)
        elif pts_arr.ndim == 3 and pts_arr.shape[1] == 1 and pts_arr.shape[2] == 2:
            pass
        else:
            raise ValueError(
                f"Invalid point array shape {pts_arr.shape}. Expected (N, 2) or (N, 1, 2)."
            )

        return pts_arr

    def sanity_check_matrix(
        self,
        matrix: np.ndarray,
        model: str = "homography"
    ) -> Tuple[bool, str]:
        """
        Step 4: Verify transform matrix isn't degenerate (singular, NaN, or non-plausible scale).
        """
        if matrix is None:
            return False, "Transform matrix estimation produced None"

        if not np.all(np.isfinite(matrix)):
            return False, "Transform matrix contains NaN or Inf values"

        # Extract 2x2 linear scale/rotation component
        linear_part = matrix[0:2, 0:2]
        det = float(linear_part[0, 0] * linear_part[1, 1] - linear_part[0, 1] * linear_part[1, 0])

        if abs(det) < self.min_det_thresh:
            return False, f"Near-singular transform matrix (determinant = {det:.2e} < {self.min_det_thresh:.2e})"

        # Plausibility check on scale change (0.01x to 100x range)
        scale_approx = np.sqrt(abs(det))
        if scale_approx < 0.01 or scale_approx > 100.0:
            return False, f"Implausible scale transformation factor ({scale_approx:.2f}x)"

        return True, f"Matrix valid (Determinant = {det:.4f})"

    def estimate_transform(
        self,
        src_pts: np.ndarray,
        dst_pts: np.ndarray,
        model: str = "homography",
        ransac_reproj_thresh: float = 5.0
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Step 2 & 3: Estimate Homography or Affine transform using RANSAC.
        """
        min_pts_required = 4 if model == "homography" else 3
        if len(src_pts) < min_pts_required:
            return None, None

        if model == "homography":
            matrix, mask = cv2.findHomography(
                src_pts,
                dst_pts,
                method=cv2.RANSAC,
                ransacReprojThreshold=ransac_reproj_thresh
            )
        elif model == "affine":
            matrix, mask = cv2.estimateAffine2D(
                src_pts,
                dst_pts,
                method=cv2.RANSAC,
                ransacReprojThreshold=ransac_reproj_thresh
            )
        else:
            raise ValueError(f"Unknown transform model: '{model}'. Choose 'homography' or 'affine'.")

        return matrix, mask

    def compute_subpixel_rmse(
        self,
        src_pts: np.ndarray,
        dst_pts: np.ndarray,
        mask: np.ndarray,
        matrix: np.ndarray,
        model: str = "homography"
    ) -> Tuple[float, float, float, int]:
        """
        Step 6: Compute sub-pixel RMSE, max error, inlier ratio, and inlier count.
        """
        if mask is None or matrix is None:
            return float("inf"), float("inf"), 0.0, 0

        inlier_mask = mask.ravel() == 1
        inlier_count = int(np.sum(inlier_mask))
        inlier_ratio = float(inlier_count / len(mask)) if len(mask) > 0 else 0.0

        if inlier_count == 0:
            return float("inf"), float("inf"), 0.0, 0

        inlier_src = src_pts[inlier_mask]
        inlier_dst = dst_pts[inlier_mask]

        # Project source points through transform matrix
        if model == "homography":
            projected = cv2.perspectiveTransform(inlier_src, matrix)
        else:  # affine
            projected = cv2.transform(inlier_src, matrix)

        # Compute Euclidean errors (px)
        diffs = projected.reshape(-1, 2) - inlier_dst.reshape(-1, 2)
        errors = np.linalg.norm(diffs, axis=1)

        rmse = float(np.sqrt(np.mean(errors ** 2)))
        max_error = float(np.max(errors))

        return rmse, max_error, inlier_ratio, inlier_count

    def warp_image(
        self,
        src_img: np.ndarray,
        H_or_M: np.ndarray,
        output_size: Tuple[int, int],
        model: str = "homography",
        flags: int = cv2.INTER_LINEAR,
        border_mode: int = cv2.BORDER_CONSTANT,
        border_value: Tuple[int, int, int] = (0, 0, 0)
    ) -> np.ndarray:
        """
        Step 5: Warp source image into destination coordinate frame.
        """
        w, h = output_size
        if model == "homography":
            warped = cv2.warpPerspective(
                src_img,
                H_or_M,
                (w, h),
                flags=flags,
                borderMode=border_mode,
                borderValue=border_value
            )
        else:
            warped = cv2.warpAffine(
                src_img,
                H_or_M,
                (w, h),
                flags=flags,
                borderMode=border_mode,
                borderValue=border_value
            )
        return warped

    def generate_visual_overlay(
        self,
        dst_img: np.ndarray,
        warped_img: np.ndarray,
        alpha: float = 0.5
    ) -> np.ndarray:
        """
        Step 7: Create translucency overlay to visually audit alignment quality.
        """
        # Ensure dimensions match
        if dst_img.shape != warped_img.shape:
            warped_matched = cv2.resize(warped_img, (dst_img.shape[1], dst_img.shape[0]))
        else:
            warped_matched = warped_img

        # If grayscale vs color mismatch, convert grayscale to BGR
        if dst_img.ndim == 2 and warped_matched.ndim == 3:
            dst_img_bgr = cv2.cvtColor(dst_img, cv2.COLOR_GRAY2BGR)
        else:
            dst_img_bgr = dst_img

        if warped_matched.ndim == 2 and dst_img_bgr.ndim == 3:
            warped_bgr = cv2.cvtColor(warped_matched, cv2.COLOR_GRAY2BGR)
        else:
            warped_bgr = warped_matched

        overlay = cv2.addWeighted(dst_img_bgr, alpha, warped_bgr, 1.0 - alpha, 0)
        return overlay

    def process(
        self,
        src_img: np.ndarray,
        dst_img: np.ndarray,
        src_pts: np.ndarray,
        dst_pts: np.ndarray,
        model: str = "homography",
        ransac_reproj_thresh: float = 5.0,
        flags: int = cv2.INTER_LINEAR,
        border_mode: int = cv2.BORDER_CONSTANT,
        border_value: Tuple[int, int, int] = (0, 0, 0)
    ) -> WarpResult:
        """
        Full 8-Step Role 4 Pipeline Execution.
        """
        # Step 1: Normalize input points
        try:
            src_norm = self.normalize_points(src_pts)
            dst_norm = self.normalize_points(dst_pts)
        except ValueError as err:
            return WarpResult(
                matrix=None, warped=None, overlay=None,
                rmse=float("inf"), max_error=float("inf"),
                inlier_ratio=0.0, inlier_count=0,
                status="FAIL", message=f"Input validation error: {str(err)}"
            )

        # Step 2 & 3: Estimate transform with RANSAC
        matrix, mask = self.estimate_transform(
            src_norm, dst_norm, model=model, ransac_reproj_thresh=ransac_reproj_thresh
        )

        # Step 4: Sanity check matrix
        is_valid, matrix_msg = self.sanity_check_matrix(matrix, model=model)
        if not is_valid:
            return WarpResult(
                matrix=matrix, warped=None, overlay=None,
                rmse=float("inf"), max_error=float("inf"),
                inlier_ratio=0.0, inlier_count=0,
                status="FAIL", message=f"Sanity check failed: {matrix_msg}"
            )

        # Step 6: Compute sub-pixel RMSE and RANSAC metrics
        rmse, max_error, inlier_ratio, inlier_count = self.compute_subpixel_rmse(
            src_norm, dst_norm, mask, matrix, model=model
        )

        # Step 5: Warp image
        dh, dw = dst_img.shape[:2]
        warped = self.warp_image(
            src_img, matrix, (dw, dh), model=model, flags=flags,
            border_mode=border_mode, border_value=border_value
        )

        # Step 7: Visual validation overlay
        overlay = self.generate_visual_overlay(dst_img, warped)

        # Step 8: Package outputs & decide status flag
        if (
            rmse <= self.rmse_pass_thresh
            and inlier_ratio >= self.min_inlier_ratio
            and inlier_count >= self.min_inlier_count
        ):
            status = "PASS"
            status_msg = f"PASS: RMSE={rmse:.3f}px, inliers={inlier_count}/{len(mask)} ({inlier_ratio*100:.1f}%), max_err={max_error:.2f}px"
        elif rmse <= self.rmse_warn_thresh and inlier_count >= self.min_inlier_count:
            status = "WARN"
            status_msg = f"WARN: Sub-optimal alignment. RMSE={rmse:.3f}px, inliers={inlier_count}/{len(mask)} ({inlier_ratio*100:.1f}%)"
        else:
            status = "FAIL"
            status_msg = f"FAIL: High error or low inliers. RMSE={rmse:.3f}px, inliers={inlier_count}/{len(mask)} ({inlier_ratio*100:.1f}%)"

        return WarpResult(
            matrix=matrix,
            warped=warped,
            overlay=overlay,
            rmse=rmse,
            max_error=max_error,
            inlier_ratio=inlier_ratio,
            inlier_count=inlier_count,
            status=status,
            message=status_msg
        )


def warp_and_validate(
    src_img: np.ndarray,
    dst_img: np.ndarray,
    src_pts: np.ndarray,
    dst_pts: np.ndarray,
    model: str = "homography",
    ransac_reproj_thresh: float = 5.0
) -> Dict[str, Any]:
    """
    Functional entry point for Role 4 pipeline.
    Returns dictionary matching handoff format.
    """
    validator = WarpValidator()
    res = validator.process(
        src_img, dst_img, src_pts, dst_pts,
        model=model, ransac_reproj_thresh=ransac_reproj_thresh
    )
    return {
        "H": res.matrix,
        "warped": res.warped,
        "overlay": res.overlay,
        "rmse": res.rmse,
        "max_error": res.max_error,
        "inlier_ratio": res.inlier_ratio,
        "inlier_count": res.inlier_count,
        "status": res.status,
        "message": res.message
    }
