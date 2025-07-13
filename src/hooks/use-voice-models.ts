/**
 * React hook for managing voice models
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface VoiceModel {
  id: string;
  twitterUsername: string;
  displayName: string;
  confidenceScore: number;
  tweetCount: number;
  lastAnalyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceModelWithAnalysis extends VoiceModel {
  analysisData: any;
}

interface UseVoiceModelsReturn {
  voiceModels: VoiceModel[];
  loading: boolean;
  error: string | null;
  createVoiceModel: (twitterUsername: string) => Promise<boolean>;
  refreshVoiceModel: (id: string) => Promise<boolean>;
  deleteVoiceModel: (id: string) => Promise<boolean>;
  getVoiceModel: (id: string) => Promise<VoiceModelWithAnalysis | null>;
  refetch: () => Promise<void>;
}

export function useVoiceModels(): UseVoiceModelsReturn {
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all voice models
  const fetchVoiceModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/voice-models');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voice models');
      }

      setVoiceModels(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to load voice models: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new voice model
  const createVoiceModel = async (twitterUsername: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/voice-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ twitterUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create voice model');
      }

      // Add new model to the list
      setVoiceModels(prev => [...prev, data.data]);

      // Show success message with warnings if any
      if (data.warnings && data.warnings.length > 0) {
        toast.success('Voice model created successfully', {
          description: `Warnings: ${data.warnings.join(', ')}`,
        });
      } else {
        toast.success('Voice model created successfully');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to create voice model: ${errorMessage}`);
      return false;
    }
  };

  // Refresh voice model
  const refreshVoiceModel = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/voice-models/${id}`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh voice model');
      }

      // Update the model in the list
      setVoiceModels(prev =>
        prev.map(model => (model.id === id ? data.data : model))
      );

      toast.success('Voice model refreshed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to refresh voice model: ${errorMessage}`);
      return false;
    }
  };

  // Delete voice model
  const deleteVoiceModel = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/voice-models/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete voice model');
      }

      // Remove model from the list
      setVoiceModels(prev => prev.filter(model => model.id !== id));

      toast.success('Voice model deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to delete voice model: ${errorMessage}`);
      return false;
    }
  };

  // Get detailed voice model with analysis data
  const getVoiceModel = async (id: string): Promise<VoiceModelWithAnalysis | null> => {
    try {
      const response = await fetch(`/api/voice-models/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voice model');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to fetch voice model: ${errorMessage}`);
      return null;
    }
  };

  // Refetch voice models
  const refetch = async () => {
    await fetchVoiceModels();
  };

  // Initial fetch
  useEffect(() => {
    fetchVoiceModels();
  }, []);

  return {
    voiceModels,
    loading,
    error,
    createVoiceModel,
    refreshVoiceModel,
    deleteVoiceModel,
    getVoiceModel,
    refetch,
  };
}
