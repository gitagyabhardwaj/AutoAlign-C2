import re

with open("frontend/app/dashboard/original_page.tsx", "r") as f:
    orig = f.read()

# 1. Add API types and state variables at the top
orig = orig.replace('const [missionState, setMissionState] = useState<"setup" | "simulating" | "payload">("setup");', """
  const [missionState, setMissionState] = useState<"setup" | "simulating" | "payload" | "error">("setup");
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"slider" | "loftr" | "checker">("slider");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
""")

# 2. Modify handleInitiatePipeline to actually call the API
api_call = """
  const handleInitiatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setMissionState("simulating");
    setSimulationStage(1);
    
    // Simulate stage progression while waiting
    const t1 = setTimeout(() => setSimulationStage(2), 800);
    const t2 = setTimeout(() => setSimulationStage(3), 1600);

    try {
      const res = await fetch(`${API_URL}/api/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ohrc_path: "", tmc_path: "" })
      });
      const data = await res.json();
      
      setCurrentStage(4); // Or setSimulationStage(4)
      setSimulationStage(4);
      
      await new Promise(r => setTimeout(r, 600)); // Brief pause on stage 4
      
      if (data.success) {
        setResult(data);
        setMissionState("payload");
      } else {
        setErrorMessage(data.error || "Pipeline failed");
        setMissionState("error");
      }
    } catch (err) {
      setErrorMessage("Cannot reach the backend server.");
      setMissionState("error");
    }
    clearTimeout(t1);
    clearTimeout(t2);
  };
"""

orig = re.sub(r'const handleInitiatePipeline = \(e: React.FormEvent\) => \{.*?\};', api_call, orig, flags=re.DOTALL)

# 3. Remove the original useEffect timer for simulating
orig = re.sub(r'// 4-Stage Simulation Progression:.*?return \(\) => \{.*?clearTimeout\(t4\);\n    \};\n  \}, \[missionState\]\);', '', orig, flags=re.DOTALL)

# 4. Inject real data into Phase 2 metrics
orig = orig.replace('SUB-PIXEL CONVERGED (0.38 px RMSE)', 'SUB-PIXEL CONVERGED ({result?.metrics?.rmse.toFixed(2)} px RMSE)')
orig = orig.replace('style={{ backgroundImage: `url("${payloadImage}")` }}', 'style={{ backgroundImage: `url("${result?.images?.warped_overlay || payloadImage}")` }}')

orig = orig.replace('style={{ backgroundImage: `url("${sensorCardImg}")` }}', 'style={{ backgroundImage: `url("${result?.images?.ohrc_preview || sensorCardImg}")` }}', 1)
orig = orig.replace('style={{ backgroundImage: `url("${sensorCardImg}")` }}', 'style={{ backgroundImage: `url("${result?.images?.tmc_preview || sensorCardImg}")` }}', 1)
orig = orig.replace('style={{ backgroundImage: `url("${sensorCardImg}")` }}', 'style={{ backgroundImage: `url("${result?.images?.tmc_preview || sensorCardImg}")` }}', 1)

# 5. Insert Error State block
error_block = """
        {missionState === "error" && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black">
            <div className="max-w-lg w-full bg-neutral-950 border border-red-500/30 rounded-2xl p-8 space-y-4">
              <h2 className="text-lg text-red-400">Pipeline Failed</h2>
              <p className="text-sm text-red-300">{errorMessage}</p>
              <button onClick={handleReturnToCommandCenter} className="px-6 py-2 bg-white/10 text-white rounded">Retry</button>
            </div>
          </motion.div>
        )}
"""
orig = orig.replace('{/* ================================================================ */}', error_block + '\n        {/* ================================================================ */}', 1) # Insert before phase 2


# 6. Add Grid3X3 and MoveHorizontal to lucide-react imports if missing
orig = orig.replace('UploadCloud,', 'UploadCloud, Grid3X3, MoveHorizontal,')


# 7. Add Visualizations Section right before Sensor Reference Frames
viz_section = """
            {/* --- INJECTED API VISUALIZATIONS --- */}
            <div className="max-w-7xl mx-auto px-12 pt-16 relative z-40 space-y-5">
              <div className="bg-neutral-950/70 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-5">
                <div className="flex border-b border-white/10 pb-3 gap-1 overflow-x-auto">
                  <button onClick={() => setActiveTab("slider")} className={cn("flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium", activeTab === "slider" ? "bg-white/10 text-white border border-white/10" : "text-neutral-400")}>Warped Overlay</button>
                  <button onClick={() => setActiveTab("loftr")} className={cn("flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium", activeTab === "loftr" ? "bg-white/10 text-white border border-white/10" : "text-neutral-400")}>LoFTR Matches</button>
                  <button onClick={() => setActiveTab("checker")} className={cn("flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium", activeTab === "checker" ? "bg-white/10 text-white border border-white/10" : "text-neutral-400")}>Checkerboard</button>
                </div>
                
                {activeTab === "slider" && result?.images && (
                  <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={result.images.warped_overlay} className="w-full h-auto" />
                  </div>
                )}
                {activeTab === "loftr" && result?.images && (
                  <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={result.images.match_visualization} className="w-full h-auto" />
                  </div>
                )}
                {activeTab === "checker" && result?.images && (
                  <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={result.images.checkerboard} className="w-full h-auto" />
                  </div>
                )}
              </div>
            </div>
"""
orig = orig.replace('{/* Section 2: Scrollable Raw Sensor Reference Frames Section     */}', viz_section + '\n            {/* Section 2: Scrollable Raw Sensor Reference Frames Section     */}')


with open("frontend/app/dashboard/page.tsx", "w") as f:
    f.write(orig)

print("Page successfully rebuilt and written.")
