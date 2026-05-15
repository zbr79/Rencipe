from docx import Document
path = "/home/ubuntu/rencipe/docs/CPSC597 Project Report Draft (2).docx"
doc = Document(path)
for i, table in enumerate(doc.tables):
    text = " ".join(cell.text for row in table.rows for cell in row.cells).lower()
    if "architecture" in text:
        print(f"Arch found in table {i}")
        print(f"Content snippet: {text[:200]}")
