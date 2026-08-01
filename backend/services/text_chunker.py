from typing import List

class TextChunker:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[str]:
        """
        Split text into overlapping chunks of a target size.
        chunk_size: target number of characters per chunk.
        chunk_overlap: target overlap between adjacent chunks.
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            # If remaining text is small, just take all of it
            if text_length - start <= chunk_size:
                chunks.append(text[start:].strip())
                break
                
            # Grab a tentative chunk window
            end = start + chunk_size
            
            # Try to find a logical split point (like paragraph or sentence end) in the overlap range
            # We look backwards from the end of the window
            split_point = -1
            search_range = text[max(start, end - chunk_overlap):end]
            
            # Check for paragraph boundary, then sentence end, then space
            for separator in ["\n\n", "\n", ". ", " ", ""]:
                if not separator:
                    break
                idx = search_range.rfind(separator)
                if idx != -1:
                    split_point = max(start, end - chunk_overlap) + idx + len(separator)
                    break
            
            if split_point == -1 or split_point <= start:
                # Fallback: slice directly at chunk_size
                split_point = end
                
            chunk = text[start:split_point].strip()
            if chunk:
                chunks.append(chunk)
                
            # Shift start pointer forward, leaving overlap
            start = split_point - chunk_overlap
            if start < 0 or start >= text_length:
                break
                
            # Guard against infinite loops where start doesn't progress
            if start <= split_point - chunk_size:
                start = split_point
                
        return chunks
