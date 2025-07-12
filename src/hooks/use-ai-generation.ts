import { useState, useCallback } from 'react';
import { AITool } from '@/lib/types/aiTools';

interface GenerationOptions {
  action?: string;
  customPrompt?: string;
  userStyle?: any;
  context?: {
    originalAuthor?: string;
    engagement?: any;
    topic?: string;
  };
}

interface GenerationResult {
  content: string;
  reasoning?: string;
  suggestions?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAIGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  /**
   * Generate content using AI tools
   */
  const generateContent = useCallback(async (
    tool: AITool,
    content: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool,
          content,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate content');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Refine content through conversational chat
   */
  const chatRefine = useCallback(async (
    currentContent: string,
    userMessage: string
  ): Promise<GenerationResult> => {
    setIsGenerating(true);
    setError(null);

    // Add user message to conversation history
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentContent,
          userMessage,
          conversationHistory: conversationHistory.slice(-6), // Keep last 6 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refine content');
      }

      const result = await response.json();
      
      // Add both user message and AI response to conversation history
      const aiChatMessage: ChatMessage = {
        role: 'assistant',
        content: result.data.content,
        timestamp: new Date(),
      };

      setConversationHistory(prev => [...prev, userChatMessage, aiChatMessage]);

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [conversationHistory]);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setConversationHistory([]);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    error,
    conversationHistory,
    
    // Actions
    generateContent,
    chatRefine,
    clearConversation,
    clearError,
  };
};
