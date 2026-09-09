import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

replacement = """
            h_tmc_orig, w_tmc_orig = img_tmc_cropped.shape[:2]
            
            print("[5] Generating High-Res Scientific GeoTIFF...")
            
            # Warp the ORIGINAL scientific data arrays (retaining float32/uint16 radiometry)
            warped_orig_science = cv2.warpPerspective(img_ohrc_cropped, homography_orig, (w_tmc_orig, h_tmc_orig))
            
            # --- IIRS FUSION ---
            warped_iirs_science = None
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
                        warped_iirs_science = cv2.warpPerspective(img_iirs_cropped, homography_iirs_orig, (w_tmc_orig, h_tmc_orig))
            
            # Build Scientific N-band stack (NOT uint8 normalized)
            if warped_iirs_science is not None:
                # Ensure all arrays are cast to float32 so they can be stacked safely if they differ in raw bit-depth
                science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32), warped_iirs_science.astype(np.float32)], axis=0)
            else:
                science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32)], axis=0)
            
            metrics = compute_metrics(src_pts, dst_pts, homography, inlier_mask)
            metrics["total_raw"] = match_result.get("total_raw", len(src_pts))
            metrics["total_filtered"] = match_result.get("total_filtered", len(src_pts))
            
            # --- UI VISUALIZATIONS (uint8 for the web dashboard only) ---
            img1_pad_viz = img1_raw_pad
            img2_pad_viz = img2_raw_pad
            warped_viz = to_uint8(warped_img)
            
            checkerboard = create_checkerboard(img2_pad_viz, warped_viz)
            match_viz = draw_match_visualization(img1_pad_viz, img2_pad_viz, src_pts, dst_pts)
            
            h2, w2 = img2_pad_viz.shape[:2]
            warped_resized = cv2.resize(warped_viz, (w2, h2))
            overlay = cv2.addWeighted(img2_pad_viz, 0.5, warped_resized, 0.5, 0)
            
            # Export Aligned GeoTIFF using Rasterio
            output_dir = "/home/yash/Documents/projects/AutoAlign-C2/outputs"
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, "Aligned_Composite.tif")
            
            try:
                with rasterio.open(
                    output_path, 'w', driver='GTiff',
                    height=h_tmc_orig, width=w_tmc_orig, count=science_stack.shape[0], dtype=str(science_stack.dtype),
                    crs=tmc_crs, transform=tmc_transform
                ) as dst:
                    dst.write(science_stack)
            except Exception as e:
"""

pattern = re.compile(r"            h_tmc_orig, w_tmc_orig = img_tmc_cropped\.shape\[:2\].*?except Exception as e:", re.DOTALL)
code = pattern.sub(replacement.strip() + "\n                print(f\"Warning: GeoTIFF Export failed: {e}\")", code)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)
