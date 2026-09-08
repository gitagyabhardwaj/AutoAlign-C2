import cv2
import numpy as np
from src.pipeline.warp_validator import WarpValidator, warp_and_validate, WarpResult

def align_images(src_img, keypoints_src, keypoints_dst):
    """
    Computes 2D Homography matrix via RANSAC and warps src_img
    into destination coordinate space.
    """
    if len(keypoints_src) < 4:
        return {
            "warped_image": None,
            "homography": None,
            "inlier_mask": None,
            "success": False
        }

    # Find Homography using RANSAC
    H, inlier_mask = cv2.findHomography(keypoints_src, keypoints_dst, cv2.RANSAC, 5.0)
    
    if H is None:
        return {
            "warped_image": None,
            "homography": None,
            "inlier_mask": None,
            "success": False
        }

    h, w = src_img.shape[:2]
    warped_img = cv2.warpPerspective(src_img, H, (w, h))

    return {
        "warped_image": warped_img,
        "homography": H,
        "inlier_mask": inlier_mask,
        "success": True
    }
