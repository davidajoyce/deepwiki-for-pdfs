'use client'

import { useState } from 'react'

interface ResponsePanelProps {
  content: string
  onFileReferenceClick?: (fileRef: string) => void
}

export default function ResponsePanel({ content, onFileReferenceClick }: ResponsePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = () => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      // Handle headers
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">{line.replace('## ', '')}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">{line.replace('### ', '')}</h3>
      }
      
      // Handle bullet points
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-6 mb-1 text-gray-700 dark:text-gray-300 list-disc">
            {renderInlineCode(line.replace('- ', ''))}
          </li>
        )
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <br key={index} />
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          {renderInlineCode(line)}
        </p>
      )
    })
  }

  const renderInlineCode = (text: string) => {
    // First split by backticks for code blocks
    const parts = text.split(/`([^`]+)`/)
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code key={index} className="rounded-sm bg-gray-200 dark:bg-gray-800/30 px-1 py-0.5 text-xs font-mono">
            {part}
          </code>
        )
      }
      // For non-code parts, check for file references
      return renderWithFileReferences(part, index)
    })
  }

  const renderWithFileReferences = (text: string, baseIndex: number) => {
    // Match file references like "README.md:41" or "S3KeySource.kt:12-33"
    const fileRefPattern = /([a-zA-Z0-9._-]+\.(?:md|kt|java|js|ts|py|go|rs|cpp|h|gradle)):(\d+(?:-\d+)?)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = fileRefPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      // Add the clickable file reference
      const fullRef = match[0]
      const fileName = match[1]
      const lineRef = match[2]
      
      parts.push(
        <button
          key={`${baseIndex}-${match.index}`}
          onClick={() => onFileReferenceClick?.(fullRef)}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm font-medium"
        >
          {fileName}:{lineRef}
        </button>
      )
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    
    return parts.length === 1 ? parts[0] : parts
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {renderContent()}
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Response
              </>
            )}
          </button>
          
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}