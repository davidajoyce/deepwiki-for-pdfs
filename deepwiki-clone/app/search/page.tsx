"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import SearchInterface from "@/components/SearchInterface";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedAt: number;
  status: string;
  textContent?: string;
  analysis?: any;
}

export default function SearchPage() {
  const { user, isLoading } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);

  // Load documents from localStorage (shared with documents page)
  useEffect(() => {
    const savedDocs = localStorage.getItem('deepwiki-documents');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    }
  }, []);

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
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-lg mb-2">Please sign in to search documents</div>
          <p className="text-gray-600 dark:text-gray-400">
            Authentication is required to access your document library
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchInterface documents={documents} />
    </div>
  );
}