/**
 * Voice Tweet Generator Page
 * Main interface for generating tweets and threads using voice models
 */

'use client';

import { VoiceGeneratorEnhanced } from '@/components/voice-models/voice-generator-enhanced';

export default function VoiceTweetGeneratorPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voice Generator</h1>
        <p className="text-muted-foreground">
          Generate tweets and threads using AI-powered voice models from Twitter accounts
        </p>
      </div>

      {/* Enhanced Voice Generator */}
      <VoiceGeneratorEnhanced />
    </div>
  );
}
