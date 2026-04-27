from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


def register_font() -> str:
    # Use a Unicode-safe font available on most Windows systems.
    candidates = [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibri.ttf"),
    ]
    for font_path in candidates:
        if font_path.exists():
            font_name = font_path.stem
            pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
            return font_name
    return "Helvetica"


def markdown_to_pdf(md_path: Path, pdf_path: Path) -> None:
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    font_name = register_font()
    page_width, page_height = A4
    left_margin = 18 * mm
    top_margin = 18 * mm
    bottom_margin = 18 * mm
    line_height = 6 * mm
    max_width = page_width - (2 * left_margin)

    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setTitle(md_path.stem)

    y = page_height - top_margin
    c.setFont(font_name, 11)

    def draw_wrapped(line: str, current_y: float) -> float:
        nonlocal c
        if not line.strip():
            return current_y - line_height

        words = line.split(" ")
        current = ""
        wrapped = []
        for word in words:
            candidate = (current + " " + word).strip()
            if c.stringWidth(candidate, font_name, 11) <= max_width:
                current = candidate
            else:
                if current:
                    wrapped.append(current)
                current = word
        if current:
            wrapped.append(current)

        for part in wrapped:
            if current_y < bottom_margin:
                c.showPage()
                c.setFont(font_name, 11)
                current_y = page_height - top_margin
            c.drawString(left_margin, current_y, part)
            current_y -= line_height
        return current_y

    for raw in lines:
        line = raw.replace("\t", "    ")
        if line.startswith("# "):
            if y < bottom_margin + line_height:
                c.showPage()
                c.setFont(font_name, 16)
                y = page_height - top_margin
            c.setFont(font_name, 16)
            y = draw_wrapped(line[2:].strip(), y)
            c.setFont(font_name, 11)
            y -= 2
        elif line.startswith("## "):
            if y < bottom_margin + line_height:
                c.showPage()
                c.setFont(font_name, 14)
                y = page_height - top_margin
            c.setFont(font_name, 14)
            y = draw_wrapped(line[3:].strip(), y)
            c.setFont(font_name, 11)
            y -= 1
        elif line.startswith("### "):
            if y < bottom_margin + line_height:
                c.showPage()
                c.setFont(font_name, 12)
                y = page_height - top_margin
            c.setFont(font_name, 12)
            y = draw_wrapped(line[4:].strip(), y)
            c.setFont(font_name, 11)
        elif line.startswith("- "):
            y = draw_wrapped(f"• {line[2:].strip()}", y)
        else:
            y = draw_wrapped(line, y)

    c.save()


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    md = root / "SUBMISSION_DOCUMENTATION.md"
    pdf = root / "SUBMISSION_DOCUMENTATION.pdf"
    markdown_to_pdf(md, pdf)
    print(f"Generated: {pdf}")
