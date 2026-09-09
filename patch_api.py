import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

# Add import for modality bridge
code = code.replace("from src.pipeline.match import LoFTRMatcher", "from src.pipeline.match import LoFTRMatcher\nfrom src.pipeline.modality_bridge import apply_canny_edge_map")

# Uncomment IIRS loading
code = code.replace(
    "# img_iirs, _, _ = extract_and_load(iirs_zip, temp_dir, \"iirs\") if iirs_zip else (None, None, None)",
    "img_iirs, iirs_transform, iirs_crs = extract_and_load(iirs_zip, temp_dir, \"iirs\") if iirs_zip else (None, None, None)"
)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)
