"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Sparkles, 
  Copy, 
  RefreshCw,
  History,
  Send,
  Loader2
} from "lucide-react";

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  toolIcon: React.ReactNode;
  toolDescription: string;
  initialContent: string;
  onApply: (content: string) => void;
  onGenerate?: (input: string, options?: any) => Promise<string>;
}

const QUICK_ACTIONS = ['Shorter', 'Longer', 'Bolder', 'More Casual', 'More Formal'];

export const AIToolModal = ({
  isOpen,
  onClose,
  toolName,
  toolIcon,
  initialContent,
  onApply,
  onGenerate
}: AIToolModalProps) => {
  const [outputContent, setOutputContent] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOutputContent("");
      setCustomPrompt("");
      setHasGenerated(false);
    }
  }, [isOpen]);

  const handleGenerate = async (options?: any) => {
    if (!onGenerate || !initialContent.trim()) return;
    
    setIsGenerating(true);
    setHasGenerated(true);
    setOutputContent(""); // Clear previous output
    try {
      const result = await onGenerate(initialContent, options);
      setOutputContent(result);
    } catch (error) {
      console.error('Generation failed:', error);
      setOutputContent("Sorry, something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = (actionLabel: string) => {
    handleGenerate({ action: actionLabel.toLowerCase() });
  };
  
  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      handleGenerate({ customPrompt });
    }
  };

  const handleApply = (content: string) => {
    if (content) {
      onApply(content);
      onClose();
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // TODO: Add success toast
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                {toolIcon}
              </div>
              <DialogTitle className="text-lg font-semibold">{toolName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleGenerate()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
               <Button variant="ghost" size="sm">
                <History className="h-4 w-4" />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-500">Expand this tweet:</p>
            <blockquote>{initialContent}</blockquote>
          </div>
          
          <div className="mt-4">
            {isGenerating && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>AI is thinking...</span>
              </div>
            )}
            {hasGenerated && !isGenerating && (
              <div className="bg-blue-50/50 p-4 rounded-lg">
                <Textarea
                  value={outputContent}
                  onChange={(e) => setOutputContent(e.target.value)}
                  className="h-48 w-full resize-none bg-transparent border-0 focus:ring-0"
                  placeholder="Generated content will appear here..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(outputContent)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={() => handleApply(outputContent)}>
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Make it...</span>
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  disabled={isGenerating}
                >
                  {action}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={isGenerating}>+</Button>
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer Input */}
        <div className="border-t p-4 shrink-0 bg-white">
          <div className="relative">
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Select an action or start typing anything..."
              className="pr-12 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomPrompt();
                }
              }}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCustomPrompt}
              disabled={isGenerating || !customPrompt.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                    <Sparkles className="h-4 w-4 mr-2"/>
                    Actions Library
                </Button>
                 <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-2"/>
                    History
                </Button>
             </div>
             <p className="text-xs text-gray-400">Tweetinspire v1.0</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 