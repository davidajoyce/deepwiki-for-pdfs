// Mock API for development without full Convex setup
export const api = {
  documents: {
    uploadDocument: "documents:uploadDocument",
    getUserDocuments: "documents:getUserDocuments", 
    getDocument: "documents:getDocument",
    updateDocumentStatus: "documents:updateDocumentStatus",
    deleteDocument: "documents:deleteDocument",
    generateUploadUrl: "documents:generateUploadUrl",
  },
  collections: {
    createCollection: "collections:createCollection",
    getUserCollections: "collections:getUserCollections",
    getCollection: "collections:getCollection", 
    updateCollection: "collections:updateCollection",
    deleteCollection: "collections:deleteCollection",
  },
} as const;