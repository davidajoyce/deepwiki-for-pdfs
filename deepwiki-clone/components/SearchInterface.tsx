"use client";

import { useState, useEffect } from "react";
import { searchService, SearchResult, SearchResponse } from "@/lib/search-service";

interface Document {
  id: string;
  originalName: string;
  textContent?: string;
  analysis?: any;
}

interface SearchInterfaceProps {
  documents: Document[];
}

export default function SearchInterface({ documents }: SearchInterfaceProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Update search service with documents when they change
  useEffect(() => {
    searchService.setDocuments(documents);
  }, [documents]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchService.search(searchQuery);
      setSearchResults(results);
      
      // Add to search history if not already present
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
  };

  const stats = searchService.getSearchStatistics();

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Search Your Documents</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search across {stats.totalDocuments} documents and {stats.totalPages} pages
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for concepts, terms, or specific content..."
            className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={isSearching}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {query && (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "🔍" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && !searchResults && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Searches:</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((historyQuery, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(historyQuery);
                  handleSearch(historyQuery);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Search Results for "{searchResults.query}"
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchResults.totalResults} results found in {searchResults.searchTime}ms
                </p>
              </div>
              {searchResults.suggestions && searchResults.suggestions.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {searchResults.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(suggestion);
                          handleSearch(suggestion);
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          {searchResults.results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.results.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-blue-600 dark:text-blue-400">
                        📄 {result.documentName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Page {result.pageNumber}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Score: {result.score.toFixed(1)}
                    </div>
                  </div>
                  
                  <div 
                    className="text-gray-700 dark:text-gray-300 mb-2"
                    dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                  />
                  
                  <div className="text-sm text-gray-500">
                    {result.excerpt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Documents State */}
      {documents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No documents to search</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload some PDF documents first to enable search functionality
          </p>
        </div>
      )}
    </div>
  );
}