/**
 * AI Chat Service for Conversational PDF Interaction
 * Provides DeepWiki-style chat interface for querying documents
 */

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  references?: DocumentReference[];
}

export interface DocumentReference {
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerpt: string;
  relevantText: string;
  confidence: number;
}

export interface ChatResponse {
  message: ChatMessage;
  references: DocumentReference[];
  relatedQuestions?: string[];
}

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

class AIChatService {
  private documents: Document[] = [];
  private chatHistory: ChatMessage[] = [];

  setDocuments(docs: Document[]) {
    this.documents = docs;
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearHistory() {
    this.chatHistory = [];
  }

  async askQuestion(question: string): Promise<ChatResponse> {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: Date.now()
    };
    this.chatHistory.push(userMessage);

    // Find relevant document passages
    const references = this.findRelevantContent(question);
    
    // Generate AI response (simulated for now)
    const aiResponse = await this.generateResponse(question, references);
    
    // Add AI message to history
    const assistantMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      type: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
      references
    };
    this.chatHistory.push(assistantMessage);

    return {
      message: assistantMessage,
      references,
      relatedQuestions: this.generateRelatedQuestions(question, references)
    };
  }

  private findRelevantContent(question: string): DocumentReference[] {
    const references: DocumentReference[] = [];
    const queryTerms = question.toLowerCase().split(' ').filter(term => term.length > 2);

    this.documents.forEach(doc => {
      const content = doc.textContent || doc.analysis?.text_content || '';
      const sections = doc.analysis?.sections || [];

      // Score each section based on relevance
      sections.forEach(section => {
        let relevanceScore = 0;
        const sectionLower = section.content.toLowerCase();
        
        queryTerms.forEach(term => {
          const matches = (sectionLower.match(new RegExp(term, 'g')) || []).length;
          relevanceScore += matches;
        });

        if (relevanceScore > 0) {
          // Extract relevant excerpt (sentence containing the terms)
          const sentences = section.content.split(/[.!?]+/);
          let bestSentence = '';
          let bestScore = 0;

          sentences.forEach(sentence => {
            const sentenceLower = sentence.toLowerCase();
            let sentenceScore = 0;
            queryTerms.forEach(term => {
              if (sentenceLower.includes(term)) sentenceScore++;
            });
            if (sentenceScore > bestScore) {
              bestScore = sentenceScore;
              bestSentence = sentence.trim();
            }
          });

          if (bestSentence) {
            references.push({
              documentId: doc.id,
              documentName: doc.originalName,
              pageNumber: section.page_number,
              excerpt: bestSentence.substring(0, 200) + (bestSentence.length > 200 ? '...' : ''),
              relevantText: section.content.substring(0, 500) + (section.content.length > 500 ? '...' : ''),
              confidence: (relevanceScore / queryTerms.length) * 100
            });
          }
        }
      });
    });

    // Sort by confidence and return top 5
    return references
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private async generateResponse(question: string, references: DocumentReference[]): Promise<string> {
    // Simulated AI response generation
    // In production, this would call OpenAI/Anthropic API
    
    if (references.length === 0) {
      return `I couldn't find specific information about "${question}" in your uploaded documents. Try asking about topics that are covered in your PDFs, or upload documents that contain relevant information.`;
    }

    // Generate a contextual response based on the references
    const context = references.map(ref => ref.excerpt).join(' ');
    
    // Simple template-based response (would be AI-generated in production)
    const responses = [
      `Based on your documents, here's what I found about "${question}":

${this.summarizeContent(references)}

The information comes from ${references.length} relevant section${references.length > 1 ? 's' : ''} across your documents. You can see the specific references on the right panel for more context.`,

      `I found several relevant passages about "${question}" in your documents:

${this.summarizeContent(references)}

These insights are drawn from ${references.map(r => r.documentName).join(', ')}. Check the references panel for exact page numbers and full context.`,

      `Regarding "${question}", your documents contain the following information:

${this.summarizeContent(references)}

This summary is based on ${references.length} relevant passage${references.length > 1 ? 's' : ''} found in your uploaded PDFs. See the references for more detailed information.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private summarizeContent(references: DocumentReference[]): string {
    if (references.length === 0) return "No relevant content found.";
    
    // Group references by document
    const byDocument = new Map<string, DocumentReference[]>();
    references.forEach(ref => {
      const existing = byDocument.get(ref.documentName) || [];
      existing.push(ref);
      byDocument.set(ref.documentName, existing);
    });

    let summary = '';
    byDocument.forEach((refs, docName) => {
      summary += `**From ${docName}:**\n`;
      refs.forEach(ref => {
        summary += `- ${ref.excerpt}\n`;
      });
      summary += '\n';
    });

    return summary.trim();
  }

  private generateRelatedQuestions(question: string, references: DocumentReference[]): string[] {
    if (references.length === 0) return [];

    // Extract key terms from references to suggest related questions
    const content = references.map(r => r.relevantText).join(' ');
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 4);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    const suggestions = [
      `What else does the document say about ${topWords[0]}?`,
      `Can you explain more about ${topWords[1]}?`,
      `How does ${topWords[0]} relate to ${topWords[1]}?`,
      `What are the key points about ${references[0]?.documentName.replace('.pdf', '')}?`,
      `Can you summarize the main concepts?`
    ];

    return suggestions.slice(0, 3);
  }

  getDocumentStatistics() {
    return {
      totalDocuments: this.documents.length,
      totalChatMessages: this.chatHistory.length,
      availableForChat: this.documents.filter(doc => 
        doc.textContent || doc.analysis?.text_content
      ).length
    };
  }
}

export const aiChatService = new AIChatService();