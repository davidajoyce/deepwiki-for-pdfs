// Mock data model types for development
export interface Id<TableName extends string> {
  readonly brand: unique symbol;
  readonly tableName: TableName;
}

export interface Document {
  _id: Id<"documents">;
  filename: string;
  originalName: string;
  fileId: Id<"_storage">;
  userId: string;
  collectionId?: Id<"collections">;
  uploadedAt: number;
  processingStatus: "uploaded" | "extracting" | "analyzing" | "indexing" | "completed" | "failed";
  metadata: {
    fileSize: number;
    mimeType: string;
    pageCount?: number;
    language?: string;
    extractedAt?: number;
    processingTimeMs?: number;
  };
  extractedContent?: any;
  fileUrl?: string;
}

export interface Collection {
  _id: Id<"collections">;
  name: string;
  description?: string;
  userId: string;
  createdAt: number;
  documentCount: number;
  isPublic: boolean;
  tags: string[];
}