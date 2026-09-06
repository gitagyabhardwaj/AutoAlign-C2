import xml.etree.ElementTree as ET

xml_path = r"data\raw\20211023\ch2_ohr_nrp_20211023T0027462822_d_img_d18.xml"

tree = ET.parse(xml_path)
root = tree.getroot()

tags = {}
for elem in root.iter():
    clean_tag = elem.tag.split("}")[-1]
    if elem.text and elem.text.strip():
        tags[clean_tag] = elem.text.strip()

print("Parsed PDS4 XML successfully!")
print("title:", tags.get("title"))
print("instrument:", tags.get("name"))
print("pixel_resolution:", tags.get("pixel_resolution"))
print("solar_incidence:", tags.get("solar_incidence"))
print("projection:", tags.get("projection"))
print("area:", tags.get("area"))
print("file_name:", tags.get("file_name"))
print("file_size:", tags.get("file_size"))
print("data_type:", tags.get("data_type"))

# Extract Line and Sample elements
lines, samples = None, None
for axis in root.iter():
    if axis.tag.split("}")[-1] == "Axis_Array":
        name = None
        count = None
        for child in axis:
            ctag = child.tag.split("}")[-1]
            if ctag == "axis_name":
                name = child.text.strip()
            elif ctag == "elements":
                count = int(child.text.strip())
        if name == "Line":
            lines = count
        elif name == "Sample":
            samples = count

print(f"Dimensions: {samples} samples x {lines} lines")
