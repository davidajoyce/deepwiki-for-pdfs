# PDF DeepWiki Implementation Plan

## Overview

This document outlines a comprehensive plan to adapt the DeepWiki experience for PDF document analysis. Users will upload PDFs, we'll index and analyze them to find relationships, and present the information using a similar interface to the code-based DeepWiki.

## Core Concept Translation

### From Code to Documents

| DeepWiki (Code) | PDF DeepWiki (Documents) |
|-----------------|--------------------------|
| **Repository** | **Document Collection** |
| **Code Files** | **PDF Documents** |
| **Code Lines** | **Text Sections/Paragraphs** |
| **File References** | **Document References** |
| **Syntax Highlighting** | **Text Highlighting** |
| **Function/Class Names** | **Key Terms/Concepts** |
| **Import Statements** | **Cross-References** |

### User Experience Flow

1. **Upload Phase**: User uploads multiple PDFs
2. **Processing Phase**: System extracts, analyzes, and indexes content
3. **Search Phase**: User asks questions about the documents
4. **Results Phase**: System returns relevant sections with cross-references
5. **Deep Dive**: User can explore relationships between documents

## Technical Architecture

### Backend Technology Stack

**Primary Choice: Convex + Specialized Services**

#### Core Backend: Convex
- **Document Storage**: PDF files and metadata
- **User Management**: Authentication and collections
- **Real-time Updates**: Processing status and search results
- **API Layer**: All CRUD operations and search orchestration

#### Specialized Services (External/Microservices)
- **PDF Processing**: Python service for text extraction and analysis
- **Vector Search**: Pinecone or Weaviate for semantic search
- **AI/LLM**: OpenAI or Anthropic for content analysis

### Why This Hybrid Approach?

**Convex Strengths**:
- ✅ Real-time updates perfect for processing status
- ✅ File upload and storage handling
- ✅ Built-in authentication and user management
- ✅ TypeScript throughout the stack
- ✅ Excellent developer experience

**Convex Limitations for Our Use Case**:
- ❌ Limited text processing capabilities
- ❌ No built-in vector search
- ❌ Complex AI/ML workflows better handled externally

**Solution**: Use Convex as the orchestrator with specialized services

## Detailed Technical Implementation

### 1. Document Processing Pipeline

#### Phase 1: PDF Upload and Storage
```typescript
// Convex Schema
defineSchema({
  documents: defineTable({
    filename: v.string(),
    fileId: v.id("_storage"), // Convex file storage
    userId: v.id("users"),
    collectionId: v.optional(v.id("collections")),
    uploadedAt: v.number(),
    processingStatus: v.union(
      v.literal("uploading"),
      v.literal("extracting"),
      v.literal("analyzing"),
      v.literal("indexing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    metadata: v.object({
      fileSize: v.number(),
      pageCount: v.optional(v.number()),
      language: v.optional(v.string()),
      extractedAt: v.optional(v.number()),
    }),
  }),
  
  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    createdAt: v.number(),
    documentCount: v.number(),
  }),
})
```

#### Phase 2: Text Extraction Service
```python
# Python PDF Processing Service
import fitz  # PyMuPDF
import spacy
from typing import List, Dict, Any

class PDFProcessor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
    
    def extract_text_with_structure(self, pdf_path: str) -> Dict[str, Any]:
        """Extract text while preserving document structure"""
        doc = fitz.open(pdf_path)
        
        structured_content = {
            "metadata": {
                "page_count": len(doc),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
            },
            "pages": [],
            "sections": [],
            "key_terms": [],
            "references": []
        }
        
        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            page_blocks = page.get_text("dict")["blocks"]
            
            # Extract structured content
            page_content = self._process_page_content(
                page_text, page_blocks, page_num
            )
            structured_content["pages"].append(page_content)
        
        # Perform document-level analysis
        structured_content.update(self._analyze_document_structure(doc))
        
        return structured_content
    
    def _process_page_content(self, text: str, blocks: List, page_num: int):
        """Process individual page content"""
        paragraphs = []
        headings = []
        
        for block in blocks:
            if "lines" in block:
                for line in block["lines"]:
                    # Detect headings vs paragraphs based on formatting
                    text_content = ""
                    font_size = 0
                    
                    for span in line["spans"]:
                        text_content += span["text"]
                        font_size = max(font_size, span["size"])
                    
                    if self._is_heading(text_content, font_size):
                        headings.append({
                            "text": text_content.strip(),
                            "page": page_num,
                            "font_size": font_size,
                            "bbox": line["bbox"]
                        })
                    else:
                        paragraphs.append({
                            "text": text_content.strip(),
                            "page": page_num,
                            "bbox": line["bbox"]
                        })
        
        return {
            "page_number": page_num,
            "headings": headings,
            "paragraphs": paragraphs,
            "full_text": text
        }
```

