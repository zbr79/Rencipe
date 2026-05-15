from docx import Document
doc = Document("/home/ubuntu/rencipe/docs/CPSC597 Project Report Draft (2).docx")
for p in doc.paragraphs:
    if p.text.strip():
        print(f"Style: {p.style.name} | Text: {p.text[:50]}")
