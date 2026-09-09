import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

replacement = """
            img_ohrc_down, scale_ohrc = resize_to_max_and_scale(img_ohrc_cropped)
            img_tmc, scale_tmc = resize_to_max_and_scale(img_tmc_cropped)
            
            if img_iirs is not None:
                img_iirs_cropped = crop_center(img_iirs, crop_size=4000)
                img_iirs_down, scale_iirs = resize_to_max_and_scale(img_iirs_cropped)
            else:
                img_iirs_cropped = None
                img_iirs_down = None
            
            print(f"RESIZED SHAPES: OHRC={img_ohrc_down.shape}, TMC={img_tmc.shape}")
            
            # --- MODALITY BRIDGE (Canny Edge) ---
            print("Applying Canny Edge Modality Bridge for multi-sensor invariance...")
            img_ohrc_edge = apply_canny_edge_map(img_ohrc_down)
            img_tmc_edge = apply_canny_edge_map(img_tmc)
            img_iirs_edge = apply_canny_edge_map(img_iirs_down) if img_iirs_down is not None else None
            
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Pad to multiple of 8 (feed edges to LoFTR)
            img1_pad, pad1 = pad_to_multiple_of_8(img_ohrc_edge)
            img2_pad, pad2 = pad_to_multiple_of_8(img_tmc_edge)
            pad_h1, pad_w1 = pad1
            pad_h2, pad_w2 = pad2
            
            # Also pad raw for UI visual overlay
            img1_raw_pad, _ = pad_to_multiple_of_8(to_uint8(img_ohrc_down))
            img2_raw_pad, _ = pad_to_multiple_of_8(to_uint8(img_tmc))
            
            cv2.imwrite("/home/yash/Documents/projects/AutoAlign-C2/outputs/debug_ohrc_edge.jpg", img1_pad)
            cv2.imwrite("/home/yash/Documents/projects/AutoAlign-C2/outputs/debug_tmc_edge.jpg", img2_pad)
            
            # --- CORE ML MATCHING ---
            print("[3] Running LoFTR Machine Learning Engine on Edge Maps...")
            match_result = matcher.match_pair(img1_pad, img2_pad)
            src_pts = match_result["keypoints_src"]
            dst_pts = match_result["keypoints_dst"]
            conf = match_result.get("confidence", np.ones(len(src_pts)))
            
            if len(src_pts) < 10:
                return {"success": False, "error": "Not enough matches found across structural edges."}
                
            # --- CV RANSAC & WARPING ---
            print("[4] RANSAC Outlier Rejection and Homography Warp...")
            
            warp_result = align_images(img1_raw_pad, src_pts, dst_pts)
            if not warp_result["success"]:
                return {"success": False, "error": "Homography estimation failed."}
                
            homography = warp_result["homography"]
            inlier_mask = warp_result["inlier_mask"]
            warped_img = warp_result["warped_image"]
            
            # Upscale Keypoints
            src_pts_orig = (src_pts - np.array([pad_w1, pad_h1])) / scale_ohrc
            dst_pts_orig = (dst_pts - np.array([pad_w2, pad_h2])) / scale_tmc
            
            homography_orig, inlier_mask_orig = cv2.findHomography(src_pts_orig, dst_pts_orig, cv2.RANSAC, 5.0)
            
            if homography_orig is None:
                return {"success": False, "error": "High-res homography estimation failed."}
                
            h_tmc_orig, w_tmc_orig = img_tmc_cropped.shape[:2]
            img_ohrc_orig_uint = to_uint8(img_ohrc_cropped)
            img_tmc_orig_uint = to_uint8(img_tmc_cropped)
            
            print("[5] Generating Visuals and Saving High-Res Aligned GeoTIFF...")
            
            warped_orig = cv2.warpPerspective(img_ohrc_orig_uint, homography_orig, (w_tmc_orig, h_tmc_orig))
            
            # --- IIRS FUSION ---
            warped_iirs_orig = None
            if img_iirs_edge is not None:
                print("Fusing IIRS Hyperspectral data...")
                img_iirs_pad, pad_iirs = pad_to_multiple_of_8(img_iirs_edge)
                match_result_iirs = matcher.match_pair(img_iirs_pad, img2_pad)
                src_pts_iirs = match_result_iirs["keypoints_src"]
                dst_pts_iirs = match_result_iirs["keypoints_dst"]
                
                if len(src_pts_iirs) >= 10:
                    src_pts_iirs_orig = (src_pts_iirs - np.array([pad_iirs[1], pad_iirs[0]])) / scale_iirs
                    homography_iirs_orig, _ = cv2.findHomography(src_pts_iirs_orig, dst_pts_iirs_orig, cv2.RANSAC, 5.0)
                    if homography_iirs_orig is not None:
                        img_iirs_orig_uint = to_uint8(img_iirs_cropped)
                        warped_iirs_orig = cv2.warpPerspective(img_iirs_orig_uint, homography_iirs_orig, (w_tmc_orig, h_tmc_orig))
            
            # Build 3-band composite
            if warped_iirs_orig is not None:
                composite_stack_orig = np.stack([img_tmc_orig_uint, warped_orig, warped_iirs_orig], axis=0)
            else:
                diff_band_orig = cv2.absdiff(img_tmc_orig_uint, warped_orig)
                composite_stack_orig = np.stack([img_tmc_orig_uint, warped_orig, diff_band_orig], axis=0)
            
            metrics = compute_metrics(src_pts, dst_pts, homography, inlier_mask)
            metrics["total_raw"] = match_result.get("total_raw", len(src_pts))
            metrics["total_filtered"] = match_result.get("total_filtered", len(src_pts))
            
            # --- UI VISUALIZATIONS ---
            img1_pad_viz = img1_raw_pad
            img2_pad_viz = img2_raw_pad
            warped_viz = to_uint8(warped_img)
"""

pattern = re.compile(r"            img_ohrc_down, scale_ohrc = resize_to_max_and_scale\(img_ohrc_cropped\).*?warped_viz = to_uint8\(warped_img\)", re.DOTALL)
code = pattern.sub(replacement.strip(), code)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)
