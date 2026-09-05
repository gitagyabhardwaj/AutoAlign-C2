import numpy as np

def compute_metrics(keypoints_src, keypoints_dst, homography, inlier_mask):
    """
    Calculates residual RMSE error and inlier ratio for performance evaluation.
    """
    if homography is None or inlier_mask is None or len(keypoints_src) == 0:
        return {"rmse": 999.0, "inlier_ratio": 0.0, "num_inliers": 0, "num_matches": 0}

    inliers_src = keypoints_src[inlier_mask.ravel() == 1]
    inliers_dst = keypoints_dst[inlier_mask.ravel() == 1]

    num_inliers = len(inliers_src)
    num_matches = len(keypoints_src)
    inlier_ratio = (num_inliers / num_matches) * 100 if num_matches > 0 else 0.0

    if num_inliers == 0:
        return {"rmse": 999.0, "inlier_ratio": 0.0, "num_inliers": 0, "num_matches": num_matches}

    # Convert keypoints to homogeneous coordinates (N, 3)
    pts_src_h = np.hstack([inliers_src, np.ones((num_inliers, 1))])
    
    # Transform points using Homography matrix
    pts_proj_h = (homography @ pts_src_h.T).T
    pts_proj = pts_proj_h[:, :2] / pts_proj_h[:, 2:]

    # Compute Euclidean residual distances
    errors = np.linalg.norm(inliers_dst - pts_proj, axis=1)
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    return {
        "rmse": rmse,
        "inlier_ratio": inlier_ratio,
        "num_inliers": num_inliers,
        "num_matches": num_matches
    }

def create_checkerboard(img1, img2, square_size=20):
    """Generates an alternating checkerboard pattern to verify alignment visual accuracy."""
    h = min(img1.shape[0], img2.shape[0])
    w = min(img1.shape[1], img2.shape[1])
    
    crop1 = img1[:h, :w]
    crop2 = img2[:h, :w]

    grid_y, grid_x = np.indices((h, w))
    checker = ((grid_y // square_size) + (grid_x // square_size)) % 2 == 0
    
    blended = np.where(checker, crop1, crop2)
    return blended
