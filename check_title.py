from docx import Document
doc = Document('/home/ubuntu/rencipe/docs/CPSC597 Project Report Draft (2).docx')
for p in doc.paragraphs[:20]:
    if p.text.strip():
        print(f"P: {p.text}")
