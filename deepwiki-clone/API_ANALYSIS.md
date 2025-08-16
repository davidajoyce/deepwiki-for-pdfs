# DeepWiki API Analysis - Backend Requirements

## Overview

This document analyzes the DeepWiki API structure discovered through Playwright network analysis to understand what backend APIs need to be created for our clone.

## Primary API Endpoints Discovered

### 1. Query Search API

**Primary Endpoint**: `https://api.devin.ai/ada/query/{query_id}`

**Examples**:
- `GET https://api.devin.ai/ada/query/tell-me-about-the-s3-models_0f54097c-ed4a-49ca-9f40-540c95761430`
- `GET https://api.devin.ai/ada/query/relevantcontextthis-query-was_9656b60e-4adb-4bbd-9fae-cf97cb07a96d`

**Method**: `GET`
**Status**: `200` (successful responses)

### 2. Deep Search API

**Triggered by**: "Go deeper" button click
**Pattern**: Creates new query ID for deeper analysis
**URL Structure**: Same as primary query API but with different query ID

**Example Flow**:
1. User clicks "Go deeper" on existing query
2. Frontend generates new query ID
3. New tab opens with deeper search URL
4. API call made to same endpoint with new ID

## API Response Structure Analysis

Based on the rendered content, the API returns a structured response containing:

### Response Schema (Inferred)

```typescript
interface SearchResponse {
  query: string;                    // Original search query
  repo: string;                     // Repository identifier (e.g., "cashapp/misk")
  response: {
    content: string;                // Markdown-formatted response content
    codeRefs: FileReference[];      // References to specific files/lines
  };
  codeSnippets: CodeSnippet[];      // Relevant code sections
  metadata?: {
    searchType: 'fast' | 'deep';    // Search depth indicator
    timestamp?: string;             // Query timestamp
    status: 'completed' | 'processing' | 'failed';
  };
}

interface FileReference {
  file: string;                     // File path (e.g., "README.md")
  line?: number;                    // Single line reference
  lines?: string;                   // Line range (e.g., "232-237")
}

interface CodeSnippet {
  file: string;                     // Full file path
  repo: string;                     // Repository identifier
  lines: CodeLine[];                // Array of code lines with numbers
  metadata?: {
    language: string;               // Programming language
    branch?: string;                // Git branch/commit
  };
}

interface CodeLine {
  number: number;                   // Line number
  content: string;                  // Actual code content
}
```

### Content Format Analysis

**Response Content Structure**:
- **Markdown formatted text** with headers, lists, code blocks
- **Inline file references** with pattern: `filename.ext:line` or `filename.ext:start-end`
- **Code snippets** with syntax highlighting
- **Cross-references** between content and code sections

**File Reference Patterns**:
```
README.md:41                      // Single line reference
misk-aws.api:232-237             // Line range reference
S3KeySource.kt:12-33             // Multi-line block reference
build.gradle.kts:10-12           // Build file reference
```

## Backend API Requirements

### 1. Search Query Processing API

**Endpoint**: `POST /api/search`

```typescript
// Request
interface SearchRequest {
  query: string;                    // User's search query
  repo: string;                     // Target repository
  searchType?: 'fast' | 'deep';     // Search depth
  context?: string[];               // Additional context for deep search
}

// Response
interface SearchResponse {
  queryId: string;                  // Unique identifier for this search
  query: string;                    // Original query
  repo: string;                     // Repository searched
  response: {
    content: string;                // Formatted markdown response
    codeRefs: FileReference[];      
  };
  codeSnippets: CodeSnippet[];
  metadata: {
    searchType: 'fast' | 'deep';
    timestamp: string;
    status: 'completed' | 'processing';
    processingTimeMs: number;
  };
}
```

**Implementation Requirements**:
- **Vector search** through codebase using embeddings
- **Semantic analysis** to understand query intent
- **Code extraction** with proper line number mapping
- **Markdown formatting** with file reference linking
- **Response caching** for performance

### 2. Query Retrieval API

**Endpoint**: `GET /api/query/{queryId}`

```typescript
// Response - Same as SearchResponse above
// Used for:
// - Loading existing searches
// - Sharing search results
// - Deep search continuation
```

**Implementation Requirements**:
- **Query result persistence** (database storage)
- **Efficient retrieval** by query ID
- **Result expiration** handling
- **Error handling** for missing queries

### 3. Deep Search API

**Endpoint**: `POST /api/search/deep`

```typescript
// Request
interface DeepSearchRequest {
  originalQueryId: string;          // Reference to original search
  additionalContext?: string[];     // Extra context for deeper analysis
  focusAreas?: string[];           // Specific areas to investigate
}

// Response - Same as SearchResponse but with deeper analysis
```

**Implementation Requirements**:
- **Enhanced vector search** with broader context
- **Relationship mapping** between code components
- **Deeper semantic analysis**
- **Cross-file dependency tracking**

### 4. Repository Management API

**Endpoint**: `GET /api/repos/{org}/{repo}`

```typescript
interface RepositoryInfo {
  org: string;                      // Organization (e.g., "cashapp")
  repo: string;                     // Repository name (e.g., "misk")
  branch: string;                   // Current branch
  lastIndexed: string;              // Last indexing timestamp
  stats: {
    fileCount: number;
    totalLines: number;
    languages: string[];
  };
}
```

