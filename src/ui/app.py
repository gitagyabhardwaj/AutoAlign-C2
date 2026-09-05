import streamlit as st
import numpy as np
import cv2
import matplotlib.pyplot as plt
from streamlit_image_comparison import image_comparison

from src.pipeline.ingest import load_dataset
from src.pipeline.preprocess import downsample_to_resolution, extract_canny_edges
from src.pipeline.match import LoFTRMatcher
from src.pipeline.warp import align_images
from src.pipeline.validate import compute_metrics

st.set_page_config(page_title="AutoAlign-C2", layout="wide")
st.title("AutoAlign-C2: Lunar GeoTIFF Coregistration")

# Sidebar Configuration
st.sidebar.header("Configuration")
region = st.sidebar.selectbox("Select Lunar Region", ["tycho"])

if st.sidebar.button("Run Pipeline"):
    with st.spinner("Processing pipeline..."):
        # 1. Ingest
        data = load_dataset(f"data/{region}")
        
        # 2. Preprocess & Match
        ohrc_5m, _ = downsample_to_resolution(data["ohrc"], data["ohrc_meta"], 0.25, 5.0)
        matcher = LoFTRMatcher()
        b1_matches = matcher.match_pair(ohrc_5m, data["tmc"])
        
        # 3. Warp
        warp_res = align_images(ohrc_5m, b1_matches["keypoints_src"], b1_matches["keypoints_dst"])
        
        # 4. Validate
        metrics = compute_metrics(
            b1_matches["keypoints_src"], 
            b1_matches["keypoints_dst"], 
            warp_res["homography"], 
            warp_res["inlier_mask"]
        )

        # Failure Guardrail (Rule 7)
        if metrics["num_matches"] < 4:
            st.error("Registration Failed: Insufficient geometric overlap.")
        else:
            # Metrics Sidebar Outputs
            st.sidebar.markdown("---")
            st.sidebar.subheader("Metrics")
            st.sidebar.metric("RMSE Error", f"{metrics['rmse']:.2f} px")
            st.sidebar.metric("Inlier Ratio", f"{metrics['inlier_ratio']:.1f}%")
            st.sidebar.metric("Matched Keypoints", metrics['num_matches'])

            # Swipe Comparison View
            st.subheader("1. Interactive Alignment Comparison")
            image_comparison(
                img1=ohrc_5m,
                img2=warp_res["warped_image"],
                label1="Original OHRC (Downsampled)",
                label2="Warped OHRC (Aligned)"
            )

            # Homography Output
            st.subheader("2. Calculated Homography Matrix")
            st.dataframe(warp_res["homography"])
