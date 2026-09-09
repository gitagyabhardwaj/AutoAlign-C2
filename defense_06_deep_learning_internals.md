# DEFENSE GUIDE 06: Deep Learning & PyTorch Internals

If the judges have ML/AI backgrounds and want to grill you on the actual deep learning mathematics, neural network architecture, and tensor operations, use this guide.

---

## 1. LoFTR Architecture: The CNN Backbone (Feature Pyramid Network)
**Concept:** LoFTR doesn't just feed raw pixels into a Transformer. 
**The Deep Dive:** 
"Before the Transformer layer, LoFTR uses a **Convolutional Neural Network (CNN) backbone**—specifically a Feature Pyramid Network (FPN) based on ResNet. This backbone extracts dense feature maps at two scales: a **Coarse-level map** (at 1/8th resolution) and a **Fine-level map** (at 1/2 resolution). The CNN acts as the initial spatial feature extractor, identifying localized gradients and textures before handing them off to the Transformer for global context."

## 2. 2D Positional Encoding
**Concept:** How the AI understands where things are.
**The Deep Dive:** 
"Transformers are permutation-invariant; inherently, they have no concept of space or sequence. In NLP, you use 1D positional encoding. Because we are aligning 2D maps, our pipeline relies on **2D Positional Encodings** (sine/cosine frequencies). These spatial coordinates are injected directly into the CNN feature maps. This is critical because it forces the Transformer to understand not just what a crater looks like, but its exact geometric location relative to the rest of the image."

## 3. Linear Attention (Solving the O(N²) Bottleneck)
**Concept:** Why the GPU doesn't crash.
**The Deep Dive:** 
"Standard Multi-Head Attention has a computational complexity of **O(N²)**, where N is the number of pixels. Running O(N²) attention on dense image grids would instantly cause a VRAM Out-Of-Memory (OOM) error. LoFTR circumvents this by using **Linear Attention**. By applying a kernel function (like `ELU(x) + 1`) to the queries and keys, the order of matrix multiplication is changed, reducing the complexity to **O(N)**. This is why our pipeline can process massive planetary feature maps in real-time."

## 4. Dual-Softmax Coarse Matching
**Concept:** How the AI actually decides two pixels match.
**The Deep Dive:** 
"After the Transformer processes the coarse feature maps, it generates a **Score Matrix** by computing the dot product between the feature vectors of Image A and Image B. To enforce mutual consistency (ensuring pixel A maps to pixel B, and pixel B maps back to pixel A), it applies a **Dual-Softmax operator**. It computes the Softmax probability across the rows (Image A to B) and then across the columns (Image B to A). Only pairs that survive both threshold passes are selected as coarse matches."

## 5. Fine-Level Refinement (Sub-Pixel Accuracy)
**Concept:** Achieving scientific, sub-pixel precision.
**The Deep Dive:** 
"Coarse matching at 1/8th resolution isn't accurate enough for ISRO payload alignment. Once a coarse match is found, the network drops down to the Fine-level feature map (1/2 resolution). It extracts a small local window around the coarse match and uses a **Correlation Network** to compute a localized heatmap. By calculating the expectation (center of mass) of this probability heatmap, the network achieves **sub-pixel geometric accuracy**, which is strictly required for the final Affine transformation."

## 6. PyTorch Tensor Mechanics
**Concept:** The code-level ML implementation in `api.py` / `match.py`.
**The Deep Dive:** 
"In our pipeline, we cast the numpy arrays to `torch.Tensor` and normalize them to `[0, 1]` for gradient stability. We use `.unsqueeze(0).unsqueeze(0)` to inject the required **Batch** and **Channel** dimensions, structuring the tensor as `(B, C, H, W)` for the PyTorch runtime. Furthermore, we wrap the inference block in `torch.inference_mode()`. This explicitly disables Autograd (the gradient tracking engine used during training), which prevents massive VRAM spikes and accelerates inference latency during the forward pass."

