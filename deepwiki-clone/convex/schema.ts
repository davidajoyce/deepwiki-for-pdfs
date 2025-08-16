import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
    documentCount: v.number(),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
  }).index("by_user", ["userId"]),

  documents: defineTable({
    filename: v.string(),
    originalName: v.string(),
    fileId: v.id("_storage"),
    userId: v.string(),
    collectionId: v.optional(v.id("collections")),
    uploadedAt: v.number(),
    processingStatus: v.union(
      v.literal("uploaded"),
      v.literal("extracting"),
      v.literal("analyzing"),
      v.literal("indexing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    metadata: v.object({
      fileSize: v.number(),
      mimeType: v.string(),
      pageCount: v.optional(v.number()),
      language: v.optional(v.string()),
      extractedAt: v.optional(v.number()),
      processingTimeMs: v.optional(v.number()),
    }),
    extractedContent: v.optional(v.object({
      pages: v.array(v.object({
        pageNumber: v.number(),
        headings: v.array(v.string()),
        paragraphs: v.array(v.string()),
        fullText: v.string(),
      })),
      keyConcepts: v.array(v.object({
        text: v.string(),
        type: v.string(),
        frequency: v.number(),
        pages: v.array(v.number()),
      })),
    })),
  }).index("by_user", ["userId"])
    .index("by_collection", ["collectionId"])
    .index("by_status", ["processingStatus"]),

  searches: defineTable({
    query: v.string(),
    userId: v.string(),
    collectionId: v.optional(v.id("collections")),
    searchType: v.union(v.literal("fast"), v.literal("deep")),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    results: v.optional(v.object({
      content: v.string(),
      documentRefs: v.array(v.object({
        documentName: v.string(),
        documentId: v.id("documents"),
        page: v.number(),
        section: v.optional(v.string()),
        paragraph: v.optional(v.number()),
      })),
      documentSnippets: v.array(v.object({
        documentId: v.id("documents"),
        documentName: v.string(),
        relevantPages: v.array(v.number()),
        excerpts: v.array(v.string()),
      })),
      confidence: v.number(),
    })),
    error: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_collection", ["collectionId"]),
});