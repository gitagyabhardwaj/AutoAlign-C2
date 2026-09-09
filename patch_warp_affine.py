import re

# Update warp.py
with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/warp.py', 'r') as f:
    code = f.read()

code = code.replace(
    'H, inlier_mask = cv2.findHomography(keypoints_src, keypoints_dst, cv2.RANSAC, 5.0)',
    'H_affine, inlier_mask = cv2.estimateAffinePartial2D(keypoints_src, keypoints_dst, method=cv2.RANSAC, ransacReprojThreshold=5.0)\n    if H_affine is not None:\n        # Convert 2x3 affine matrix to 3x3 homography matrix format for cv2.warpPerspective\n        import numpy as np\n        H = np.vstack([H_affine, [0, 0, 1]])\n    else:\n        H = None'
)

with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/warp.py', 'w') as f:
    f.write(code)

# Update api.py (for the high-res upscaling homography)
with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    api_code = f.read()

api_code = api_code.replace(
    'homography_orig, inlier_mask_orig = cv2.findHomography(src_pts_orig, dst_pts_orig, cv2.RANSAC, 5.0)',
    'H_affine_orig, inlier_mask_orig = cv2.estimateAffinePartial2D(src_pts_orig, dst_pts_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)\n            if H_affine_orig is not None:\n                homography_orig = np.vstack([H_affine_orig, [0, 0, 1]])\n            else:\n                homography_orig = None'
)

api_code = api_code.replace(
    'homography_iirs_orig, _ = cv2.findHomography(src_pts_iirs_orig, dst_pts_iirs_orig, cv2.RANSAC, 5.0)',
    'H_iirs_affine_orig, _ = cv2.estimateAffinePartial2D(src_pts_iirs_orig, dst_pts_iirs_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)\n                    if H_iirs_affine_orig is not None:\n                        homography_iirs_orig = np.vstack([H_iirs_affine_orig, [0, 0, 1]])\n                    else:\n                        homography_iirs_orig = None'
)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(api_code)

