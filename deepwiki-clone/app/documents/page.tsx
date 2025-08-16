"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import SimplePDFUpload from "@/components/SimplePDFUpload";
import SimpleDocumentList from "@/components/SimpleDocumentList";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedAt: number;
  status: string;
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
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📍 <strong>Phase 1 Demo:</strong> This is a basic upload interface. Document processing, search, and AI analysis will be implemented in future phases.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Upload Section */}
        <div className="lg:col-span-4">
          <div className="sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Upload PDFs</h2>
            <SimplePDFUpload onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {/* Document List Section */}
        <div className="lg:col-span-8">
          <h2 className="text-xl font-semibold mb-4">
            Your Documents ({documents.length})
          </h2>
          <SimpleDocumentList 
            documents={documents}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}