## Technical Architecture Requirements

### 1. Vector Database
- **Purpose**: Store code embeddings for semantic search
- **Technology**: Pinecone, Weaviate, or PostgreSQL with pgvector
- **Data**: File contents, documentation, API references

### 2. Code Indexing Pipeline
- **Purpose**: Process repositories and create searchable embeddings
- **Components**:
  - Git repository cloning/updating
  - File parsing and chunking
  - Embedding generation (OpenAI, Cohere, or local models)
  - Vector storage and indexing

### 3. LLM Integration
- **Purpose**: Generate human-readable responses from search results
- **Requirements**:
  - Context window management
  - Prompt engineering for code explanation
  - Response formatting (Markdown)
  - File reference extraction

### 4. Caching Layer
- **Purpose**: Improve response times and reduce compute costs
- **Components**:
  - Redis for query result caching
  - CDN for static assets
  - Database query caching

## API Implementation Strategy

### Phase 1: Basic Search
```typescript
// Minimal viable API
POST /api/search
GET /api/query/{id}
GET /api/repos/{org}/{repo}
```

### Phase 2: Enhanced Features
```typescript
// Advanced search capabilities
POST /api/search/deep
GET /api/search/suggestions
POST /api/feedback/{queryId}
```

### Phase 3: Real-time Features
```typescript
// Streaming and real-time updates
GET /api/search/stream/{queryId}  // Server-sent events
WebSocket /ws/search              // Real-time updates
```

## Database Schema Requirements

### 1. Searches Table
```sql
CREATE TABLE searches (
  id UUID PRIMARY KEY,
  query TEXT NOT NULL,
  repo_org VARCHAR(255) NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  search_type VARCHAR(20) DEFAULT 'fast',
  response_content TEXT,
  code_snippets JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### 2. Repositories Table
```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY,
  org VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) DEFAULT 'main',
  last_indexed_at TIMESTAMP,
  index_status VARCHAR(20) DEFAULT 'pending',
  file_count INTEGER,
  total_lines INTEGER,
  languages JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org, name)
);
```

### 3. Code Embeddings Table
```sql
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY,
  repo_id UUID REFERENCES repositories(id),
  file_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  start_line INTEGER,
  end_line INTEGER,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For OpenAI embeddings
  language VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication & Rate Limiting

### Authentication Requirements
- **API Key authentication** for repository access
- **GitHub OAuth integration** for private repos
- **Session management** for web interface

### Rate Limiting Strategy
```typescript
interface RateLimits {
  searchQueries: {
    perMinute: 10;
    perHour: 100;
    perDay: 1000;
  };
  deepSearches: {
    perMinute: 2;
    perHour: 20;
    perDay: 100;
  };
}
```

## Error Handling Patterns

### API Error Responses
```typescript
interface ApiError {
  error: {
    code: string;                   // Machine-readable error code
    message: string;                // Human-readable error message
    details?: any;                  // Additional error context
    queryId?: string;               // Reference ID for debugging
  };
  timestamp: string;
  path: string;
}

// Common error codes:
// - QUERY_NOT_FOUND
// - REPO_NOT_INDEXED
// - RATE_LIMIT_EXCEEDED
// - SEARCH_TIMEOUT
// - INVALID_QUERY_FORMAT
```

## Performance Requirements

### Response Time Targets
- **Fast Search**: < 2 seconds
- **Deep Search**: < 10 seconds  
- **Query Retrieval**: < 500ms
- **Repository Info**: < 200ms

### Scalability Considerations
- **Horizontal scaling** for search workers
- **Vector database sharding** for large codebases
- **CDN distribution** for global access
- **Async processing** for deep searches

## Security Considerations

### Data Protection
- **Repository access control** (public/private repos)
- **Query sanitization** to prevent injection
- **Result filtering** based on user permissions
- **Audit logging** for search activities

### Privacy Requirements
- **Query anonymization** in logs
- **Result expiration** for sensitive searches
- **Access control** for shared queries
- **GDPR compliance** for user data

## Monitoring & Analytics

### Key Metrics
- Search query volume and patterns
- Response time percentiles
- Search accuracy and relevance
- User engagement and feedback
- Repository indexing status

### Logging Requirements
- Structured logging with correlation IDs
- Search query and result tracking
- Performance metrics collection
- Error rate monitoring

## Integration Points

### GitHub Integration
- Repository webhooks for updates
- OAuth for private repository access
- API rate limit management
- Branch and commit tracking

### AI/ML Services
- OpenAI API for embeddings and completions
- Custom model hosting for specialized tasks
- Fallback strategies for service outages
- Cost optimization and monitoring

## Deployment Architecture

### Recommended Stack
- **API Server**: Node.js/TypeScript with Express or Fastify
- **Database**: PostgreSQL with pgvector extension
- **Cache**: Redis for query results and sessions
- **Vector DB**: Pinecone or self-hosted Weaviate
- **Queue**: Bull/BullMQ for background processing
- **Monitoring**: Datadog or New Relic
- **Hosting**: Vercel, Railway, or AWS

This analysis provides a comprehensive foundation for building the backend APIs needed to replicate DeepWiki's functionality with our Next.js frontend.