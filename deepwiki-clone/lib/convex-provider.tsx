"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import { Document } from "@/convex/_generated/dataModel";

// Mock Convex provider for development
interface MockConvexContext {
  documents: Document[];
  addDocument: (doc: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const MockConvexContext = createContext<MockConvexContext | null>(null);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addDocument = (doc: Partial<Document>) => {
    const newDoc: Document = {
      _id: `doc_${Date.now()}` as any,
      filename: doc.filename || "unknown.pdf",
      originalName: doc.originalName || "unknown.pdf", 
      fileId: `file_${Date.now()}` as any,
      userId: doc.userId || "mock_user",
      uploadedAt: Date.now(),
      processingStatus: "uploaded",
      metadata: {
        fileSize: doc.metadata?.fileSize || 0,
        mimeType: "application/pdf",
      },
      fileUrl: "/api/mock-pdf", // Mock URL
      ...doc,
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc._id !== id));
  };

  return (
    <MockConvexContext.Provider value={{
      documents,
      addDocument,
      removeDocument,
      isUploading,
      setIsUploading,
    }}>
      {children}
    </MockConvexContext.Provider>
  );
}

// Mock hooks
export function useQuery(query: string, args?: any) {
  const context = useContext(MockConvexContext);
  
  if (query.includes("getUserDocuments")) {
    return context?.documents || [];
  }
  
  return undefined;
}

export function useMutation(mutation: string) {
  const context = useContext(MockConvexContext);
  
  if (mutation.includes("generateUploadUrl")) {
    return async () => "/api/mock-upload";
  }
  
  if (mutation.includes("uploadDocument")) {
    return async (args: any) => {
      context?.addDocument(args);
      return "mock_doc_id";
    };
  }
  
  if (mutation.includes("deleteDocument")) {
    return async (args: any) => {
      context?.removeDocument(args.documentId);
    };
  }
  
  return async () => {};
}