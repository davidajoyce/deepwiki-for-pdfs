"use client";

import { useState } from "react";
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

interface EnhancedDocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
}

export default function EnhancedDocumentList({ documents, onDelete }: EnhancedDocumentListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(documentId));
    
    try {
      // Simulate delete operation
      await new Promise(resolve => setTimeout(resolve, 500));
      onDelete?.(documentId);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (documentId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploaded: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", text: "Uploaded" },
      extracting: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", text: "Extracting" },
      analyzing: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", text: "Analyzing" },
      indexing: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", text: "Indexing" },
      processed: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", text: "Processed" },
      completed: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", text: "Ready" },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploaded;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const truncateText = (text: string, limit: number = 200): string => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">No documents yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your first PDF to get started with AI-powered document analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const isExpanded = expandedDocs.has(document.id);
        const hasContent = document.textContent || document.analysis;
        
        return (
          <div
            key={document.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Document Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">
                      {document.originalName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(document.status)}
                      <span className="text-sm text-gray-500">
                        {formatFileSize(document.fileSize)}
                      </span>
                      {document.analysis && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          ✨ Analyzed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Analysis Stats */}
                {document.analysis && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>📄 {document.analysis.basic_stats.page_count} pages</div>
                      <div>📝 {document.analysis.basic_stats.word_count.toLocaleString()} words</div>
                      <div>📊 {document.analysis.basic_stats.sentence_count} sentences</div>
                      <div>📑 {document.analysis.basic_stats.paragraph_count} paragraphs</div>
                    </div>
                  </div>
                )}

                {/* Document Metadata */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Uploaded: {formatDate(document.uploadedAt)}</div>
                  {document.analysis?.metadata?.title && (
                    <div>Title: {document.analysis.metadata.title}</div>
                  )}
                  {document.analysis?.metadata?.author && (
                    <div>Author: {document.analysis.metadata.author}</div>
                  )}
                </div>

                {/* Content Preview */}
                {hasContent && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpanded(document.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {isExpanded ? "🔼 Hide Content" : "🔽 Show Content Preview"}
                    </button>
                    
                    {isExpanded && document.textContent && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Extracted Text:</h4>
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {isExpanded ? document.textContent : truncateText(document.textContent)}
                          </pre>
                        </div>
                        {document.analysis && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <h5 className="font-medium mb-1">Analysis Summary:</h5>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Average words per page: {document.analysis.basic_stats.avg_words_per_page.toFixed(1)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDelete(document.id)}
                  disabled={deletingIds.has(document.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded-md transition-colors disabled:opacity-50"
                >
                  {deletingIds.has(document.id) ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}