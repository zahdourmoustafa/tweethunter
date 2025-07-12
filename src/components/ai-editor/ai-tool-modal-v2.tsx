"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Copy, 
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  User,
  Bot
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
  onApply
}: AIToolModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { 
    isGenerating, 
    error, 
    generateContent, 
    chatRefine, 
    clearConversation,
    clearError 
  } = useAIGeneration();

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputMessage("");
      setCurrentGeneration("");
      clearConversation();
      clearError();
      // Auto-generate initial content
      handleInitialGenerate();
    }
  }, [isOpen, clearConversation, clearError]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
        }, 100);
      }
    };

    scrollToBottom();
  }, [messages, isGenerating]);

  /**
   * Clean AI response by removing conversational prefixes and introductions
   */
  const cleanAIResponse = (content: string): string => {
    // Remove common conversational prefixes and introductions
    const prefixPatterns = [
      // Basic responses
      /^Sure!\s*/i,
      /^Of course!\s*/i,
      /^Absolutely!\s*/i,
      /^Certainly!\s*/i,
      /^Perfect!\s*/i,
      /^Great!\s*/i,
      /^Excellent!\s*/i,
      /^Done!\s*/i,
      /^Okay!\s*/i,
      /^Alright!\s*/i,
      
      // "Here's" patterns
      /^Here's\s+.*?:\s*/i,
      /^Here you go:\s*/i,
      /^Here it is:\s*/i,
      /^Here's the\s+.*?:\s*/i,
      /^Here's a\s+.*?:\s*/i,
      /^Here's an\s+.*?:\s*/i,
      /^Here's your\s+.*?:\s*/i,
      
      // "I'll" and "I've" patterns
      /^I'll\s+.*?:\s*/i,
      /^I've\s+.*?:\s*/i,
      /^I can\s+.*?:\s*/i,
      /^I will\s+.*?:\s*/i,
      /^I have\s+.*?:\s*/i,
      
      // "Let me" patterns
      /^Let me\s+.*?:\s*/i,
      /^Let's\s+.*?:\s*/i,
      
      // Work/help patterns
      /^I'll help you\s+.*?:\s*/i,
      /^I'll work on\s+.*?:\s*/i,
      /^I'll make\s+.*?:\s*/i,
      /^I'll create\s+.*?:\s*/i,
      /^I'll transform\s+.*?:\s*/i,
      /^I'll improve\s+.*?:\s*/i,
      /^I'll enhance\s+.*?:\s*/i,
      
      // Version patterns
      /^.*version.*?:\s*/i,
      /^.*take.*?:\s*/i,
      /^.*approach.*?:\s*/i,
      
      // Multi-line introductions (more aggressive)
      /^.*?(?:help|work|make|create|transform|improve|enhance).*?\n\n/i,
      /^.*?(?:here's|here is).*?\n\n/i,
      
      // Remove entire first paragraph if it contains work-related words
      /^[^.!?]*(?:help|work|make|create|transform|improve|enhance|version|take)[^.!?]*[.!?]\s*/i,
    ];

    let cleanedContent = content;
    
    // Apply all cleaning patterns
    for (const pattern of prefixPatterns) {
      cleanedContent = cleanedContent.replace(pattern, '');
    }
    
    // Remove extra whitespace and newlines at the beginning
    cleanedContent = cleanedContent.replace(/^\s+/, '');
    
    // If content starts with quotes, keep them
    // If it's still conversational, try to extract the actual content
    if (cleanedContent.includes('\n\n')) {
      const paragraphs = cleanedContent.split('\n\n');
      // If first paragraph seems conversational, use the second one
      if (paragraphs.length > 1 && paragraphs[0].length < 100 && 
          /(?:help|work|make|create|transform|improve|enhance|version)/i.test(paragraphs[0])) {
        cleanedContent = paragraphs.slice(1).join('\n\n');
      }
    }
    
    // Final cleanup
    cleanedContent = cleanedContent.replace(/^\s+/, '').trim();
    
    return cleanedContent;
  };

  /**
   * Initial AI generation when modal opens
   */
  const handleInitialGenerate = async () => {
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
      onApply(cleanedContent);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error("Failed to generate content. Please try again.");
    }
  };

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
      onApply(cleanedContent);
      toast.success(`Applied: ${actionLabel}`);
    } catch (error) {
      console.error('Quick action failed:', error);
      toast.error("Failed to apply changes. Please try again.");
    }
  };
  
  /**
   * Handle custom chat messages
   */
  const handleSendMessage = async () => {
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
      onApply(cleanedContent);
    } catch (error) {
      console.error('Chat failed:', error);
      toast.error("Failed to process message. Please try again.");
    }
  };

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
      onApply(cleanedContent);
      toast.success("Content regenerated!");
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error("Failed to regenerate content. Please try again.");
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
      <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                {toolIcon}
              </div>
              <div>
                <DialogTitle className="text-base font-medium">{toolName}</DialogTitle>
                <p className="text-xs text-gray-600">{toolDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                title="Regenerate"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCopy}
                disabled={!currentGeneration}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                title="Copy latest result"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {messages.length > 0 && !isGenerating && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  disabled={isGenerating}
                  className="text-xs h-7 px-3 text-gray-600 border-gray-200 hover:bg-white"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <div className="border-t p-4 shrink-0 bg-white">
          <div className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me to modify the content, or give me specific instructions..."
              className="pr-12 text-sm resize-none border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              onClick={handleSendMessage}
              disabled={isGenerating || !inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
