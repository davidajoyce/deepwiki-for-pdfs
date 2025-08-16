import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Upload a new document
export const uploadDocument = mutation({
  args: {
    filename: v.string(),
    originalName: v.string(),
    fileId: v.id("_storage"),
    userId: v.string(),
    collectionId: v.optional(v.id("collections")),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Create document record
    const documentId = await ctx.db.insert("documents", {
      filename: args.filename,
      originalName: args.originalName,
      fileId: args.fileId,
      userId: args.userId,
      collectionId: args.collectionId,
      uploadedAt: Date.now(),
      processingStatus: "uploaded",
      metadata: {
        fileSize: args.fileSize,
        mimeType: args.mimeType,
      },
    });

    // Update collection document count if document is in a collection
    if (args.collectionId) {
      const collection = await ctx.db.get(args.collectionId);
      if (collection) {
        await ctx.db.patch(args.collectionId, {
          documentCount: collection.documentCount + 1,
        });
      }
    }

    return documentId;
  },
});

// Get user's documents
export const getUserDocuments = query({
  args: {
    userId: v.string(),
    collectionId: v.optional(v.id("collections")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.collectionId) {
      query = ctx.db
        .query("documents")
        .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId));
    }

    const documents = await query.collect();
    
    // Add file URLs for displaying
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const fileUrl = await ctx.storage.getUrl(doc.fileId);
        return {
          ...doc,
          fileUrl,
        };
      })
    );

    return documentsWithUrls;
  },
});

// Get a specific document
export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) return null;

    const fileUrl = await ctx.storage.getUrl(document.fileId);
    return {
      ...document,
      fileUrl,
    };
  },
});

// Update document processing status
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("extracting"),
      v.literal("analyzing"),
      v.literal("indexing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    metadata: v.optional(v.object({
      pageCount: v.optional(v.number()),
      language: v.optional(v.string()),
      extractedAt: v.optional(v.number()),
      processingTimeMs: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    await ctx.db.patch(args.documentId, {
      processingStatus: args.status,
      ...(args.metadata && {
        metadata: {
          ...document.metadata,
          ...args.metadata,
        },
      }),
    });
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Delete the file from storage
    await ctx.storage.delete(document.fileId);

    // Update collection document count
    if (document.collectionId) {
      const collection = await ctx.db.get(document.collectionId);
      if (collection) {
        await ctx.db.patch(document.collectionId, {
          documentCount: Math.max(0, collection.documentCount - 1),
        });
      }
    }

    // Delete the document record
    await ctx.db.delete(args.documentId);
  },
});

// Generate upload URL for file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});