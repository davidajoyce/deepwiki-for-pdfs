/**
 * Search Service for PDF Documents
 * Handles both local search and future vector search integration
 */

export interface SearchResult {
  id: string;
  documentId: string;
  documentName: string;
  excerpt: string;
  pageNumber: number;
  score: number;
  highlightedText: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  suggestions?: string[];
}

export interface Document {
  id: string;
  originalName: string;
  textContent?: string;
  analysis?: {
    text_content: string;
    sections: Array<{
      page_number: number;
      content: string;
    }>;
  };
}

class SearchService {
  private documents: Document[] = [];

  setDocuments(docs: Document[]) {
    this.documents = docs;
  }

  async search(query: string): Promise<SearchResponse> {
    const startTime = Date.now();
    
    if (!query.trim()) {
      return {
        query,
        results: [],
        totalResults: 0,
        searchTime: 0
      };
    }

    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

    this.documents.forEach(doc => {
      const content = doc.textContent || doc.analysis?.text_content || '';
      const sections = doc.analysis?.sections || [];

      // Search in full content
      searchTerms.forEach(term => {
        const regex = new RegExp(`([^.]*${term}[^.]*)`, 'gi');
        const matches = content.match(regex);

        if (matches) {
          matches.forEach((match, index) => {
            // Find which page this match is on
            let pageNumber = 1;
            let charCount = 0;
            
            for (const section of sections) {
              charCount += section.content.length;
              if (charCount >= content.indexOf(match)) {
                pageNumber = section.page_number;
                break;
              }
            }

            // Calculate relevance score (simple frequency-based)
            const termFreq = (match.toLowerCase().match(new RegExp(term, 'g')) || []).length;
            const score = termFreq / match.length * 100;

            // Highlight the search term
            const highlightedText = match.replace(
              new RegExp(`(${term})`, 'gi'),
              '<mark>$1</mark>'
            );

            results.push({
              id: `${doc.id}-${index}`,
              documentId: doc.id,
              documentName: doc.originalName,
              excerpt: match.trim().substring(0, 200) + (match.length > 200 ? '...' : ''),
              pageNumber,
              score,
              highlightedText: highlightedText.trim().substring(0, 200) + (highlightedText.length > 200 ? '...' : '')
            });
          });
        }
      });
    });

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    // Remove duplicates and limit results
    const uniqueResults = results
      .filter((result, index, arr) => 
        arr.findIndex(r => r.excerpt === result.excerpt) === index
      )
      .slice(0, 20);

    const searchTime = Date.now() - startTime;

    return {
      query,
      results: uniqueResults,
      totalResults: uniqueResults.length,
      searchTime,
      suggestions: this.generateSuggestions(query, uniqueResults)
    };
  }

  private generateSuggestions(query: string, results: SearchResult[]): string[] {
    // Simple suggestion generation based on document content
    const suggestions: string[] = [];
    
    // Extract common terms from results
    const terms = new Set<string>();
    results.forEach(result => {
      const words = result.excerpt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3);
      
      words.forEach(word => terms.add(word));
    });

    // Return top 3 most relevant terms not in original query
    const queryWords = query.toLowerCase().split(' ');
    const filteredTerms = Array.from(terms)
      .filter(term => !queryWords.includes(term))
      .slice(0, 3);

    return filteredTerms;
  }

  async searchInDocument(documentId: string, query: string): Promise<SearchResult[]> {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return [];

    const fullSearch = await this.search(query);
    return fullSearch.results.filter(result => result.documentId === documentId);
  }

  getSearchStatistics() {
    return {
      totalDocuments: this.documents.length,
      totalPages: this.documents.reduce((sum, doc) => {
        return sum + (doc.analysis?.sections?.length || 0);
      }, 0),
      avgWordsPerDocument: this.documents.reduce((sum, doc) => {
        const content = doc.textContent || doc.analysis?.text_content || '';
        return sum + content.split(' ').length;
      }, 0) / (this.documents.length || 1)
    };
  }
}

export const searchService = new SearchService();