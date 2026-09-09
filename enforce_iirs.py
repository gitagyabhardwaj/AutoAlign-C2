import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

# 1. Remove the try/except block around IIRS fusion
# 2. Remove the fallback to 2-band stack
replacement = """
            # --- STRICT IIRS FUSION ---
            print("Fusing IIRS Hyperspectral data...")
            if img_iirs_edge is None:
                raise RuntimeError("STRICT MODE: IIRS edge map is missing. 3-sensor fusion requires IIRS.")
                
            img_iirs_pad, pad_iirs = pad_to_multiple_of_8(img_iirs_edge)
            
            # This will naturally throw a RuntimeError from matcher.py if < 10 matches are found
            match_result_iirs = matcher.match_pair(img_iirs_pad, img2_pad)
            
            src_pts_iirs = match_result_iirs["keypoints_src"]
            dst_pts_iirs = match_result_iirs["keypoints_dst"]
            
            src_pts_iirs_orig = (src_pts_iirs - np.array([pad_iirs[1], pad_iirs[0]])) / scale_iirs
            dst_pts_iirs_orig = (dst_pts_iirs - np.array([pad_w2, pad_h2])) / scale_tmc
            
            H_iirs_affine_orig, _ = cv2.estimateAffinePartial2D(src_pts_iirs_orig, dst_pts_iirs_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)
            
            if H_iirs_affine_orig is None:
                raise RuntimeError("STRICT MODE: IIRS Affine Homography failed. Geometric alignment rejected.")
                
            homography_iirs_orig = np.vstack([H_iirs_affine_orig, [0, 0, 1]])
            warped_iirs_science = cv2.warpPerspective(img_iirs_cropped, homography_iirs_orig, (w_tmc_orig, h_tmc_orig))
            
            print("SUCCESS: 3-Band Stack Created (TMC + OHRC + IIRS)")
            science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32), warped_iirs_science.astype(np.float32)], axis=0)
"""

# We need to replace the entire IIRS block carefully.
# The original block starts at "# --- IIRS FUSION ---" and ends at "science_stack = np.stack(..." (the 2-band fallback).
pattern = r'# --- IIRS FUSION ---.*?science_stack = np\.stack\(\[img_tmc_cropped\.astype\(np\.float32\), warped_orig_science\.astype\(np\.float32\)\], axis=0\)'
code = re.sub(pattern, replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)

