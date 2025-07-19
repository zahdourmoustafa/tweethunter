'use client';

import { useState } from 'react';
import { useCreatePost } from './create-post-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Edit3, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RightPanel() {
  const { state, setGeneratedContent } = useCreatePost();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.generatedContent);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    setEditedContent(state.generatedContent);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedContent(editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const formatContentForDisplay = (content: string) => {
    if (!content) return '';
    
    // Split into tweets if it's a thread
    if (state.contentType === 'thread') {
      const tweets = content.split(/\n\n(?=\d+\/)/).filter(t => t.trim());
      return tweets;
    }
    
    return [content];
  };

  const displayContent = formatContentForDisplay(state.generatedContent);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Content Preview
          </h2>
          {state.generatedContent && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEdit}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {state.isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Generating your content...</p>
            </div>
          </div>
        ) : state.generatedContent ? (
          <div className="space-y-4">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Edit your content here..."
              />
            ) : (
              <div className="space-y-4">
                {state.contentType === 'thread' ? (
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="raw">Raw Text</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="space-y-4">
                      {displayContent.map((tweet, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="text-sm text-gray-600 mb-2">
                            Tweet {index + 1} of {displayContent.length}
                          </div>
                          <div className="whitespace-pre-wrap text-sm">
                            {tweet}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="raw">
                      <div className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-lg">
                        {state.generatedContent}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                    {state.generatedContent}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Ready to create amazing content
            </h3>
            <p className="text-sm text-gray-600">
              Configure your post settings and click "Generate Post" to get started
            </p>
          </div>
        )}
      </Card>

      {state.generatedContent && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Character count: {state.generatedContent.length}
              {state.contentType === 'tweet' && state.generatedContent.length > 280 && (
                <span className="text-red-600 ml-2">
                  (Over 280 characters)
                </span>
              )}
            </div>
            <Button size="sm" variant="outline">
              Save as Draft
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}