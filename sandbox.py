import torch
import kornia
import cv2
import numpy as np
import os

def create_synthetic_samples():
    """Generates synthetic test images (crater-like) to test matching locally."""
    print("Generating synthetic terrain images...")
    # Create a base image with some noise and circles (craters)
    base = np.random.randint(50, 100, (300, 300), dtype=np.uint8)
    
    # Draw some "craters"
    cv2.circle(base, (100, 100), 20, 200, -1)
    cv2.circle(base, (100, 100), 15, 50, -1)
    
    cv2.circle(base, (200, 150), 30, 220, -1)
    cv2.circle(base, (200, 150), 25, 70, -1)
    
    cv2.circle(base, (80, 220), 10, 180, -1)
    
    # Blur slightly to make it look natural
    base = cv2.GaussianBlur(base, (5, 5), 0)
    
    # Create two images with a known overlap (shifted by 20 pixels)
    img1 = base[0:256, 0:256]
    img2 = base[20:276, 20:276]
    
    cv2.imwrite("img1.jpg", img1)
    cv2.imwrite("img2.jpg", img2)
    print("Created img1.jpg and img2.jpg (Shifted crops of the synthetic image)")

def main():
    print("=== AUTOALIGN-C2 : PHASE 1 SANDBOX ===")
    create_synthetic_samples()
    
    # 1. Load images
    print("\n[1] Loading images...")
    img1 = cv2.imread("img1.jpg", cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread("img2.jpg", cv2.IMREAD_GRAYSCALE)

    # 2. Tensor Wrangling
    print("[2] Wrangling numpy arrays into PyTorch Tensors...")
    tensor1 = torch.from_numpy(img1).float().unsqueeze(0).unsqueeze(0) / 255.0
    tensor2 = torch.from_numpy(img2).float().unsqueeze(0).unsqueeze(0) / 255.0
    
    print(f"    Tensor 1 shape: {tensor1.shape}")
    print(f"    Tensor 2 shape: {tensor2.shape}")

    # 3. Hardware Routing
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[3] Hardware Routing: Using {device.type.upper()}")
    
    tensor1 = tensor1.to(device)
    tensor2 = tensor2.to(device)

    # 4. Initialize LoFTR
    print("\n[4] Initializing LoFTR (Downloads weights on first run)...")
    matcher = kornia.feature.LoFTR(pretrained='outdoor').to(device)
    
    # 5. Inference
    print("\n[5] Running Neural Network Inference...")
    input_dict = {"image0": tensor1, "image1": tensor2}
    
    with torch.no_grad():
        matches = matcher(input_dict)
        
    # 6. Output Verification
    print("\n[6] Extracting outputs...")
    keypoints0 = matches['keypoints0'].cpu().numpy()
    keypoints1 = matches['keypoints1'].cpu().numpy()
    confidence = matches['confidence'].cpu().numpy()
    
    print("\n=== SUCCESS: RESULTS ===")
    print(f"Found {len(keypoints0)} matches between the two images!")
    print(f"Keypoints Image 1 Array Shape: {keypoints0.shape}")
    print(f"Keypoints Image 2 Array Shape: {keypoints1.shape}")
    print(f"Confidence Scores Array Shape: {confidence.shape}")
    
    if len(keypoints0) > 0:
        print(f"\nExample Match:")
        print(f"Pixel {keypoints0[0]} in Image 1 corresponds to Pixel {keypoints1[0]} in Image 2")
        print(f"Model Confidence: {confidence[0]:.3f}")

if __name__ == "__main__":
    main()
