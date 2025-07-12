"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  MessageSquare, 
  Calendar,
  Sparkles,
  Edit,
  Copy,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AIToolModalV2 } from "@/components/ai-editor/ai-tool-modal-v2";
import { AITool } from "@/lib/types/aiTools";

interface SavedContent {
  id: string;
  title: string;
  content: string;
  originalContent?: string;
  toolUsed: string;
  chatHistory: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const TOOL_COLORS: Record<string, string> = {
  'Improve Tweet': 'bg-blue-100 text-blue-800',
  'Add Emojis': 'bg-yellow-100 text-yellow-800',
  'Make Shorter': 'bg-red-100 text-red-800',
  'Expand Tweet': 'bg-green-100 text-green-800',
  'Create Hook': 'bg-purple-100 text-purple-800',
  'Create CTA': 'bg-orange-100 text-orange-800',
  'More Casual': 'bg-pink-100 text-pink-800',
  'More Formal': 'bg-indigo-100 text-indigo-800',
  'Fix Grammar': 'bg-gray-100 text-gray-800',
};

export default function GeneratedContentPage() {
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<SavedContent | null>(null);

  // Fetch saved content
  const fetchSavedContent = async () => {
    try {
      setLoading(true);
      const userId = "user-placeholder"; // TODO: Replace with actual user ID from auth
      const response = await fetch(`/api/saved-content?userId=${userId}`);
      const result = await response.json();

      if (result.status === 'success') {
        setSavedContent(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching saved content:', error);
      toast.error("Failed to load saved content");
    } finally {
      setLoading(false);
    }
  };

  // Delete content
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const userId = "user-placeholder"; // TODO: Replace with actual user ID from auth
      const response = await fetch(`/api/saved-content?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSavedContent(prev => prev.filter(item => item.id !== id));
        toast.success("Content deleted successfully");
      } else {
        throw new Error(result.error || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error("Failed to delete content");
    }
  };

  // Copy content to clipboard
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  // Open content in AI modal for editing
  const handleEdit = (content: SavedContent) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // Filter content based on search and tool filter
  const filteredContent = savedContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTool = !selectedTool || item.toolUsed === selectedTool;
    return matchesSearch && matchesTool;
  });

  // Get unique tools for filter
  const uniqueTools = Array.from(new Set(savedContent.map(item => item.toolUsed)));

  useEffect(() => {
    fetchSavedContent();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Generated Content</h1>
          </div>
          <p className="text-gray-600">
            Manage and continue editing your AI-generated tweets
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tools</option>
                {uniqueTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {savedContent.length === 0 ? "No saved content yet" : "No content matches your search"}
            </h3>
            <p className="text-gray-500">
              {savedContent.length === 0 
                ? "Start generating content with AI tools to see them here"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {item.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Preview */}
                <div className="mb-4">
                  <p className="text-gray-700 text-sm line-clamp-4 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {/* Tool Badge */}
                <div className="mb-4">
                  <Badge 
                    variant="secondary" 
                    className={`${TOOL_COLORS[item.toolUsed] || 'bg-gray-100 text-gray-800'} text-xs`}
                  >
                    {item.toolUsed}
                  </Badge>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.createdAt)}
                  </div>
                  {item.chatHistory.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {item.chatHistory.length} messages
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Continue Editing
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(item.content)}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* AI Modal for Editing */}
        {selectedContent && (
          <AIToolModalV2
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedContent(null);
            }}
            toolId={AITool.ImproveTweet} // Default tool, will be overridden by saved content
            toolName={selectedContent.toolUsed}
            toolIcon={<Edit className="h-4 w-4" />}
            toolDescription={`Continue editing your ${selectedContent.toolUsed.toLowerCase()} content`}
            initialContent={selectedContent.originalContent || selectedContent.content}
            onApply={(content) => {
              // Update the content in the list
              setSavedContent(prev => 
                prev.map(item => 
                  item.id === selectedContent.id 
                    ? { ...item, content, updatedAt: new Date().toISOString() }
                    : item
                )
              );
            }}
            // Pass existing chat history to continue conversation
            existingMessages={selectedContent.chatHistory.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))}
            existingGeneration={selectedContent.content}
          />
        )}
      </div>
    </div>
  );
}
