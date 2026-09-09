# DEFENSE GUIDE 05: Artificial Intelligence & Machine Learning Concepts

This document is your ultimate cheat sheet for defending the AI/ML architecture of the pipeline. If a judge asks a highly technical question about *how* the AI works, use the vocabulary below.

---

## 1. LoFTR (Local Feature Matching with Transformers)
**What it is:** The core AI engine driving the alignment. LoFTR stands for Local Feature Matching with Transformers.
**The Question:** *"Why use AI? Why not just use standard SIFT or SURF algorithms?"*
**The Defense:** 
"Standard algorithms like SIFT rely on local pixel gradients. If the lighting changes (morning vs. evening shadows on the Moon), SIFT fails because the gradients invert. **LoFTR uses a Transformer architecture.** Instead of just looking at isolated pixels, it uses **Self-Attention** and **Cross-Attention** layers to understand the *global context* of the image. It looks at a crater and understands its relationship to a ridge 5 miles away, making it incredibly resilient to extreme lighting and texture changes."

## 2. Transformer Attention Mechanism
**What it is:** The mathematical concept behind ChatGPT, adapted here for computer vision.
**The Question:** *"How does the Transformer actually match the images?"*
**The Defense:**
"It uses two types of attention. **Self-Attention** looks within a single image (e.g., TMC) to map out the geological structure. **Cross-Attention** compares the structure of the TMC image to the OHRC image. It mathematically weighs how much 'attention' a pixel in image A should pay to a pixel in image B. It creates a dense probability map of matches, allowing it to align regions that lack distinct corners or edges (like flat, textureless lunar regolith)."

## 3. The Modality Bridge (CLAHE + Canny Edge)
**What it is:** The preprocessing pipeline that prepares the images *before* the AI sees them.
**The Question:** *"Why don't you feed the raw images directly into the AI?"*
**The Defense:**
"Because of the **Multi-Temporal Illumination Problem**. The Moon has no atmosphere, so shadows change violently based on the solar angle. If we fed raw pixels, the AI would get confused by the shadows. Instead, we built a **Modality Bridge**. We use **CLAHE** (Contrast Limited Adaptive Histogram Equalization) to locally enhance the faint topological structures, and then apply a **Canny Edge Detector**. We feed the AI a pure structural skeleton of the Moon, completely isolating the geometry from the lighting conditions."

## 4. RANSAC (Random Sample Consensus)
**What it is:** The outlier rejection algorithm.
**The Question:** *"If the AI makes a mistake and matches the wrong craters, doesn't your alignment break?"*
**The Defense:**
"No, because the AI output is aggressively filtered by **RANSAC**. LoFTR might propose 1,000 potential matches, but inevitably some are wrong (outliers). RANSAC randomly selects a small subset of matches, calculates a geometric hypothesis, and tests all other matches against it. It iteratively throws away any matches that don't obey strict rigid-body physics. If RANSAC cannot find a mathematically unified consensus of at least 10 perfect matches, our **Strict Mode** intentionally crashes the pipeline rather than outputting fake data."

## 5. Affine Transformation vs. 3D Perspective
**What it is:** The mathematical matrix that actually warps and moves the image.
**The Question:** *"How are you physically moving the pixels once the AI finds the matches?"*
**The Defense:**
"We explicitly use an **Affine Partial 2D Transformation** matrix, restricting the warp to Translation (X/Y movement), Rotation, and Uniform Scaling. We specifically avoided a full 3D Homography matrix. Because the orbital tracks don't always overlap perfectly, a 3D perspective warp would try to skew and tear the image into a trapezoid to force a match. By restricting it to Affine space, we guarantee the orbital data retains its true scientific 2D footprint."

## 6. Gaussian Pyramids & Frequency Domain Matching
**What it is:** How we fixed the 80m/px (IIRS) to 5m/px (TMC) resolution gap.
**The Question:** *"How can your AI match a highly detailed 5m image to a blurry 80m image?"*
**The Defense:**
"According to the Nyquist-Shannon sampling theorem, you cannot extract identical features from images in completely different spatial frequency domains. A crater rim in TMC is microscopic; in IIRS, it's a massive blurry blob. Before matching, our pipeline artificially degrades the high-res TMC image using a **Gaussian Blur** (a low-pass filter). By forcing the 5m image down into the 80m frequency domain, the edge detectors extract the exact same macroscopic topological blobs, allowing the AI to seamlessly match them."

