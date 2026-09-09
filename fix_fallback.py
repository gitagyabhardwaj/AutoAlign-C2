import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

# Make the fallback obvious so the user understands what is happening
replacement = """
            # Build Scientific N-band stack (NOT uint8 normalized)
            if warped_iirs_science is not None:
                print("SUCCESS: 3-Band Stack Created (TMC + OHRC + IIRS)")
                science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32), warped_iirs_science.astype(np.float32)], axis=0)
            else:
                print("WARNING: IIRS alignment failed. Falling back to 2-Band Stack (TMC + OHRC)")
                science_stack = np.stack([img_tmc_cropped.astype(np.float32), warped_orig_science.astype(np.float32)], axis=0)
"""
code = re.sub(r'# Build Scientific N-band stack.*?axis=0\)', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)

