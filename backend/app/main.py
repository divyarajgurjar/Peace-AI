import os
import requests
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pymupdf as fitz
from typing import Union
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import GPT2TokenizerFast
import tiktoken
from datetime import datetime
import pickle
import hashlib
import sqlite3
import re
from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DB setup for caching summaries ===
conn = sqlite3.connect("summaries.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS summary_cache
                  (chunk_hash TEXT PRIMARY KEY, summary TEXT)''')
conn.commit()

# === Models and utilities ===
model = SentenceTransformer('all-MiniLM-L6-v2')
tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")
encoder = tiktoken.get_encoding("gpt2")

def count_tokens(text):
    return len(encoder.encode(text))

def ask_llama(prompt: str, model: str = "llama3-8b-8192", max_tokens: int = 1000) -> str:
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": max_tokens,
            }
        )
        response.raise_for_status()
        data = response.json()
        logger.debug(f"Groq API response: {data}")
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error in ask_llama(): {str(e)}")
        return f"Error communicating with Groq LLaMA 3 API: {str(e)}"


# === Chunking ===
def chunk_text(text, max_tokens=300, overlap=0.2):
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = []
    current_tokens = 0
    for para in paragraphs:
        tokens = count_tokens(para)
        if current_tokens + tokens > max_tokens:
            chunks.append("\n".join(current))
            overlap_len = int(len(current) * overlap)
            current = current[-overlap_len:] if overlap_len > 0 else []
            current_tokens = sum(count_tokens(p) for p in current)
        current.append(para)
        current_tokens += tokens
    if current:
        chunks.append("\n".join(current))
    return chunks

# === PDF Management ===
pdf_store = {}

def create_index():
    return faiss.IndexFlatL2(384)

# === Summarization with caching ===
def hash_text(text):
    return hashlib.sha256(text.encode()).hexdigest()

def get_summary_cached(chunk):
    chunk_hash = hash_text(chunk)
    cursor.execute("SELECT summary FROM summary_cache WHERE chunk_hash=?", (chunk_hash,))
    result = cursor.fetchone()
    if result:
        return result[0]
    
    summary = ask_llama(f"Summarize this chunk for technical QA:\n\n{chunk}")
    
    try:
        cursor.execute("INSERT INTO summary_cache VALUES (?, ?)", (chunk_hash, summary))
        conn.commit()
    except Exception as e:
        return {"error": f"Failed to cache summary: {str(e)}"}
    
    return summary


# === Embedding ===
def process_pdf(pdf_id: str, text: str):
    try:
        index = create_index()  # Use correct dimensionality
        chunks = chunk_text(text)
        chunks_meta = []
        for i, chunk in enumerate(chunks):
            embedding = model.encode(chunk)  # SentenceTransformer output
            embedding = np.array([embedding], dtype=np.float32)  # Ensure correct type
            index.add(embedding)
            chunks_meta.append({"page": i, "chunk": chunk})

        pdf_store[pdf_id] = {
            "index": index,
            "chunks": chunks,
            "metadata": chunks_meta,
        }

        return {"pdf_id": pdf_id, "message": "Embeddings generated", "total_chunks": len(chunks)}
    except Exception as e:
        return {"error": str(e)}


# === Hierarchical QA ===
def truncate_chunks(chunks, max_tokens=3000):
    total_tokens = 0
    final_chunks = []
    for chunk in chunks:
        tokens = count_tokens(chunk)
        if total_tokens + tokens > max_tokens:
            break
        final_chunks.append(chunk)
        total_tokens += tokens
    return final_chunks

def get_answer(pdf_id: str, question: str):
    try:
        if pdf_id not in pdf_store:
            return {"error": "Invalid PDF ID"}

        index = pdf_store[pdf_id]["index"]
        chunks = pdf_store[pdf_id]["chunks"]

        question_embedding = model.encode(question)
        question_embedding = np.array([question_embedding])
        D, I = index.search(question_embedding.astype('float32'), k=10)
        if I.size == 0:
            return {"error": "No relevant content found for the given question."}

        raw_chunks = [chunks[i] for i in I[0]]
        truncated_chunks = truncate_chunks(raw_chunks)

        if sum(count_tokens(c) for c in truncated_chunks) > 3000:
            summarized = [get_summary_cached(c) for c in truncated_chunks]
            prompt = "\n\n".join(summarized) + f"\n\nQuestion: {question}"
        else:
            prompt = "\n\n".join(truncated_chunks) + f"\n\nQuestion: {question}"

        response = ask_llama(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

# === PDF Text Extraction ===
def extract_text_from_pdf(pdf_data: bytes) -> Union[str, dict]:
    try:
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text
    except Exception as e:
        return {"error": f"Failed to extract text from PDF: {str(e)}"}

# === Routes ===
@app.post("/upload")
async def upload_pdfs(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
    results = []
    for file in files:
        try:
            contents = await file.read()
            extracted_text = extract_text_from_pdf(contents)
            if isinstance(extracted_text, dict):  # Handle errors during extraction
                results.append({"filename": file.filename, "error": extracted_text["error"]})
                continue

            pdf_id = str(uuid4())  # Generate a new PDF ID
            result = process_pdf(pdf_id, extracted_text)  # Process the PDF
            result['pdf_id'] = pdf_id  # Add the PDF ID to the result before appending to results
            results.append({**result, "filename": file.filename})  # Include PDF ID in the response
        except Exception as e:
            results.append({"filename": file.filename, "error": f"An error occurred: {str(e)}"})
    
    return results



@app.post("/ask")
async def ask_question(pdf_id: str = Form(...), question: str = Form(...)):
    try:
        result = get_answer(pdf_id, question)
        if "response" not in result:
            return JSONResponse(status_code=400, content=result)
        return result
    except Exception as e:
        return {"error": f"Error during question answering: {str(e)}"}
@app.get("/")    
async def root():
    return {"message": "Welcome to the PDF Q&A API!"}
