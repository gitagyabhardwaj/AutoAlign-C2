import torch
import kornia.feature as KF
import cv2
import numpy as np

class LoFTRMatcher:
    def __init__(self):
        # Rule 12: Device fallback (GPU if available, else CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Rule 1: Use pre-trained outdoor weights
        self.matcher = KF.LoFTR(pretrained="outdoor").to(self.device).eval()

    def match_pair(self, img1: np.ndarray, img2: np.ndarray):
        t1 = torch.from_numpy(img1).float()
        t2 = torch.from_numpy(img2).float()
        
        t1 = (t1 - t1.min()) / (t1.max() - t1.min() + 1e-8)
        t2 = (t2 - t2.min()) / (t2.max() - t2.min() + 1e-8)

        t1 = t1.unsqueeze(0).unsqueeze(0).to(self.device)
        t2 = t2.unsqueeze(0).unsqueeze(0).to(self.device)

        input_dict = {"image0": t1, "image1": t2}

        with torch.inference_mode():
            correspondences = self.matcher(input_dict)

        mkpts0 = correspondences["keypoints0"].cpu().numpy()
        mkpts1 = correspondences["keypoints1"].cpu().numpy()
        confidence = correspondences["confidence"].cpu().numpy()

        return {
            "keypoints_src": mkpts0,
            "keypoints_dst": mkpts1,
            "confidence": confidence
        }
