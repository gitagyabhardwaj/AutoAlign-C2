import re

with open('/home/yash/Documents/projects/AutoAlign-C2/frontend/app/dashboard/page.tsx', 'r') as f:
    code = f.read()

# Add import
code = code.replace(
    'import { ArrowLeft, Upload, Settings2, Activity, Play, Download, RotateCcw, Image as ImageIcon } from "lucide-react";',
    'import { ArrowLeft, Upload, Settings2, Activity, Play, Download, RotateCcw, Image as ImageIcon } from "lucide-react";\nimport { TelemetryGraphs } from "@/components/ui/TelemetryGraphs";'
)

# Insert the component
replacement = """
              </div>

              {/* ── Metric Graphs ── */}
              {metrics && (
                <TelemetryGraphs 
                  rmse={metrics.rmse} 
                  inliers={metrics.num_inliers} 
                  totalMatches={metrics.num_matches} 
                  ratio={metrics.inlier_ratio} 
                />
              )}

              {/* ── Results Grid ── */}
"""
code = code.replace('              </div>\n\n              {/* ── Results Grid ── */}', replacement)

with open('/home/yash/Documents/projects/AutoAlign-C2/frontend/app/dashboard/page.tsx', 'w') as f:
    f.write(code)
