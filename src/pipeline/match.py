import torch
import kornia.feature as KF
import numpy as np
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

# --- ML Lead Configuration ---
CONFIDENCE_THRESHOLD = 0.05
MIN_MATCH_COUNT = 10

class LoFTRMatcher:
    def __init__(self):
        # Rule 12: Device fallback (GPU if available, else CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[ML Engine] Initializing LoFTRMatcher on {self.device.type.upper()}...")
        # Rule 1: Use pre-trained outdoor weights
        self.matcher = KF.LoFTR(pretrained="outdoor").to(self.device).eval()

    def match_pair(self, img1: np.ndarray, img2: np.ndarray):
        t1 = torch.from_numpy(img1).float()
        t2 = torch.from_numpy(img2).float()
        
        # Safe normalization to [0, 1]
        t1 = (t1 - t1.min()) / (t1.max() - t1.min() + 1e-8)
        t2 = (t2 - t2.min()) / (t2.max() - t2.min() + 1e-8)

        t1 = t1.unsqueeze(0).unsqueeze(0).to(self.device)
        t2 = t2.unsqueeze(0).unsqueeze(0).to(self.device)

        input_dict = {"image0": t1, "image1": t2}

        with torch.inference_mode():
            correspondences = self.matcher(input_dict)

        mkpts0 = correspondences["keypoints0"].cpu().numpy()
        mkpts1 = correspondences["keypoints1"].cpu().numpy()
        confidence_raw = correspondences["confidence"].cpu().numpy()

        # --- Phase 4: Confidence Filtering (Injected by ML Lead) ---
        keep_mask = confidence_raw >= CONFIDENCE_THRESHOLD
        filtered_src = mkpts0[keep_mask]
        filtered_dst = mkpts1[keep_mask]
        filtered_conf = confidence_raw[keep_mask]

        if len(filtered_src) < MIN_MATCH_COUNT:
            raise RuntimeError(
                f"Registration Failed: Only {len(filtered_src)} high-confidence matches found. "
                f"Try passing the Canny Edge maps instead of raw images."
            )

        return {
            "keypoints_src": filtered_src,
            "keypoints_dst": filtered_dst,
            "confidence": filtered_conf,
            "total_raw": len(mkpts0),
            "total_filtered": len(filtered_src)
        }
