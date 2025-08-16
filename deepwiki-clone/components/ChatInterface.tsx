"use client";

import { useState, useEffect, useRef } from "react";
import { aiChatService, ChatMessage, DocumentReference, ChatResponse } from "@/lib/ai-chat-service";
import PDFReferenceViewer from "./PDFReferenceViewer";

interface Document {
  id: string;
  originalName: string;
  textContent?: string;
  analysis?: any;
}

interface ChatInterfaceProps {
  documents: Document[];
}

export default function ChatInterface({ documents }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReference, setSelectedReference] = useState<DocumentReference | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [allReferences, setAllReferences] = useState<DocumentReference[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update AI service with documents when they change
  useEffect(() => {
    aiChatService.setDocuments(documents);
    setMessages(aiChatService.getChatHistory());
  }, [documents]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (question: string = currentQuestion) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setCurrentQuestion("");
    
    try {
      const response: ChatResponse = await aiChatService.askQuestion(question);
      setMessages(aiChatService.getChatHistory());
      setSuggestedQuestions(response.relatedQuestions || []);
      
      // Collect all references from all assistant messages
      const newReferences = aiChatService.getChatHistory()
        .filter(m => m.type === 'assistant' && m.references)
        .flatMap(m => m.references || []);
      setAllReferences(newReferences);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    aiChatService.clearHistory();
    setMessages([]);
    setSuggestedQuestions([]);
    setSelectedReference(null);
  };

  const stats = aiChatService.getDocumentStatistics();

  const formatMessageContent = (content: string) => {
    // Convert markdown-like formatting to HTML and handle reference links
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    
    // Handle DeepWiki-style reference links: [filename:pageX](ref:docId:pageNumber)
    formatted = formatted.replace(
      /\[([^\]]+)\]\(ref:([^:]+):(\d+)\)/g, 
      '<button class="reference-link text-blue-600 dark:text-blue-400 hover:underline font-medium" data-doc-id="$2" data-page="$3">$1</button>'
    );
    
    return formatted;
  };

  const handleReferenceClick = (reference: DocumentReference) => {
    setSelectedReference(reference);
  };

  // Handle clicks on reference links in the chat
  const handleMessageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('reference-link')) {
      const docId = target.getAttribute('data-doc-id');
      const page = target.getAttribute('data-page');
      
      if (docId && page) {
        const reference = allReferences.find(
          ref => ref.documentId === docId && ref.pageNumber === parseInt(page)
        );
        if (reference) {
          handleReferenceClick(reference);
        }
      }
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">No documents to chat with</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload some PDF documents first to start asking questions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chat with Your Documents</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask questions about {stats.availableForChat} document{stats.availableForChat !== 1 ? 's' : ''}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ask me anything about your documents. I'll find relevant information and provide sources.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "What are the main topics covered?",
                    "Summarize the key points",
                    "What does this document say about...",
                    "Can you explain the concepts in simple terms?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                    onClick={handleMessageClick}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content)
                      }}
                    />
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Sources: {message.references.length} reference{message.references.length > 1 ? 's' : ''} • Click blue links to view
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Related questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-2">
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !currentQuestion.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced References Panel - DeepWiki Style */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Document References</h2>
          {allReferences.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {allReferences.length} reference{allReferences.length > 1 ? 's' : ''} across {documents.length} document{documents.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="h-full overflow-hidden">
          <PDFReferenceViewer
            documents={documents}
            activeReference={selectedReference}
            onReferenceClick={handleReferenceClick}
            allReferences={allReferences}
          />
        </div>
      </div>
    </div>
  );
}