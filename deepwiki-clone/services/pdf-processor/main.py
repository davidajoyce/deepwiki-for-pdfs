#!/usr/bin/env python3
"""
PDF Processing Service for DeepWiki PDF Clone
Provides text extraction and document analysis capabilities
"""

import os
import tempfile
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import uvicorn

app = FastAPI(
    title="PDF Processing Service",
    description="Text extraction and analysis service for PDF documents",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models using dict instead of Pydantic BaseModel for simplicity

def extract_text_from_pdf(file_path: Path) -> Dict[str, Any]:
    """Extract text content from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract metadata
            metadata = {}
            if pdf_reader.metadata:
                metadata = {
                    'title': pdf_reader.metadata.title or '',
                    'author': pdf_reader.metadata.author or '',
                    'subject': pdf_reader.metadata.subject or '',
                    'creator': pdf_reader.metadata.creator or '',
                    'producer': pdf_reader.metadata.producer or '',
                    'creation_date': str(pdf_reader.metadata.creation_date) if pdf_reader.metadata.creation_date else '',
                    'modification_date': str(pdf_reader.metadata.modification_date) if pdf_reader.metadata.modification_date else ''
                }
            
            # Extract text from all pages
            full_text = ""
            sections = []
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    full_text += page_text + "\n\n"
                    
                    # Create section for each page
                    sections.append({
                        'type': 'page',
                        'page_number': page_num + 1,
                        'content': page_text.strip(),
                        'word_count': len(page_text.split()),
                        'char_count': len(page_text)
                    })
                except Exception as e:
                    print(f"Error extracting text from page {page_num + 1}: {e}")
                    sections.append({
                        'type': 'page',
                        'page_number': page_num + 1,
                        'content': '[Error extracting text from this page]',
                        'word_count': 0,
                        'char_count': 0,
                        'error': str(e)
                    })
            
            return {
                'text_content': full_text.strip(),
                'page_count': len(pdf_reader.pages),
                'word_count': len(full_text.split()),
                'metadata': metadata,
                'sections': sections
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "PDF Processing Service", 
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "pdf-processor",
        "capabilities": [
            "text_extraction",
            "metadata_extraction", 
            "page_analysis"
        ]
    }

@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    document_id: Optional[str] = None
):
    """Extract text content from uploaded PDF"""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Generate document ID if not provided
    if not document_id:
        document_id = f"doc_{int(time.time())}"
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = Path(temp_file.name)
        
        # Extract text and metadata
        extraction_result = extract_text_from_pdf(temp_file_path)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "text_content": extraction_result['text_content'],
            "page_count": extraction_result['page_count'],
            "word_count": extraction_result['word_count'],
            "metadata": extraction_result['metadata'],
            "sections": extraction_result['sections']
        }
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals() and temp_file_path.exists():
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/analyze-document")
async def analyze_document(
    file: UploadFile = File(...),
    document_id: Optional[str] = None
):
    """Perform comprehensive document analysis including text extraction and basic NLP"""
    
    # First extract text
    extraction_response = await extract_text(file, document_id)
    
    # Perform basic analysis
    text = extraction_response['text_content']
    
    # Simple text analysis
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    # Basic statistics
    analysis = {
        'document_id': extraction_response['document_id'],
        'filename': extraction_response['filename'],
        'basic_stats': {
            'page_count': extraction_response['page_count'],
            'word_count': extraction_response['word_count'],
            'sentence_count': len(sentences),
            'paragraph_count': len(paragraphs),
            'avg_words_per_page': extraction_response['word_count'] / extraction_response['page_count'] if extraction_response['page_count'] > 0 else 0
        },
        'text_content': extraction_response['text_content'],
        'metadata': extraction_response['metadata'],
        'sections': extraction_response['sections'],
        'analysis_timestamp': int(time.time() * 1000)
    }
    
    return analysis

if __name__ == "__main__":
    import time
    uvicorn.run(app, host="0.0.0.0", port=8001)