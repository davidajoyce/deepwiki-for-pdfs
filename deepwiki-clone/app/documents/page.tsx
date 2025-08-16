"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import EnhancedPDFUpload from "@/components/EnhancedPDFUpload";
import EnhancedDocumentList from "@/components/EnhancedDocumentList";
import { PDFAnalysisResult } from "@/lib/pdf-service";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedAt: number;
  status: string;
  textContent?: string;
  analysis?: PDFAnalysisResult;
}

export default function SimpleDocumentsPage() {
  const { user, isLoading } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleUploadComplete = (newDocs: Document[]) => {
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Please sign in to manage documents</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Documents</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and manage your PDF documents for AI-powered analysis
        </p>
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            📍 <strong>Phase 2:</strong> Enhanced upload with PDF text extraction and analysis. Start the PDF processing service for full functionality.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Upload Section */}
        <div className="lg:col-span-4">
          <div className="sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Upload PDFs</h2>
            <EnhancedPDFUpload onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {/* Document List Section */}
        <div className="lg:col-span-8">
          <h2 className="text-xl font-semibold mb-4">
            Your Documents ({documents.length})
          </h2>
          <EnhancedDocumentList 
            documents={documents}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}