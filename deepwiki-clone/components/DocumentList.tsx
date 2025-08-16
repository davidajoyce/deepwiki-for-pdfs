"use client";

import { useQuery, useMutation } from "@/lib/convex-provider";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface DocumentListProps {
  userId: string;
  collectionId?: Id<"collections">;
  refreshTrigger?: number;
}

export default function DocumentList({ userId, collectionId, refreshTrigger }: DocumentListProps) {
  const documents = useQuery(api.documents.getUserDocuments, { 
    userId, 
    collectionId 
  });
  const deleteDocument = useMutation(api.documents.deleteDocument);
  
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (documentId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(documentId));
    
    try {
      await deleteDocument({ documentId });
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

  if (documents === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

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
      {documents.map((document) => (
        <div
          key={document._id}
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
                    {getStatusBadge(document.processingStatus)}
                    <span className="text-sm text-gray-500">
                      {formatFileSize(document.metadata.fileSize)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Metadata */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Uploaded: {formatDate(document.uploadedAt)}</div>
                {document.metadata.pageCount && (
                  <div>Pages: {document.metadata.pageCount}</div>
                )}
                {document.metadata.language && (
                  <div>Language: {document.metadata.language}</div>
                )}
              </div>

              {/* Processing Info */}
              {document.processingStatus !== "completed" && document.processingStatus !== "failed" && (
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  🔄 Processing document...
                </div>
              )}

              {document.processingStatus === "failed" && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  ❌ Processing failed
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {document.fileUrl && (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  View
                </a>
              )}
              
              <button
                onClick={() => handleDelete(document._id)}
                disabled={deletingIds.has(document._id)}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded-md transition-colors disabled:opacity-50"
              >
                {deletingIds.has(document._id) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}