import re

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'r') as f:
    code = f.read()

replacement = """
            if img_iirs is not None:
                # IIRS is 80m/px. TMC is 5m/px. 
                # To match the 20km x 20km physical swath of TMC (4000px * 5m), 
                # we must crop exactly 250 pixels of IIRS (250px * 80m = 20km).
                img_iirs_cropped = crop_center(img_iirs, crop_size=250)
                img_iirs_down, scale_iirs = resize_to_max_and_scale(img_iirs_cropped)
"""

code = re.sub(r'if img_iirs is not None:.*?img_iirs_down, scale_iirs = resize_to_max_and_scale\(img_iirs_cropped\)', replacement.strip(), code, flags=re.DOTALL)

with open('/home/yash/Documents/projects/AutoAlign-C2/api.py', 'w') as f:
    f.write(code)

