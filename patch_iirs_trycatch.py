import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

replacement = """
            # --- IIRS FUSION ---
            warped_iirs_science = None
            if img_iirs_edge is not None:
                print("Fusing IIRS Hyperspectral data...")
                img_iirs_pad, pad_iirs = pad_to_multiple_of_8(img_iirs_edge)
                try:
                    match_result_iirs = matcher.match_pair(img_iirs_pad, img2_pad)
                    src_pts_iirs = match_result_iirs["keypoints_src"]
                    dst_pts_iirs = match_result_iirs["keypoints_dst"]
                    
                    if len(src_pts_iirs) >= 10:
                        src_pts_iirs_orig = (src_pts_iirs - np.array([pad_iirs[1], pad_iirs[0]])) / scale_iirs
                        dst_pts_iirs_orig = (dst_pts_iirs - np.array([pad_w2, pad_h2])) / scale_tmc
                        H_iirs_affine_orig, _ = cv2.estimateAffinePartial2D(src_pts_iirs_orig, dst_pts_iirs_orig, method=cv2.RANSAC, ransacReprojThreshold=5.0)
                        if H_iirs_affine_orig is not None:
                            homography_iirs_orig = np.vstack([H_iirs_affine_orig, [0, 0, 1]])
                        else:
                            homography_iirs_orig = None
                        if homography_iirs_orig is not None:
                            warped_iirs_science = cv2.warpPerspective(img_iirs_cropped, homography_iirs_orig, (w_tmc_orig, h_tmc_orig))
                except Exception as e:
                    print(f"Warning: IIRS fusion failed gracefully: {e}")
"""

code = re.sub(r'# --- IIRS FUSION ---.*?warped_iirs_science = cv2\.warpPerspective\(img_iirs_cropped, homography_iirs_orig, \(w_tmc_orig, h_tmc_orig\)\)', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)

