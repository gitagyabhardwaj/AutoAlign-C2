import cv2
import numpy as np

def draw_match_visualization(img1: np.ndarray, img2: np.ndarray, src_pts: np.ndarray, dst_pts: np.ndarray) -> np.ndarray:
    """
    Takes two images and their matched coordinates, returning a single side-by-side
    image with colorful lines connecting the matches. Ready to be displayed in Streamlit.
    
    Args:
        img1 (np.ndarray): The source image (grayscale or RGB)
        img2 (np.ndarray): The target image (grayscale or RGB)
        src_pts (np.ndarray): Array of shape (N, 2) containing X,Y coordinates in img1
        dst_pts (np.ndarray): Array of shape (N, 2) containing X,Y coordinates in img2
        
    Returns:
        np.ndarray: A colored image (BGR format) showing the matches side-by-side
    """
    # Ensure images are in uint8 format for OpenCV drawing
    if img1.dtype != np.uint8:
        img1 = (img1 * 255).astype(np.uint8) if img1.max() <= 1.0 else img1.astype(np.uint8)
    if img2.dtype != np.uint8:
        img2 = (img2 * 255).astype(np.uint8) if img2.max() <= 1.0 else img2.astype(np.uint8)

    # OpenCV's drawing function requires specific KeyPoint and DMatch objects, 
    # not raw numpy arrays. We have to convert them here.
    kps1 = [cv2.KeyPoint(x=float(pt[0]), y=float(pt[1]), size=2) for pt in src_pts]
    kps2 = [cv2.KeyPoint(x=float(pt[0]), y=float(pt[1]), size=2) for pt in dst_pts]
    
    # Create "dummy" match objects that simply link index 0 to index 0, 1 to 1, etc.
    matches = [cv2.DMatch(_queryIdx=i, _trainIdx=i, _distance=0) for i in range(len(src_pts))]
    
    # Draw the matches
    # matchColor=(0, 255, 0) draws bright green lines
    # singlePointColor=(0, 0, 255) draws red dots at the keypoints
    viz_image = cv2.drawMatches(
        img1, kps1, 
        img2, kps2, 
        matches, None, 
        matchColor=(0, 255, 0), 
        singlePointColor=(0, 0, 255), 
        flags=0
    )
    
    return viz_image
