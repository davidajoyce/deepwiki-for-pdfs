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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const referencePanelRef = useRef<HTMLDivElement>(null);

  // Update AI service with documents when they change
  useEffect(() => {
    aiChatService.setDocuments(documents);
    setMessages(aiChatService.getChatHistory());
  }, [documents]);

  // Auto-scroll to bottom when new messages are added (but only if user is near bottom)
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
    
    // Auto-scroll to the reference in the right panel after a short delay
    // This ensures the document section expands first before scrolling
    setTimeout(() => {
      if (referencePanelRef.current) {
        const referenceElement = referencePanelRef.current.querySelector(
          `[data-reference-id="${reference.documentId}:${reference.pageNumber}"]`
        );
        if (referenceElement) {
          referenceElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, 100); // Small delay to allow expansion to complete
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
    <div className="h-screen flex relative">
      {/* Main Chat Panel - DeepWiki Style */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 z-10">
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

        {/* Scrollable Messages Area - DeepWiki Style */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto pb-32 bg-white dark:bg-gray-900"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-4xl mb-6">🤖</div>
              <h3 className="text-xl font-medium mb-4">Start a conversation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                Ask me anything about your documents. I'll find relevant information and provide sources.
              </p>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {[
                    "What are the main topics covered?",
                    "Summarize the key points",
                    "What does this document say about...",
                    "Can you explain the concepts in simple terms?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {messages.map((message, index) => (
                <div key={message.id} className="space-y-4">
                  {/* Question */}
                  {message.type === 'user' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        Q
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-gray-900 dark:text-gray-100 font-medium">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Answer */}
                  {message.type === 'assistant' && (
                    <div className="flex items-start space-x-3 ml-8">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        A
                      </div>
                      <div className="flex-1">
                        <div 
                          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                          onClick={handleMessageClick}
                        >
                          <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formatMessageContent(message.content)
                            }}
                          />
                          {message.references && message.references.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>
                                  {message.references.length} reference{message.references.length > 1 ? 's' : ''} • Click blue links to view in panel
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested Questions after each answer */}
                  {message.type === 'assistant' && index === messages.length - 1 && suggestedQuestions.length > 0 && (
                    <div className="ml-16 mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Related questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => handleSendMessage(question)}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            disabled={isLoading}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-3 ml-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Box - DeepWiki Style */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
              <div className="flex space-x-3 p-4">
                <textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me a question about your documents..."
                  className="flex-1 resize-none border-0 bg-transparent focus:outline-none focus:ring-0 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !currentQuestion.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced References Panel - DeepWiki Style */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Document References</h2>
          {allReferences.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {allReferences.length} reference{allReferences.length > 1 ? 's' : ''} across {documents.length} document{documents.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div 
          ref={referencePanelRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
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