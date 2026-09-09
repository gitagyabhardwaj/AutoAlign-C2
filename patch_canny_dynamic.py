import re

with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/modality_bridge.py', 'r') as f:
    code = f.read()

replacement = """
def apply_canny_edge_map(img):
    \"\"\"
    Converts raw pixel intensities into a structural edge map.
    Uses dynamic thresholding (Median method) to ensure edges are found 
    even in low-contrast Nadir (nrn) views!
    \"\"\"
    # Ensure uint8
    if img.dtype != np.uint8:
        if img.max() > 255:
            img = (255 * (img - img.min()) / ((img.max() - img.min()) + 1e-5)).astype(np.uint8)
        else:
            img = img.astype(np.uint8)
            
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    
    # Compute the median of the single channel pixel intensities
    v = np.median(blurred)
    
    # Apply automatic Canny edge detection using the computed median
    sigma = 0.33
    lower = int(max(0, (1.0 - sigma) * v))
    upper = int(min(255, (1.0 + sigma) * v))
    edges = cv2.Canny(blurred, lower, upper)
    
    # Dilate slightly to make edges thicker for LoFTR to grab onto
    kernel = np.ones((3,3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    
    return dilated_edges
"""

code = re.sub(r'def apply_canny_edge_map.*?return dilated_edges', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/src/pipeline/modality_bridge.py', 'w') as f:
    f.write(code)

