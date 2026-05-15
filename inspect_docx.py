from docx import Document
from docx.shared import RGBColor

def inspect():
    path = "/home/ubuntu/rencipe/docs/CPSC597 Project Report Draft (2).docx"
    try:
        doc = Document(path)
    except Exception as e:
        print(f"Error opening document: {e}")
        return

    print("--- Document opened successfully ---")

    # 1. Title row changed (check first table, first row if it's the title table)
    # Often the title is in the first table or first paragraph.
    # Let's check first table if it exists.
    if doc.tables:
        first_table = doc.tables[0]
        title_text = " ".join(cell.text for cell in first_table.rows[0].cells)
        print(f"First table first row text: {title_text}")

    # 2. Check for '(incomplete)' and 'NOT STARTED'
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                full_text.append(cell.text)
    
    combined_text = " ".join(full_text)
    print(f"'(incomplete)' present: {'(incomplete)' in combined_text}")
    print(f"'NOT STARTED' present: {'NOT STARTED' in combined_text}")

    # 3. Main headings 1 through 9 exist
    headings = [para.text for para in doc.paragraphs if para.style.name.startswith('Heading')]
    print(f"Headings found: {len(headings)}")
    for i in range(1, 10):
        found = any(para.style.name == f'Heading {i}' for para in doc.paragraphs)
        # Sometimes people use numbering in text instead of styles, but the query asks for headings 1-9.
        # Let's look for text starting with "1 ", "2 ", etc. if styles are not used.
        found_text = any(para.text.strip().startswith(f"{i}.") or para.text.strip().startswith(f"{i} ") for para in doc.paragraphs if para.style.name.startswith('Heading'))
        print(f"Heading {i} found (style or text): {found or found_text}")

    # 4. Tables exist for goals/requirements/architecture/testing
    table_texts = []
    for table in doc.tables:
        table_texts.append(" ".join(cell.text for row in table.rows for cell in row.cells))
    
    keywords = ["goal", "requirement", "architecture", "testing"]
    for kw in keywords:
        found = any(kw.lower() in t.lower() for t in table_texts)
        print(f"Table for {kw} found: {found}")

    # 5. Paragraphs/runs added after the NOTE are blue
    found_note = False
    blue_color = RGBColor(0, 0, 255) # Standard blue
    # Note: docx colors can be complex.
    after_note_checks = []
    for para in doc.paragraphs:
        if "NOTE:" in para.text or "Note:" in para.text:
            found_note = True
            continue
        if found_note:
            if para.text.strip():
                # Check runs
                para_is_blue = True
                if not para.runs: para_is_blue = False
                for run in para.runs:
                    if run.text.strip():
                        color = run.font.color.rgb if run.font.color else None
                        if color != blue_color:
                            para_is_blue = False
                after_note_checks.append(para_is_blue)
    
    if found_note:
        print(f"All paragraphs after NOTE are blue: {all(after_note_checks) if after_note_checks else 'No paras found'}")
    else:
        print("NOTE section not found")

inspect()
