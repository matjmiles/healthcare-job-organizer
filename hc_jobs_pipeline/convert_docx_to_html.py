import os
import mammoth

WORD_DIR = os.path.join("data", "word")
HTML_DIR = os.path.join("data", "html")
os.makedirs(HTML_DIR, exist_ok=True)

def convert_docx_to_html(docx_path, html_path):
    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        html = result.value
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)

def main():
    for filename in os.listdir(WORD_DIR):
        if filename.lower().endswith(".docx"):
            docx_path = os.path.join(WORD_DIR, filename)
            base = os.path.splitext(filename)[0]
            html_path = os.path.join(HTML_DIR, f"{base}.html")
            print(f"Converting {filename} -> {base}.html")
            convert_docx_to_html(docx_path, html_path)
    print("Conversion complete.")

if __name__ == "__main__":
    main()
