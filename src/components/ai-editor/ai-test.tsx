"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIToolModalV2 } from "./ai-tool-modal-v2";
import { AITool } from "@/lib/types/aiTools";
import { Sparkles } from "lucide-react";

export const AITest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("Just shipped a new feature that I'm really excited about! The feedback from early users has been incredible.");

  const handleApply = (newContent: string) => {
    setContent(newContent);
    console.log("Applied content:", newContent);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">AI Editor Test</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Current Content:</h3>
        <p className="text-gray-700">{content}</p>
      </div>

      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Test Expand Tweet
      </Button>

      <AIToolModalV2
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        toolName="Expand Tweet"
        toolIcon={<Sparkles className="h-4 w-4" />}
        toolDescription="Transform this tweet into a compelling thread"
        toolId={AITool.ExpandTweet}
        initialContent={content}
        onApply={handleApply}
      />
    </div>
  );
};
