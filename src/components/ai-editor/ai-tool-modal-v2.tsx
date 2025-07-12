"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Copy, 
  RefreshCw,
  Send,
  AlertCircle,
  User,
  Bot,
  Save
} from "lucide-react";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { AITool } from "@/lib/types/aiTools";
import { toast } from "sonner";

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  toolIcon: React.ReactNode;
  toolDescription: string;
  toolId: AITool;
  initialContent: string;
  onApply: (content: string) => void;
  // New props for continuing existing conversations
  existingMessages?: ChatMessage[];
  existingGeneration?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = ['Make it shorter', 'Make it longer', 'More casual', 'More formal', 'Add emojis', 'Remove emojis'];

export const AIToolModalV2 = ({
  isOpen,
  onClose,
  toolName,
  toolIcon,
  toolDescription,
  toolId,
  initialContent,
  onApply,
  existingMessages = [],
  existingGeneration
}: AIToolModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { 
    isGenerating, 
    error, 
    generateContent, 
    chatRefine, 
    clearConversation,
    clearError 
  } = useAIGeneration();

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (existingMessages && existingMessages.length > 0) {
        // Load existing conversation
        setMessages(existingMessages);
        setCurrentGeneration(existingGeneration || "");
      } else {
        // New conversation - will auto-generate
        setMessages([]);
        setCurrentGeneration("");
        if (initialContent.trim()) {
          // Delay to prevent infinite loop
          setTimeout(() => {
            handleInitialGenerate();
          }, 100);
        }
      }
      setInputMessage("");
      setIsInitialized(true);
    } else if (!isOpen) {
      // Reset when modal closes
      setIsInitialized(false);
    }
  }, [isOpen]); // Remove isInitialized from dependencies to prevent loop

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        setTimeout(() => {
          if (scrollAreaRef.current) { // Double check to prevent null access
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    scrollToBottom();
  }, [messages, isGenerating]);

  /**
   * Clean and format AI response (simplified since new AI agent returns clean content)
   */
  const cleanAIResponse = useCallback((content: string): string => {
    // Basic cleanup - trim whitespace and remove any remaining quotes
    let cleaned = content.trim();
    
    // Remove quotes if they wrap the entire content
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned.trim();
  }, []);

  /**
   * Auto-sync generated content to right panel in real-time
   */
  const applyContentRef = useRef(onApply);
  applyContentRef.current = onApply;

  useEffect(() => {
    if (currentGeneration && applyContentRef.current) {
      applyContentRef.current(currentGeneration);
    }
  }, [currentGeneration]); // Remove onApply from dependencies to prevent loop

  /**
   * Initial AI generation when modal opens
   */
  const handleInitialGenerate = useCallback(async () => {
    if (!initialContent.trim()) return;
    
    try {
      const result = await generateContent(toolId, initialContent);
      const cleanedContent = cleanAIResponse(result.content);
      setCurrentGeneration(cleanedContent);
      
      // Add AI response directly with cleaned generated content
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: cleanedContent,
        timestamp: new Date()
      };
      setMessages([aiMessage]);
      
      // Auto-apply to right panel
      applyContentRef.current(cleanedContent);
      toast.success("✨ Content generated and applied to your tweet!");
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error("Failed to generate content. Please try again.");
    }
  }, [initialContent, toolId, generateContent, cleanAIResponse]);

  /**
   * Handle quick action buttons
   */
  const handleQuickAction = async (actionLabel: string) => {
    if (!currentGeneration) return;

    // Add user message for quick action
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: actionLabel,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await chatRefine(currentGeneration, actionLabel);
      const cleanedContent = cleanAIResponse(result.content);
      setCurrentGeneration(cleanedContent);
      
      // Add AI response with cleaned content
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-apply to right panel
      applyContentRef.current(cleanedContent);
      toast.success(`✅ ${actionLabel} applied to your tweet!`);
    } catch (error) {
      console.error('Quick action failed:', error);
      toast.error("Failed to apply changes. Please try again.");
    }
  };
  
  /**
   * Handle custom chat messages
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputMessage.trim();
    setInputMessage("");

    if (!currentGeneration) {
      await handleInitialGenerate();
      return;
    }

    try {
      const result = await chatRefine(currentGeneration, currentInput);
      const cleanedContent = cleanAIResponse(result.content);
      setCurrentGeneration(cleanedContent);
      
      // Add AI response with cleaned content
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-apply to right panel
      applyContentRef.current(cleanedContent);
      toast.success("🔄 Content updated and applied to your tweet!");
    } catch (error) {
      console.error('Chat failed:', error);
      toast.error("Failed to process message. Please try again.");
    }
  }, [inputMessage, currentGeneration, handleInitialGenerate, chatRefine, cleanAIResponse]);

  /**
   * Regenerate content
   */
  const handleRegenerate = async () => {
    try {
      const result = await generateContent(toolId, initialContent);
      const cleanedContent = cleanAIResponse(result.content);
      setCurrentGeneration(cleanedContent);
      
      // Add regeneration message with cleaned content
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: cleanedContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-apply to right panel
      applyContentRef.current(cleanedContent);
      toast.success("🔄 Content regenerated and applied to your tweet!");
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error("Failed to regenerate content. Please try again.");
    }
  };

  /**
   * Save content to database
   */
  const handleSaveContent = async () => {
    if (!currentGeneration) {
      toast.error("No content to save");
      return;
    }

    try {
      // For now, we'll use a placeholder user ID - in real app, get from auth
      const userId = "user-placeholder"; // TODO: Replace with actual user ID from auth
      
      const response = await fetch('/api/saved-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          content: currentGeneration,
          originalContent: initialContent,
          toolUsed: toolName,
          chatHistory: messages,
          tags: []
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success("💾 Content saved successfully!");
      } else {
        throw new Error(result.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error("Failed to save content. Please try again.");
    }
  };

  /**
   * Copy latest generation to clipboard
   */
  const handleCopy = async () => {
    if (!currentGeneration) return;
    
    try {
      await navigator.clipboard.writeText(currentGeneration);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error("Failed to copy content.");
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0 mx-4 sm:mx-auto animate-scale-in">
        {/* Header */}
        <DialogHeader className="p-3 sm:p-4 pb-2 sm:pb-3 border-b shrink-0 bg-gray-50 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black rounded-full flex items-center justify-center text-white shrink-0">
                <div className="scale-75 sm:scale-100">
                  {toolIcon}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm sm:text-base font-medium truncate">{toolName}</DialogTitle>
                <p className="text-xs text-gray-600 truncate">{toolDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveContent}
                disabled={!currentGeneration}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200 hover:scale-110"
                title="Save content"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                title="Regenerate"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCopy}
                disabled={!currentGeneration}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                title="Copy latest result"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110">
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 animate-scale-in">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm leading-relaxed transition-all duration-200 hover:shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 px-1 animate-fade-in ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center text-white shrink-0 animate-scale-in">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isGenerating && (
                <div className="flex gap-2 sm:gap-3 justify-start animate-slide-up">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse-soft">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex gap-2 sm:gap-3 justify-start animate-slide-up">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0 animate-scale-in">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm text-red-700 max-w-[85%] sm:max-w-[80%]">
                    <div className="break-words">{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {messages.length > 0 && !isGenerating && (
          <div className="px-3 sm:px-4 py-2 border-t bg-gray-50 animate-fade-in">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {QUICK_ACTIONS.map((action, index) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  disabled={isGenerating}
                  className="text-xs h-6 sm:h-7 px-2 sm:px-3 text-gray-600 border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 flex-shrink-0 transition-all duration-200 hover:scale-105 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <div className="border-t p-3 sm:p-4 shrink-0 bg-white">
          <div className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me to modify the content, or give me specific instructions..."
              className="pr-10 sm:pr-12 text-sm resize-none border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px] sm:min-h-[80px] transition-all duration-200"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={handleSendMessage}
              disabled={isGenerating || !inputMessage.trim()}
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