#### Phase 3: Content Analysis and Relationship Discovery
```python
class DocumentAnalyzer:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")  # Larger model for similarity
    
    def find_cross_references(self, documents: List[Dict]) -> List[Dict]:
        """Find relationships between documents"""
        references = []
        
        for i, doc1 in enumerate(documents):
            for j, doc2 in enumerate(documents[i+1:], i+1):
                similarity_score = self._calculate_document_similarity(doc1, doc2)
                
                if similarity_score > 0.7:  # Threshold for related documents
                    shared_concepts = self._find_shared_concepts(doc1, doc2)
                    
                    references.append({
                        "doc1_id": doc1["id"],
                        "doc2_id": doc2["id"],
                        "similarity_score": similarity_score,
                        "shared_concepts": shared_concepts,
                        "relationship_type": self._classify_relationship(shared_concepts)
                    })
        
        return references
    
    def extract_key_concepts(self, document: Dict) -> List[Dict]:
        """Extract important concepts and terms"""
        full_text = " ".join([page["full_text"] for page in document["pages"]])
        doc_nlp = self.nlp(full_text)
        
        # Extract entities, key phrases, and important terms
        concepts = []
        
        # Named entities
        for ent in doc_nlp.ents:
            concepts.append({
                "text": ent.text,
                "type": "entity",
                "label": ent.label_,
                "frequency": full_text.count(ent.text),
                "pages": self._find_concept_pages(ent.text, document["pages"])
            })
        
        # Key phrases (using custom extraction)
        key_phrases = self._extract_key_phrases(doc_nlp)
        concepts.extend(key_phrases)
        
        return concepts
```

### 2. Vector Search Implementation

#### Embedding Generation and Storage
```typescript
// Convex function for coordinating vector operations
export const indexDocumentContent = internalMutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) throw new Error("Document not found");
    
    // Call external service to generate embeddings
    const embeddings = await generateEmbeddings(document);
    
    // Store in vector database (Pinecone/Weaviate)
    await storeEmbeddings(documentId, embeddings);
    
    // Update processing status
    await ctx.db.patch(documentId, {
      processingStatus: "indexing"
    });
  },
});

// External service integration
async function generateEmbeddings(document: any) {
  const chunks = chunkDocumentContent(document);
  
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: chunk.content,
      });
      
      return {
        id: `${document._id}_${chunk.id}`,
        text: chunk.content,
        embedding: response.data[0].embedding,
        metadata: {
          document_id: document._id,
          page: chunk.page,
          section: chunk.section,
          chunk_index: chunk.id,
        }
      };
    })
  );
  
  return embeddings;
}
```

### 3. Search and Query Interface

