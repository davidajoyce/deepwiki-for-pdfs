import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new collection
export const createCollection = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const collectionId = await ctx.db.insert("collections", {
      name: args.name,
      description: args.description || "",
      userId: args.userId,
      createdAt: Date.now(),
      documentCount: 0,
      isPublic: args.isPublic || false,
      tags: args.tags || [],
    });

    return collectionId;
  },
});

// Get user's collections
export const getUserCollections = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return collections;
  },
});

// Get a specific collection
export const getCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.collectionId);
  },
});

// Update a collection
export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { collectionId, ...updates } = args;
    
    const collection = await ctx.db.get(collectionId);
    if (!collection) throw new Error("Collection not found");

    await ctx.db.patch(collectionId, {
      ...updates,
    });
  },
});

// Delete a collection
export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) throw new Error("Collection not found");

    // Check if collection has documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    if (documents.length > 0) {
      throw new Error("Cannot delete collection with documents. Remove documents first.");
    }

    await ctx.db.delete(args.collectionId);
  },
});