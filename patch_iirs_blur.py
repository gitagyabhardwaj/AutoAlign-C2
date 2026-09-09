import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

replacement = """
            img_iirs_pad, pad_iirs = pad_to_multiple_of_8(img_iirs_edge)
            
            # SCIENTIFIC FIX: IIRS is 80m/px (blurry). TMC is 5m/px (sharp).
            # To match topologies, we must artificially degrade the TMC image to match IIRS frequency domain.
            img_tmc_degraded = cv2.GaussianBlur(img_tmc_down, (15, 15), 0)
            img_tmc_degraded_edge = apply_canny_edge_map(img_tmc_degraded)
            img_tmc_degraded_pad, _ = pad_to_multiple_of_8(img_tmc_degraded_edge)
            
            # This will naturally throw a RuntimeError from matcher.py if < 10 matches are found
            match_result_iirs = matcher.match_pair(img_iirs_pad, img_tmc_degraded_pad)
"""

code = re.sub(r'img_iirs_pad, pad_iirs = pad_to_multiple_of_8\(img_iirs_edge\)\s+# This will naturally.*?match_result_iirs = matcher\.match_pair\(img_iirs_pad, img2_pad\)', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)

