import re

with open('/home/yash/Documents/projects/AutoAlign-C2/frontend/app/dashboard/page.tsx', 'r') as f:
    code = f.read()

# Fix TMC
code = re.sub(r'<img\s+src=\{tmcUpload\.previewUrl\}[^>]+/>', 
              r'<div className="w-full h-24 bg-black/80 rounded mb-3 border border-cyan-500/20 flex flex-col items-center justify-center"><span className="text-cyan-500 font-mono text-xs">PDS4 ARCHIVE</span><span className="text-gray-500 font-mono text-[9px] mt-1">.zip loaded</span></div>', code)

# Fix IIRS
code = re.sub(r'<img\s+src=\{iirsUpload\.previewUrl\}[^>]+/>', 
              r'<div className="w-full h-24 bg-black/80 rounded mb-3 border border-purple-500/20 flex flex-col items-center justify-center"><span className="text-purple-500 font-mono text-xs">PDS4 ARCHIVE</span><span className="text-gray-500 font-mono text-[9px] mt-1">.zip loaded</span></div>', code)

with open('/home/yash/Documents/projects/AutoAlign-C2/frontend/app/dashboard/page.tsx', 'w') as f:
    f.write(code)

