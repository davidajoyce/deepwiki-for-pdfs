"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { pdfService, PDFAnalysisResult } from "@/lib/pdf-service";

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

interface EnhancedPDFUploadProps {
  onUploadComplete?: (docs: Document[]) => void;
}

export default function EnhancedPDFUpload({ onUploadComplete }: EnhancedPDFUploadProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  
  // Check service availability on component mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const isHealthy = await pdfService.healthCheck();
      setServiceAvailable(isHealthy);
    } catch {
      setServiceAvailable(false);
    }
  };

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
      const uploadedDocs: Document[] = [];
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const documentId = `doc_${Date.now()}_${i}`;
        
        setUploadProgress(prev => [...prev, `📄 Processing ${file.name}...`]);

        try {
          let analysis: PDFAnalysisResult | undefined;
          let textContent = "";
          let status = "uploaded";

          // Try to process with real service if available
          if (serviceAvailable) {
            setUploadProgress(prev => 
              prev.map((msg, idx) => 
                idx === i ? `🔍 Extracting text from ${file.name}...` : msg
              )
            );

            analysis = await pdfService.analyzeDocument(file, documentId);
            textContent = analysis.text_content;
            status = "processed";

            setUploadProgress(prev => 
              prev.map((msg, idx) => 
                idx === i ? `📊 Analyzing ${file.name}...` : msg
              )
            );
          } else {
            // Fallback to mock processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            status = "uploaded";
          }
        
          const newDoc: Document = {
            id: documentId,
            filename: `${Date.now()}_${file.name}`,
            originalName: file.name,
            fileSize: file.size,
            uploadedAt: Date.now(),
            status,
            textContent,
            analysis
          };
        
          uploadedDocs.push(newDoc);

          setUploadProgress(prev => 
            prev.map((msg, idx) => 
              idx === i ? `✅ ${file.name} processed successfully` : msg
            )
          );
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          
          // Create document with error status
          const newDoc: Document = {
            id: documentId,
            filename: `${Date.now()}_${file.name}`,
            originalName: file.name,
            fileSize: file.size,
            uploadedAt: Date.now(),
            status: "failed"
          };
          
          uploadedDocs.push(newDoc);
          
          setUploadProgress(prev => 
            prev.map((msg, idx) => 
              idx === i ? `❌ Failed to process ${file.name}` : msg
            )
          );
        }
      }

      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress([]);
        setIsUploading(false);
      }, 3000);

      onUploadComplete?.(uploadedDocs);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(prev => [...prev, "❌ Upload process failed"]);
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

  const getServiceStatusIndicator = () => {
    if (serviceAvailable === null) {
      return <span className="text-yellow-600">🔄 Checking service...</span>;
    }
    if (serviceAvailable) {
      return <span className="text-green-600">🟢 PDF Processing Service Online</span>;
    }
    return <span className="text-orange-600">🟡 Using Mock Processing (Service Offline)</span>;
  };

  return (
    <div className="space-y-4">
      {/* Service Status */}
      <div className="text-sm">
        {getServiceStatusIndicator()}
      </div>

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
            {isUploading ? "Processing PDFs..." : "Upload PDF Files"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isUploading 
              ? "Please wait while files are being processed" 
              : "Click to browse or drag and drop PDF files here"
            }
          </div>
          {serviceAvailable && (
            <div className="text-xs text-green-600 dark:text-green-400">
              ✨ Full text extraction and analysis enabled
            </div>
          )}
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
          <h3 className="font-medium">Processing Progress:</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
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

      {/* Service Management */}
      {!serviceAvailable && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>📝 Note:</strong> PDF Processing Service is offline. To enable full text extraction:
            <br />
            <code className="text-xs bg-yellow-100 dark:bg-yellow-800 px-1 rounded">
              cd services/pdf-processor && ./start.sh
            </code>
          </div>
        </div>
      )}
    </div>
  );
}