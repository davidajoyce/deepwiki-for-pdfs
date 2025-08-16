"use client";

import { useState, useEffect } from "react";
import { DocumentReference } from "@/lib/ai-chat-service";

interface Document {
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

interface PDFReferenceViewerProps {
  documents: Document[];
  activeReference?: DocumentReference | null;
  onReferenceClick?: (reference: DocumentReference) => void;
  allReferences: DocumentReference[];
}

interface ExpandedSections {
  [documentId: string]: boolean;
}

interface ExpandedContext {
  [referenceKey: string]: {
    before: number;
    after: number;
  };
}

export default function PDFReferenceViewer({ 
  documents, 
  activeReference, 
  onReferenceClick,
  allReferences 
}: PDFReferenceViewerProps) {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [expandedContext, setExpandedContext] = useState<ExpandedContext>({});

  // Auto-expand when activeReference changes
  useEffect(() => {
    if (activeReference) {
      setExpandedSections(prev => ({
        ...prev,
        [activeReference.documentId]: true
      }));
      setHighlightedSection(`${activeReference.documentId}:${activeReference.pageNumber}`);
    }
  }, [activeReference]);

  const toggleSection = (documentId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };

  const getDocumentSections = (document: Document) => {
    return document.analysis?.sections || [];
  };

  const formatContent = (content: string, maxLength: number = 500) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const expandContextBefore = (referenceKey: string) => {
    setExpandedContext(prev => ({
      ...prev,
      [referenceKey]: {
        before: (prev[referenceKey]?.before || 0) + 200,
        after: prev[referenceKey]?.after || 0
      }
    }));
  };

  const expandContextAfter = (referenceKey: string) => {
    setExpandedContext(prev => ({
      ...prev,
      [referenceKey]: {
        before: prev[referenceKey]?.before || 0,
        after: (prev[referenceKey]?.after || 0) + 200
      }
    }));
  };

  const getExpandedContent = (document: Document, pageNumber: number, referenceKey: string, reference: DocumentReference) => {
    const section = document.analysis?.sections?.find(s => s.page_number === pageNumber);
    if (!section) return reference.relevantText;

    const expansion = expandedContext[referenceKey];
    
    // If no expansion, return a focused excerpt around the relevant text
    if (!expansion || (expansion.before === 0 && expansion.after === 0)) {
      return getRelevantExcerpt(section.content, reference.excerpt);
    }

    // Get content from current section plus additional context
    let expandedContent = section.content;

    // Try to get more content from adjacent sections/pages
    if (expansion.before > 0) {
      const prevSection = document.analysis?.sections?.find(s => s.page_number === pageNumber - 1);
      if (prevSection) {
        const beforeText = prevSection.content.slice(-expansion.before);
        expandedContent = beforeText + '\n\n--- Page Break ---\n\n' + expandedContent;
      }
    }

    if (expansion.after > 0) {
      const nextSection = document.analysis?.sections?.find(s => s.page_number === pageNumber + 1);
      if (nextSection) {
        const afterText = nextSection.content.slice(0, expansion.after);
        expandedContent = expandedContent + '\n\n--- Page Break ---\n\n' + afterText;
      }
    }

    return expandedContent;
  };

  const getRelevantExcerpt = (content: string, excerpt: string) => {
    // Find the excerpt in the content
    const excerptIndex = content.toLowerCase().indexOf(excerpt.toLowerCase());
    if (excerptIndex === -1) {
      // If excerpt not found, return first part of content
      return formatContent(content, 300);
    }

    // Extract context around the excerpt (150 chars before and after)
    const contextBefore = 150;
    const contextAfter = 150;
    const startIndex = Math.max(0, excerptIndex - contextBefore);
    const endIndex = Math.min(content.length, excerptIndex + excerpt.length + contextAfter);
    
    let relevantContent = content.substring(startIndex, endIndex);
    
    // Add ellipsis if we're not at the beginning/end
    if (startIndex > 0) relevantContent = '...' + relevantContent;
    if (endIndex < content.length) relevantContent = relevantContent + '...';
    
    return relevantContent;
  };

  const groupReferencesByDocument = () => {
    const grouped = new Map<string, DocumentReference[]>();
    allReferences.forEach(ref => {
      const existing = grouped.get(ref.documentId) || [];
      existing.push(ref);
      grouped.set(ref.documentId, existing);
    });
    return grouped;
  };

  const referencesGrouped = groupReferencesByDocument();

  if (allReferences.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
        <div>
          <div className="text-3xl mb-3">📄</div>
          <p className="text-sm">Document references will appear here when you chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4">
        {Array.from(referencesGrouped.entries()).map(([documentId, refs]) => {
          const document = documents.find(d => d.id === documentId);
          if (!document) return null;

          const isExpanded = expandedSections[documentId];
          const sections = getDocumentSections(document);

          return (
            <div key={documentId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Document Header - Like DeepWiki */}
              <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSection(documentId)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-medium text-sm">📄 {document.originalName}</div>
                        <div className="text-xs text-gray-500">{refs.length} reference{refs.length > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Document Content - Expandable like DeepWiki */}
              {isExpanded && (
                <div className="bg-white dark:bg-gray-900">
                  {/* Reference sections */}
                  {refs.map((ref, index) => {
                    const section = sections.find(s => s.page_number === ref.pageNumber);
                    const sectionKey = `${ref.documentId}:${ref.pageNumber}`;
                    const isHighlighted = highlightedSection === sectionKey;

                    return (
                      <div 
                        key={index}
                        data-reference-id={`${ref.documentId}:${ref.pageNumber}`}
                        className={`border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                          isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="p-4">
                          {/* Page Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                                Page {ref.pageNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                Confidence: {ref.confidence.toFixed(0)}%
                              </div>
                            </div>
                            <button
                              onClick={() => onReferenceClick?.(ref)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Focus Reference
                            </button>
                          </div>

                          {/* Content Preview - Like DeepWiki code blocks */}
                          <div className="relative">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Content Preview
                                </div>
                                <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Context Expansion Controls */}
                              <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-center py-2">
                                  <button
                                    onClick={() => expandContextBefore(sectionKey)}
                                    className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    <span>Show more above</span>
                                  </button>
                                </div>
                              </div>

                              <div className="p-3">
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                                  {getExpandedContent(document, ref.pageNumber, sectionKey, ref)}
                                </div>
                              </div>

                              {/* Context Expansion Controls - Bottom */}
                              <div className="border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-center py-2">
                                  <button
                                    onClick={() => expandContextAfter(sectionKey)}
                                    className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span>Show more below</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Excerpt highlight */}
                          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Referenced excerpt:</strong> {ref.excerpt}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}