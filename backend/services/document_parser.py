import io
import PyPDF2
from docx import Document

class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> str:
        """Extract text from PDF file bytes."""
        text = ""
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
        return text

    @staticmethod
    def parse_docx(file_bytes: bytes) -> str:
        """Extract text from DOCX file bytes."""
        text = ""
        try:
            docx_file = io.BytesIO(file_bytes)
            doc = Document(docx_file)
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
        return text

    @staticmethod
    def parse_txt(file_bytes: bytes) -> str:
        """Extract text from TXT file bytes."""
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise ValueError(f"Failed to parse TXT: {str(e)}")

    @classmethod
    def parse(cls, filename: str, file_bytes: bytes) -> str:
        """Parse document based on its extension."""
        ext = filename.split(".")[-1].lower()
        if ext == "pdf":
            return cls.parse_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            return cls.parse_docx(file_bytes)
        elif ext == "txt":
            return cls.parse_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")
