/**
 * PDF Processing Service Client
 * Handles communication with the Python FastAPI PDF processing service
 */

export interface PDFExtractedContent {
  document_id: string;
  filename: string;
  text_content: string;
  page_count: number;
  word_count: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creation_date?: string;
    modification_date?: string;
  };
  sections: Array<{
    type: string;
    page_number: number;
    content: string;
    word_count: number;
    char_count: number;
    error?: string;
  }>;
}

export interface PDFAnalysisResult extends PDFExtractedContent {
  basic_stats: {
    page_count: number;
    word_count: number;
    sentence_count: number;
    paragraph_count: number;
    avg_words_per_page: number;
  };
  analysis_timestamp: number;
}

class PDFService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async extractText(file: File, documentId?: string): Promise<PDFExtractedContent> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentId) {
      formData.append('document_id', documentId);
    }

    const response = await fetch(`${this.baseUrl}/extract-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async analyzeDocument(file: File, documentId?: string): Promise<PDFAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentId) {
      formData.append('document_id', documentId);
    }

    const response = await fetch(`${this.baseUrl}/analyze-document`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export const pdfService = new PDFService();