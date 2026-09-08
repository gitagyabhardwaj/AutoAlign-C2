/**
 * AutoAlign-C2 — Frontend API Client
 *
 * Typed interface to the FastAPI backend running on localhost:8000.
 */

const API_BASE = "http://localhost:8000";

// ─── Response Types ──────────────────────────────────────────────────────────

export interface PipelineMetrics {
  rmse: number;
  inlier_ratio: number;
  num_inliers: number;
  num_matches: number;
  total_raw: number;
  total_filtered: number;
}

export interface PipelineImages {
  ohrc_preview: string;      // data:image/png;base64,...
  tmc_preview: string;       // data:image/png;base64,...
  match_visualization: string; // data:image/jpeg;base64,...
  warped_overlay: string;    // data:image/jpeg;base64,...
  checkerboard: string;      // data:image/jpeg;base64,...
}

export interface PipelineKeypoints {
  src: number[][];
  dst: number[][];
  confidence: number[];
}

export interface PipelineResult {
  success: boolean;
  metrics: PipelineMetrics;
  homography: number[][];
  images: PipelineImages;
  keypoints: PipelineKeypoints;
  export_path: string;
}

export interface PipelineError {
  success: false;
  error: string;
}

export type PipelineResponse = PipelineResult | PipelineError;

export interface HealthResponse {
  status: string;
  device: string;
  model_loaded: boolean;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Check backend health and ML model readiness.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * Run the full alignment pipeline.
 *
 * @param ohrcFile - The OHRC .zip archive File
 * @param tmcFile  - The TMC .zip archive File
 * @param iirsFile - (Optional) The IIRS .zip archive File
 */
export async function runPipeline(
  ohrcFile: File,
  tmcFile: File,
  iirsFile?: File
): Promise<PipelineResponse> {
  const formData = new FormData();
  formData.append("ohrc_zip", ohrcFile);
  formData.append("tmc_zip", tmcFile);
  if (iirsFile) {
    formData.append("iirs_zip", iirsFile);
  }

  const res = await fetch(`${API_BASE}/api/run-pipeline`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Pipeline request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Download the aligned GeoTIFF from the backend.
 */
export async function downloadAlignedTiff(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/download-result`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Aligned_Composite.tif";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
