'use client';

import { useState } from 'react';
import { useCreatePost } from './create-post-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';


export function AITopicGenerator() {
  const { state, setTopic, setSelectedIdea, setAiIdeas } = useCreatePost();
  const [localTopic, setLocalTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateIdeas = async () => {
    if (!localTopic.trim() || !state.category) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: localTopic,
          category: state.category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      setAiIdeas(data.ideas);
      setTopic(localTopic);
    } catch (error) {
      console.error('Failed to generate ideas:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-3">
          Topic
        </Label>
        <Input
          placeholder="Enter your topic..."
          value={localTopic}
          onChange={(e) => setLocalTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}
        />
      </div>

      <Button
        onClick={handleGenerateIdeas}
        disabled={!localTopic.trim() || isGenerating}
        className="w-full flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Ideas...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Topic Ideas
          </>
        )}
      </Button>

      {state.aiIdeas.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">
            Choose an idea:
          </Label>
          <Select
            value={state.selectedIdea}
            onValueChange={setSelectedIdea}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an idea..." />
            </SelectTrigger>
            <SelectContent>
              {state.aiIdeas.map((idea, index) => (
                <SelectItem key={index} value={idea}>
                  {idea}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state.selectedIdea && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Selected:</span> {state.selectedIdea}
          </p>
        </div>
      )}
    </div>
  );
}