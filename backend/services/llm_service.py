import json
import httpx
from typing import List, Dict, Any, Generator
from config import settings
from huggingface_hub import InferenceClient

class LLMService:
    DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct"
    
    @classmethod
    def _get_client(cls) -> InferenceClient:
        return InferenceClient(token=settings.HF_TOKEN)

    @classmethod
    def _get_headers(cls) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json"
        }
        if settings.HF_TOKEN:
            headers["Authorization"] = f"Bearer {settings.HF_TOKEN}"
        return headers

    @classmethod
    def build_prompt(cls, system_prompt: str, context: List[str], history: List[Dict[str, Any]], query: str) -> str:
        """
        Construct a ChatML/Zephyr prompt template containing:
        - System instruction
        - Retrieved context chunks
        - Conversational history
        - Latest user query
        """
        prompt = ""
        
        # 1. System Prompt & Context
        prompt += f"<|system|>\n{system_prompt}\n\n"
        if context:
            prompt += "Here is the relevant context retrieved from the uploaded study material:\n"
            for idx, chunk in enumerate(context):
                prompt += f"--- CONTEXT BLOCK {idx+1} ---\n{chunk}\n"
            prompt += "-------------------------\n\n"
        prompt += "Using the above context blocks and simple terms, answer the question below. Include helpful analogies if explaining a concept. If the answer is not in the context blocks, respond honestly with 'I couldn't find this information in the uploaded document.'\n"
        prompt += "</s>\n"

        # 2. Conversation History
        for msg in history:
            role = "user" if msg["sender"] == "user" else "assistant"
            prompt += f"<|{role}|>\n{msg['message']}</s>\n"

        # 3. Latest User Query
        prompt += f"<|user|>\n{query}</s>\n<|assistant|>\n"
        
        return prompt

    @classmethod
    async def stream_chat(
        cls, 
        system_prompt: str, 
        context: List[str], 
        history: List[Dict[str, Any]], 
        query: str,
        model_id: str = None
    ) -> Generator[str, None, None]:
        """
        Query Hugging Face Inference API and stream response tokens back.
        """
        model = model_id or cls.DEFAULT_MODEL
        client = cls._get_client()
        
        # Build messages list in OpenAI format
        messages = []
        
        # 1. System Prompt & Context
        sys_content = system_prompt
        if context:
            sys_content += "\n\nHere is the relevant context retrieved from the uploaded study material:\n"
            for idx, chunk in enumerate(context):
                sys_content += f"--- CONTEXT BLOCK {idx+1} ---\n{chunk}\n"
            sys_content += "-------------------------\n"
            sys_content += "Using the above context blocks and simple terms, answer the question below. Include helpful analogies if explaining a concept. If the answer is not in the context blocks, respond honestly with 'I couldn't find this information in the uploaded document.'"
            
        messages.append({"role": "system", "content": sys_content})
        
        # 2. Conversation History
        for msg in history:
            role = "user" if msg["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["message"]})
            
        # 3. Latest Query
        messages.append({"role": "user", "content": query})

        try:
            stream = client.chat_completion(
                model=model,
                messages=messages,
                max_tokens=800,
                temperature=0.7,
                stream=True
            )
            for chunk in stream:
                token = chunk.choices[0].delta.content
                if token:
                    yield token
        except Exception as e:
            print(f"Hugging Face SDK error: {e}", flush=True)
            yield f"Error: Unexpected LLM service error: {str(e)}"

    @classmethod
    def _extract_json(cls, text: str) -> Any:
        """Helper to find and parse JSON from LLM string output."""
        try:
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx + 1]
                return json.loads(json_str)
            # Try parsing directly
            return json.loads(text)
        except Exception:
            return None

    @classmethod
    async def query_model_direct(cls, prompt: str, model_id: str = None) -> str:
        """Make a direct non-streaming request to the Hugging Face API."""
        model = model_id or cls.DEFAULT_MODEL
        client = cls._get_client()
        
        # Parse pre-formatted prompt back into messages list in OpenAI format
        messages = []
        if "<|system|>" in prompt:
            system_part = ""
            user_part = ""
            try:
                system_start = prompt.find("<|system|>")
                system_end = prompt.find("</s>", system_start)
                if system_start != -1 and system_end != -1:
                    system_part = prompt[system_start + len("<|system|>"):system_end].strip()
                
                user_start = prompt.find("<|user|>", system_end)
                user_end = prompt.find("</s>", user_start)
                if user_start != -1 and user_end != -1:
                    user_part = prompt[user_start + len("<|user|>"):user_end].strip()
            except Exception:
                pass
                
            if system_part:
                messages.append({"role": "system", "content": system_part})
            if user_part:
                messages.append({"role": "user", "content": user_part})
            else:
                messages.append({"role": "user", "content": prompt})
        else:
            messages.append({"role": "user", "content": prompt})

        try:
            response = client.chat_completion(
                model=model,
                messages=messages,
                max_tokens=1024,
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"HF SDK Error: {str(e)}")

    @classmethod
    async def generate_summary(cls, document_text: str) -> dict:
        """Generate structured document summary, key topics, difficulty, and reading time."""
        # Simple reading time estimator (~200 words per minute)
        word_count = len(document_text.split())
        reading_time_mins = max(1, round(word_count / 200))
        reading_time_str = f"~{reading_time_mins} minutes"
        
        # Limit input text length to avoid context window overflow (safely take first 4000 characters)
        sample_text = document_text[:8000]

        prompt = f"<|system|>\nYou are an academic assistant. Analyze the document text and output ONLY a valid JSON object with the keys 'summary', 'key_topics', and 'difficulty'. Do not include any other markdown code-block symbols, comments, or conversational text. Example format:\n{{\"summary\": \"Exactly 5 sentences summarizing the material...\", \"key_topics\": [\"Topic 1\", \"Topic 2\", \"Topic 3\"], \"difficulty\": \"Beginner/Intermediate/Advanced\"}}\n</s>\n<|user|>\nDocument content:\n{sample_text}\n</s>\n<|assistant|>\n"
        
        try:
            raw_output = await cls.query_model_direct(prompt)
            data = cls._extract_json(raw_output)
            
            if data and isinstance(data, dict):
                return {
                    "summary": data.get("summary", "Summarization completed."),
                    "key_topics": data.get("key_topics", []),
                    "difficulty": data.get("difficulty", "Intermediate"),
                    "reading_time": reading_time_str
                }
        except Exception as e:
            print(f"Error in direct summary generation: {e}")
            
        # Robust Fallback
        return {
            "summary": "This study sheet provides key learning material. Use the AI chat tutor to deep dive into specific questions about this document.",
            "key_topics": ["General Study Guide"],
            "difficulty": "Intermediate",
            "reading_time": reading_time_str
        }

    @classmethod
    async def generate_questions(cls, document_text: str) -> List[str]:
        """Generate a structured list of 8-15 study and review questions."""
        sample_text = document_text[:8000]
        prompt = f"<|system|>\nYou are an exam designer. Analyze the document content and output ONLY a valid JSON object with the key 'questions' containing a list of exactly 10 questions. Include a mix of definition, explanation, and application questions. Do not write any conversational text or markdown code-block tags. Example format:\n{{\"questions\": [\"Question 1?\", \"Question 2?\"]}}\n</s>\n<|user|>\nDocument content:\n{sample_text}\n</s>\n<|assistant|>\n"
        
        try:
            raw_output = await cls.query_model_direct(prompt)
            data = cls._extract_json(raw_output)
            if data and isinstance(data, dict) and "questions" in data:
                return data["questions"]
        except Exception as e:
            print(f"Error generating questions: {e}")
            
        # Fallback
        return [
            "What are the core concepts introduced in this document?",
            "Can you explain the main arguments or processes defined in the text?",
            "How does the material apply to real-world scenarios?",
            "What are the key terms you must memorize from this lesson?"
        ]

    @classmethod
    async def generate_revision_notes(cls, document_text: str) -> dict:
        """Generate concise revision sheet: definitions, concepts, formulas, notes."""
        sample_text = document_text[:8000]
        prompt = f"<|system|>\nYou are a tutor creating study sheets. Extract key details from the document. Output ONLY a valid JSON object with keys 'definitions' (list of key term strings with definitions), 'concepts' (list of core idea strings), 'formulas' (list of formulas/rules), and 'notes' (list of bullet points). Do not write any conversational text or markdown tags. Example format:\n{{\"definitions\": [\"Term: Definition\"], \"concepts\": [\"Concept 1\"], \"formulas\": [\"Rule 1\"], \"notes\": [\"Bullet 1\"]}}\n</s>\n<|user|>\nDocument content:\n{sample_text}\n</s>\n<|assistant|>\n"
        
        try:
            raw_output = await cls.query_model_direct(prompt)
            data = cls._extract_json(raw_output)
            if data and isinstance(data, dict):
                return {
                    "definitions": data.get("definitions", []),
                    "concepts": data.get("concepts", []),
                    "formulas": data.get("formulas", []),
                    "notes": data.get("notes", [])
                }
        except Exception as e:
            print(f"Error generating revision notes: {e}")
            
        # Fallback
        return {
            "definitions": ["Core Term: Refer to the document text for key definition"],
            "concepts": ["Key Idea: Review the material utilizing the AI Tutor panel"],
            "formulas": ["Rule: Always identify primary parameters first"],
            "notes": ["Study notes: Review this sheet closely prior to tests"]
        }

    @classmethod
    async def generate_diagram(cls, topic: str, context: List[str]) -> dict:
        """Generate educational concept flowchart diagram in Mermaid syntax + explanation."""
        context_text = "\n".join(context)[:4000]
        
        prompt = f"<|system|>\nYou are an educational diagram designer. Create a valid Mermaid.js flowchart (starting with graph TD or graph LR) explaining the topic requested. Output ONLY a valid JSON object with the keys 'diagram' (the raw Mermaid diagram string) and 'explanation' (a brief 2-sentence description). Do not wrap the Mermaid code in backticks or markdown formatting. Example format:\n{{\"diagram\": \"graph TD\\n  A[Start] --> B[End]\", \"explanation\": \"This flowchart shows the process...\"}}\n</s>\n<|user|>\nDocument Context:\n{context_text}\n\nTopic to explain: {topic}\n</s>\n<|assistant|>\n"
        
        try:
            raw_output = await cls.query_model_direct(prompt)
            data = cls._extract_json(raw_output)
            if data and isinstance(data, dict) and "diagram" in data:
                return {
                    "diagram": data.get("diagram", "graph TD\n  A[Start] --> B[End]"),
                    "explanation": data.get("explanation", "Diagram representing the core topic relationship.")
                }
        except Exception as e:
            print(f"Error generating diagram: {e}")
            
        # Fallback
        return {
            "diagram": f"graph TD\n  A[Read document] --> B[Generate Diagram]\n  B --> C[{topic[:15]}]\n  C --> D[Review relationships]",
            "explanation": f"Concept map flowchart representing {topic}."
        }
