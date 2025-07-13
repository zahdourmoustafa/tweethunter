/**
 * Grok AI Client Configuration
 * Using X.AI's Grok-4 model for Twitter content generation
 */

import OpenAI from 'openai';
import { serverEnv } from '@/config/env.server';

// Initialize Grok client with X.AI endpoint
export const grokClient = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: serverEnv.GROK_API_KEY, // Make sure this is in your .env
});

// Grok-4 model identifier
export const GROK_MODEL = "grok-4-0709";

// Export types for consistency
export type GrokMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GrokCompletionParams = {
  model: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};
