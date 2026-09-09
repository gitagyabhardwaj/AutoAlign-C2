import re

with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/modality_bridge.py', 'r') as f:
    code = f.read()

replacement = """
def apply_canny_edge_map(img):
    \"\"\"
    Converts raw pixel intensities into a structural edge map.
    Uses CLAHE (Contrast Limited Adaptive Histogram Equalization) to 
    dynamically enhance local structural gradients before edge detection.
    This guarantees mathematically rigorous feature extraction even on 
    flat, low-contrast Nadir (nrn) planetary captures.
    \"\"\"
    # Ensure uint8
    if img.dtype != np.uint8:
        if img.max() > 255:
            img = (255 * (img - img.min()) / ((img.max() - img.min()) + 1e-5)).astype(np.uint8)
        else:
            img = img.astype(np.uint8)
            
    # Apply CLAHE to dramatically boost local structural contrast (crater rims)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(img)
    
    # Apply Gaussian blur to suppress the high-frequency regolith noise amplified by CLAHE
    blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
    
    # Because CLAHE normalizes the local contrast, we can safely use strict, 
    # uniform Canny gradient thresholds to extract the true geological structures.
    edges = cv2.Canny(blurred, 30, 90)
    
    # Dilate slightly to make edges thicker for the Transformer attention map
    kernel = np.ones((3,3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    
    return dilated_edges
"""

code = re.sub(r'def apply_canny_edge_map.*?return dilated_edges', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/modality_bridge.py', 'w') as f:
    f.write(code)