#### Search API Design
```typescript
// Convex mutation for handling search queries
export const searchDocuments = mutation({
  args: {
    query: v.string(),
    collectionId: v.optional(v.id("collections")),
    searchType: v.union(v.literal("fast"), v.literal("deep")),
  },
  handler: async (ctx, { query, collectionId, searchType }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");
    
    // Create search record
    const searchId = await ctx.db.insert("searches", {
      query,
      userId: user.subject,
      collectionId,
      searchType,
      status: "processing",
      createdAt: Date.now(),
    });
    
    // Trigger async search processing
    await ctx.scheduler.runAfter(0, internal.search.processSearch, {
      searchId,
      query,
      collectionId,
      searchType,
    });
    
    return { searchId };
  },
});

// Internal search processing
export const processSearch = internalAction({
  args: {
    searchId: v.id("searches"),
    query: v.string(),
    collectionId: v.optional(v.id("collections")),
    searchType: v.union(v.literal("fast"), v.literal("deep")),
  },
  handler: async (ctx, args) => {
    try {
      // Perform vector search
      const searchResults = await performVectorSearch(args.query, args.collectionId);
      
      // Generate contextual response using LLM
      const response = await generateSearchResponse(searchResults, args.query, args.searchType);
      
      // Update search with results
      await ctx.runMutation(internal.search.updateSearchResults, {
        searchId: args.searchId,
        results: response,
      });
      
    } catch (error) {
      await ctx.runMutation(internal.search.updateSearchStatus, {
        searchId: args.searchId,
        status: "failed",
        error: error.message,
      });
    }
  },
});
```

### 4. Frontend Adaptation

#### Document References Display
```typescript
// Adapted from code references to document references
interface DocumentReference {
  documentName: string;        // e.g., "Research_Paper.pdf"
  page: number;               // Page number
  section?: string;           // Section title if available
  paragraph?: number;         // Paragraph index on page
}

interface DocumentSnippet {
  documentName: string;
  documentId: string;
  content: DocumentContent[];
  metadata: {
    totalPages: number;
    uploadDate: string;
    fileSize: string;
  };
}

interface DocumentContent {
  page: number;
  section?: string;
  text: string;
  type: 'heading' | 'paragraph' | 'list' | 'table';
  isHighlighted?: boolean;
}

// Component for displaying document references
export function DocumentReferenceButton({ reference, onClick }: {
  reference: DocumentReference;
  onClick: (ref: DocumentReference) => void;
}) {
  const displayText = `${reference.documentName}:${reference.page}${
    reference.paragraph ? `(¶${reference.paragraph})` : ''
  }`;
  
  return (
    <button
      onClick={() => onClick(reference)}
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm font-medium"
    >
      📄 {displayText}
    </button>
  );
}

// Adapted DocumentPanel component
export function DocumentPanel({ 
  snippets, 
  activeReference 
}: {
  snippets: DocumentSnippet[];
  activeReference?: string | null;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50">
      {snippets.map((snippet, index) => (
        <DocumentSnippetCard
          key={index}
          snippet={snippet}
          activeReference={activeReference}
        />
      ))}
    </div>
  );
}
```

#### Search Response Format
```typescript
interface PDFSearchResponse {
  searchId: string;
  query: string;
  collection?: string;
  response: {
    content: string;              // Markdown-formatted response
    documentRefs: DocumentReference[];
    keyFindings: string[];        // Summary points
    relatedConcepts: string[];    // Connected ideas across documents
  };
  documentSnippets: DocumentSnippet[];
  relationships: DocumentRelationship[];
  metadata: {
    searchType: 'fast' | 'deep';
    documentsSearched: number;
    processingTimeMs: number;
    confidenceScore: number;
  };
}

interface DocumentRelationship {
  type: 'references' | 'builds_on' | 'contradicts' | 'supports' | 'similar_topic';
  fromDocument: string;
  toDocument: string;
  description: string;
  strength: number; // 0-1 confidence score
}
```

## Database Schema

