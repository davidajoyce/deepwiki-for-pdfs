'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CodeLine {
  number: number
  content: string
}

interface CodeSnippet {
  file: string
  repo: string
  lines: CodeLine[]
}

interface CodePanelProps {
  snippets: CodeSnippet[]
  activeReference?: string | null
}

export default function CodePanel({ snippets, activeReference }: CodePanelProps) {
  const [expandedSnippets, setExpandedSnippets] = useState<Set<number>>(new Set([0]))

  const toggleSnippet = (index: number) => {
    const newExpanded = new Set(expandedSnippets)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSnippets(newExpanded)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50">
      {snippets.map((snippet, index) => (
        <CodeSnippetCard
          key={index}
          snippet={snippet}
          isExpanded={expandedSnippets.has(index)}
          onToggle={() => toggleSnippet(index)}
          activeReference={activeReference}
        />
      ))}
    </div>
  )
}

interface CodeSnippetCardProps {
  snippet: CodeSnippet
  isExpanded: boolean
  onToggle: () => void
  activeReference?: string | null
}

function CodeSnippetCard({ snippet, isExpanded, onToggle, activeReference }: CodeSnippetCardProps) {
  // Check if this snippet matches the active reference
  const isActiveSnippet = activeReference && (
    activeReference.includes(snippet.file) ||
    snippet.file.includes(activeReference.split(':')[0])
  )
  
  // Generate unique ID for this snippet
  const snippetId = `code-ref-${snippet.file.replace(/[^a-zA-Z0-9]/g, '-')}`

  return (
    <div 
      id={snippetId}
      className={`border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        isActiveSnippet ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                href={`https://github.com/${snippet.repo}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {snippet.repo}
              </Link>
              <Link 
                href={`https://github.com/${snippet.repo}/blob/main/${snippet.file}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {snippet.file}
              </Link>
            </div>
          </div>
          
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Code Content */}
        {isExpanded && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <pre className="overflow-x-auto text-sm">
                <code className="block p-4">
                  {snippet.lines.map((line) => {
                    // Check if this line is highlighted by the active reference
                    const isHighlightedLine = activeReference && (() => {
                      const refParts = activeReference.split(':')
                      if (refParts.length < 2) return false
                      
                      const fileName = refParts[0]
                      const lineRange = refParts[1]
                      
                      if (!snippet.file.includes(fileName)) return false
                      
                      if (lineRange.includes('-')) {
                        const [start, end] = lineRange.split('-').map(Number)
                        return line.number >= start && line.number <= end
                      } else {
                        return line.number === parseInt(lineRange)
                      }
                    })()
                    
                    return (
                      <div 
                        key={line.number} 
                        className={`flex transition-colors duration-200 ${
                          isHighlightedLine ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''
                        }`}
                        id={`line-${line.number}`}
                      >
                        <span className="select-none text-gray-400 dark:text-gray-500 w-8 text-right mr-4 font-mono text-xs">
                          {line.number}
                        </span>
                        <span className="font-mono text-xs leading-relaxed">
                          {line.content}
                        </span>
                      </div>
                    )
                  })}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}