"use client";

import { useState, useRef } from "react";
import { useMutation } from "@/lib/convex-provider";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/lib/user-context";

interface PDFUploadProps {
  onUploadComplete?: () => void;
  collectionId?: string;
}

export default function PDFUpload({ onUploadComplete, collectionId }: PDFUploadProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const uploadDocument = useMutation(api.documents.uploadDocument);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !user) return;

    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      alert("Please select PDF files only");
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);

    try {
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        setUploadProgress(prev => [...prev, `Uploading ${file.name}...`]);

        // Mock upload process - in real implementation this would upload to Convex
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time
        
        // Create document record
        await uploadDocument({
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          userId: user.id,
          collectionId: collectionId,
          metadata: {
            fileSize: file.size,
            mimeType: file.type,
          },
        });

        setUploadProgress(prev => 
          prev.map((msg, idx) => 
            idx === i ? `✅ ${file.name} uploaded successfully` : msg
          )
        );
      }

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress([]);
        setIsUploading(false);
      }, 2000);

      onUploadComplete?.();

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(prev => [...prev, "❌ Upload failed"]);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isUploading 
            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
        `}
      >
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <div className="text-lg font-medium">
            {isUploading ? "Uploading..." : "Upload PDF Files"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isUploading 
              ? "Please wait while files are being uploaded" 
              : "Click to browse or drag and drop PDF files here"
            }
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Supports multiple file selection
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Upload Progress:</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="text-sm">
                {progress}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button (Alternative) */}
      {!isUploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Select PDF Files
        </button>
      )}
    </div>
  );
}