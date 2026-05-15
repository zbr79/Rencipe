import docx
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P

def inspect_docx(file_path):
    try:
        doc = docx.Document(file_path)
        body = doc.element.body
        index = 0
        for child in body.iterchildren():
            if isinstance(child, CT_P):
                kind = "paragraph"
                p = Paragraph(child, doc)
                text = p.text.strip()
                style = p.style.name
                has_drawing = 'drawing' in child.xml
            elif isinstance(child, CT_Tbl):
                kind = "table"
                t = Table(child, doc)
                text = " ".join(cell.text.strip() for row in t.rows for cell in row.cells)
                style = t.style.name if t.style else "N/A"
                has_drawing = 'drawing' in child.xml
            else:
                continue
            
            print(f"Index: {index} | Kind: {kind} | Drawing: {has_drawing} | Style: {style} | Text: {text[:100]}")
            index += 1
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_docx('/home/ubuntu/rencipe/docs/CPSC597 Project Report Draft (2).docx')
