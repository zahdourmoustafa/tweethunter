'use client';

import { useCreatePost } from './create-post-context';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
export function GenerateButton() {
  const { state, setGeneratedContent, setIsGenerating } = useCreatePost();

  const handleGenerate = async () => {
    if (!state.category || !state.contentType || !state.selectedIdea) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: state.category,
          contentType: state.contentType,
          idea: state.selectedIdea,
          tone: state.tone,
          topic: state.topic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={state.isGenerating}
      className="w-full flex items-center gap-2"
      size="lg"
    >
      {state.isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating Content...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Generate Post
        </>
      )}
    </Button>
  );
}