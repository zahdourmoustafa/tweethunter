/**
 * React hook for tweet generation using voice models
 */

import { useState } from 'react';
import { toast } from 'sonner';

export interface TweetVariation {
  id: string;
  content: string;
  variationType: 'short-punchy' | 'medium-story' | 'long-detailed' | 'thread-style' | 'casual-personal' | 'professional-insight';
  characterCount: number;
  metadata: {
    generationTime: number;
    promptUsed: string;
    aiModel: string;
  };
}

interface UseTweetGenerationReturn {
  variations: TweetVariation[];
  loading: boolean;
  error: string | null;
  generateTweets: (voiceModelId: string, idea: string) => Promise<boolean>;
  regenerateVariation: (voiceModelId: string, idea: string, variationType: string) => Promise<boolean>;
  clearVariations: () => void;
}

export function useTweetGeneration(): UseTweetGenerationReturn {
  const [variations, setVariations] = useState<TweetVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate all 6 tweet variations
  const generateTweets = async (voiceModelId: string, idea: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/voice-models/${voiceModelId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tweets');
      }

      setVariations(data.data.variations || []);
      
      toast.success('Tweet variations generated successfully!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to generate tweets: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Regenerate a specific variation
  const regenerateVariation = async (
    voiceModelId: string, 
    idea: string, 
    variationType: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/voice-models/${voiceModelId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea, 
          regenerateType: variationType 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate tweet');
      }

      // Update the specific variation in the array
      setVariations(prev => 
        prev.map(variation => 
          variation.variationType === variationType 
            ? data.data.variation 
            : variation
        )
      );

      toast.success(`${variationType} variation regenerated!`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to regenerate tweet: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear all variations
  const clearVariations = () => {
    setVariations([]);
    setError(null);
  };

  return {
    variations,
    loading,
    error,
    generateTweets,
    regenerateVariation,
    clearVariations,
  };
}