### Convex Schema
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

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

  documentRelationships: defineTable({
    fromDocumentId: v.id("documents"),
    toDocumentId: v.id("documents"),
    relationshipType: v.union(
      v.literal("references"),
      v.literal("builds_on"),
      v.literal("contradicts"),
      v.literal("supports"),
      v.literal("similar_topic")
    ),
    strength: v.number(), // 0-1 confidence score
    description: v.string(),
    sharedConcepts: v.array(v.string()),
    discoveredAt: v.number(),
  }).index("by_from_document", ["fromDocumentId"])
    .index("by_to_document", ["toDocumentId"]),
});
```

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
- ✅ Set up Convex backend with authentication
- ✅ Implement PDF upload and storage
- ✅ Create basic document management UI
- ✅ Set up Python PDF processing service
- ✅ Basic text extraction and storage

### Phase 2: Content Processing (Weeks 3-4)
- ✅ Advanced PDF text extraction with structure preservation
- ✅ Key concept extraction and analysis
- ✅ Vector embedding generation
- ✅ Integration with vector database (Pinecone)
- ✅ Document relationship discovery

### Phase 3: Search Implementation (Weeks 5-6)
- ✅ Vector search implementation
- ✅ LLM integration for response generation
- ✅ Search API development
- ✅ Frontend search interface
- ✅ Document reference linking

### Phase 4: Advanced Features (Weeks 7-8)
- ✅ Deep search functionality
- ✅ Document relationship visualization
- ✅ Cross-document analysis
- ✅ Collections and organization
- ✅ Sharing and collaboration features

### Phase 5: Polish and Optimization (Weeks 9-10)
- ✅ Performance optimization
- ✅ UI/UX improvements
- ✅ Error handling and edge cases
- ✅ Testing and quality assurance
- ✅ Documentation and deployment

## Cost Analysis

### Infrastructure Costs (Monthly Estimates)

**Convex**
- Hobby: $0/month (good for development)
- Pro: $25/month (production ready)

**Vector Database (Pinecone)**
- Starter: $70/month (100K vectors)
- Standard: $140/month (1M vectors)

**AI/LLM Services (OpenAI)**
- Embeddings: ~$0.13 per 1M tokens
- GPT-4 for responses: ~$30 per 1M tokens
- Estimated: $50-200/month depending on usage

**PDF Processing Service**
- Railway/Render: $5-20/month
- Or serverless functions (Vercel): Pay per use

**Total Estimated Monthly Cost**: $100-400/month

### Scaling Considerations

**Storage**: 
- PDFs: Convex file storage scales automatically
- Vectors: Pinecone scales by tier

**Processing**:
- PDF extraction: Can be scaled horizontally
- Embedding generation: Rate limited by OpenAI API

**Search Performance**:
- Vector search: Sub-second with proper indexing
- LLM response generation: 2-10 seconds depending on complexity

## Success Metrics

### Technical Metrics
- Document processing time: < 2 minutes per PDF
- Search response time: < 5 seconds for fast search
- Search accuracy: > 85% relevance score
- System uptime: > 99.5%

### User Experience Metrics
- Document upload success rate: > 99%
- Search satisfaction: User feedback > 4.0/5
- Feature adoption: 70% of users use cross-document search
- Retention: 60% weekly active users

## Risk Mitigation

### Technical Risks
**PDF Processing Complexity**
- Risk: Complex PDFs (scanned, multi-column) fail to process
- Mitigation: OCR fallback, multiple processing engines

**Vector Search Accuracy**
- Risk: Poor search results due to chunking or embedding issues
- Mitigation: A/B testing different chunking strategies, hybrid search

**Cost Overruns**
- Risk: High AI API costs with scale
- Mitigation: Caching, rate limiting, local model fallbacks

### Business Risks
**User Adoption**
- Risk: Users don't see value over traditional PDF readers
- Mitigation: Focus on unique cross-document insights

**Competition**
- Risk: Large players (Google, Adobe) build similar features
- Mitigation: Focus on specific use cases, superior UX

## Conclusion

This implementation plan provides a comprehensive roadmap for building a PDF-focused version of DeepWiki. By leveraging Convex for the core backend and specialized services for PDF processing and vector search, we can create a powerful document analysis platform that provides similar insights to the original code-based DeepWiki.

The key innovations include:
- **Intelligent document processing** that preserves structure and context
- **Cross-document relationship discovery** using NLP and vector similarity
- **Familiar interface** adapted from the proven DeepWiki UX
- **Scalable architecture** that can grow with user demand

The result will be a platform that transforms static PDF collections into an interactive, searchable knowledge base with intelligent cross-referencing and relationship discovery.