/**
 * Tweet Generation Service
 * Generates tweet variations using OpenAI based on voice models
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { voiceAnalysisService, type VoiceAnalysis } from './voice-analysis';
import { db } from '@/lib/db';
import { generatedTweets, type NewGeneratedTweet } from '@/db/schema';

export type VariationType = 'short-punchy' | 'medium-story' | 'long-detailed' | 'thread-style' | 'casual-personal' | 'professional-insight';

interface TweetVariation {
  id: string;
  content: string;
  variationType: VariationType;
  characterCount: number;
  metadata: {
    generationTime: number;
    promptUsed: string;
    aiModel: string;
  };
}

export class TweetGenerationService {
  /**
   * Generate 6 tweet variations based on voice model and idea
   */
  async generateVariations(
    userId: string,
    voiceModelId: string,
    originalIdea: string
  ): Promise<{
    success: boolean;
    variations?: TweetVariation[];
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      // Get voice model
      const voiceModel = await voiceAnalysisService.getVoiceModel(voiceModelId);
      if (!voiceModel || voiceModel.userId !== userId) {
        return {
          success: false,
          error: 'Voice model not found',
        };
      }

      // Validate analysis data completeness
      if (!this.isValidAnalysisData(voiceModel.analysisData)) {
        return {
          success: false,
          error: 'Voice model analysis data is incomplete. Please refresh the voice model.',
        };
      }

      // Generate all 6 variations with different lengths and styles
      const variationTypes: VariationType[] = [
        'short-punchy',
        'medium-story', 
        'long-detailed',
        'thread-style',
        'casual-personal',
        'professional-insight'
      ];

      const generationPromises = variationTypes.map(type => 
        this.generateSingleVariation(originalIdea, voiceModel.analysisData as VoiceAnalysis, type)
      );

      const results = await Promise.all(generationPromises);
      const totalTime = Date.now() - startTime;

      // Create TweetVariation objects
      const variations: TweetVariation[] = results.map((result, index) => ({
        id: crypto.randomUUID(),
        content: result.content,
        variationType: variationTypes[index],
        characterCount: result.content.length,
        metadata: {
          generationTime: Math.round(totalTime / 6), // Average time per variation
          promptUsed: result.promptUsed,
          aiModel: 'gpt-4-turbo-preview',
        },
      }));

      // Save to database
      const dbInserts: NewGeneratedTweet[] = variations.map(variation => ({
        userId,
        voiceModelId,
        originalIdea,
        generatedContent: variation.content,
        variationType: variation.variationType,
        characterCount: variation.characterCount.toString(),
        metadata: variation.metadata,
      }));

      await db.insert(generatedTweets).values(dbInserts);

      return {
        success: true,
        variations,
      };
    } catch (error) {
      console.error('Error generating tweet variations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate if analysis data is complete enough for generation
   */
  private isValidAnalysisData(data: any): data is VoiceAnalysis {
    return (
      data &&
      data.tweetStructure &&
      data.writingStyle &&
      data.contentPatterns &&
      data.engagementTactics &&
      data.formatting &&
      data.vocabulary &&
      typeof data.tweetStructure.averageLength === 'number' &&
      Array.isArray(data.writingStyle.tone) &&
      Array.isArray(data.contentPatterns.openingHooks)
    );
  }

  /**
   * Generate a single tweet variation with varied length based on type
   */
  private async generateSingleVariation(
    idea: string,
    voiceAnalysis: VoiceAnalysis,
    variationType: VariationType
  ): Promise<{ content: string; promptUsed: string }> {
    const prompt = this.buildPrompt(idea, voiceAnalysis, variationType);

    // Adjust parameters based on variation type for different lengths
    const params = this.getGenerationParams(variationType, voiceAnalysis);

    const result = await generateText({
      model: openai('gpt-4-turbo-preview'),
      prompt,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    });

    // Clean and format content while preserving voice authenticity
    const cleanedContent = this.cleanAndFormatContent(result.text);

    return {
      content: cleanedContent,
      promptUsed: prompt,
    };
  }

  /**
   * Get generation parameters based on variation type and user's typical tweet length
   */
  private getGenerationParams(variationType: VariationType, analysis: VoiceAnalysis) {
    const baseLength = analysis.tweetStructure.averageLength;
    
    switch (variationType) {
      case 'short-punchy':
        return {
          temperature: 0.7,
          maxTokens: Math.max(50, Math.round(baseLength * 0.3)), // 30% of their average
        };
      case 'medium-story':
        return {
          temperature: 0.75,
          maxTokens: Math.max(100, Math.round(baseLength * 0.8)), // 80% of their average
        };
      case 'long-detailed':
        return {
          temperature: 0.8,
          maxTokens: Math.max(200, Math.round(baseLength * 1.5)), // 150% of their average
        };
      case 'thread-style':
        return {
          temperature: 0.75,
          maxTokens: Math.max(250, Math.round(baseLength * 1.8)), // 180% of their average
        };
      case 'casual-personal':
        return {
          temperature: 0.8,
          maxTokens: Math.max(80, Math.round(baseLength * 0.9)), // 90% of their average
        };
      case 'professional-insight':
        return {
          temperature: 0.7,
          maxTokens: Math.max(150, Math.round(baseLength * 1.2)), // 120% of their average
        };
      default:
        return {
          temperature: 0.75,
          maxTokens: Math.max(100, baseLength),
        };
    }
  }

  /**
   * Build generation prompt that matches their actual Twitter format
   */
  private buildPrompt(idea: string, analysis: VoiceAnalysis, variationType: VariationType): string {
    const baseContext = this.buildVoiceContext(analysis);
    const variationInstructions = this.getVariationInstructions(variationType, analysis);

    return `
You are perfectly mimicking this person's EXACT Twitter writing style and format. Study their patterns and replicate them exactly.

THEIR ACTUAL TWITTER PATTERNS:
${baseContext}

CRITICAL FORMATTING RULES:
- Match their typical tweet length: ~${analysis.tweetStructure.averageLength} characters
- Use THEIR formatting style: ${analysis.formatting.usesBulletPoints ? 'bullet points when listing' : 'natural paragraph flow'}
- Copy their line break patterns exactly
- ${analysis.formatting.usesEmojis ? `Include emojis like they do (${analysis.formatting.emojiFrequency}% frequency)` : 'Avoid emojis like they do'}
- Use their punctuation style: ${analysis.formatting.punctuationStyle.join(', ')}

${variationInstructions}

Original idea: "${idea}"

Write EXACTLY as this person would write this tweet. Match their format, length, and style perfectly.
`;
  }

  /**
   * Build voice context emphasizing authentic replication over generic patterns
   */
  private buildVoiceContext(analysis: VoiceAnalysis): string {
    return `
PERSON'S AUTHENTIC VOICE PROFILE:

WRITING PERSONALITY:
- Primary tones: ${analysis.writingStyle.tone.join(', ')}
- Formality: ${analysis.writingStyle.formalityLevel}/10 (${analysis.writingStyle.formalityLevel > 7 ? 'Professional' : analysis.writingStyle.formalityLevel > 4 ? 'Casual-Professional' : 'Very Casual'})
- Humor usage: ${analysis.writingStyle.humorLevel}/10 (${analysis.writingStyle.humorLevel > 7 ? 'Very Funny' : analysis.writingStyle.humorLevel > 4 ? 'Occasionally Funny' : 'Serious'})
- Personal sharing: ${analysis.writingStyle.vulnerabilityLevel}/10 (${analysis.writingStyle.vulnerabilityLevel > 7 ? 'Very Open' : analysis.writingStyle.vulnerabilityLevel > 4 ? 'Moderately Personal' : 'Private'})

HOW THEY START TWEETS:
- Typical openings: "${analysis.contentPatterns.openingHooks.slice(0, 5).join('", "')}"
- Their signature phrases: "${analysis.contentPatterns.commonPhrases.slice(0, 8).join('", "')}"

HOW THEY ENGAGE:
- ${analysis.engagementTactics.usesQuestions ? `Asks questions in ${analysis.engagementTactics.questionFrequency}% of tweets` : 'Rarely asks questions'}
- ${analysis.engagementTactics.usesControversialTakes ? 'Uses controversial/bold takes' : 'Avoids controversial statements'}
- ${analysis.engagementTactics.usesPersonalAnecdotes ? 'Shares personal stories frequently' : 'Keeps content less personal'}

THEIR FORMATTING STYLE:
- Tweet length: Usually ~${analysis.tweetStructure.averageLength} characters
- ${analysis.formatting.usesEmojis ? `Uses emojis in ${analysis.formatting.emojiFrequency}% of tweets` : 'Rarely uses emojis'}
- ${analysis.formatting.usesBulletPoints ? 'Often uses bullet points for lists' : 'Prefers paragraph format'}
- ${analysis.formatting.usesNumberedLists ? 'Sometimes uses numbered lists' : 'Avoids numbered lists'}
- Punctuation: ${analysis.formatting.punctuationStyle.join(', ')}

THEIR VOCABULARY:
- Common words: ${analysis.vocabulary.commonWords.slice(0, 10).join(', ')}
- Industry terms: ${analysis.vocabulary.industryTerms.slice(0, 5).join(', ') || 'None specific'}
- Unique expressions: "${analysis.vocabulary.uniquePhrases.slice(0, 3).join('", "')}"
- Sentence style: Averages ${analysis.vocabulary.averageWordsPerSentence} words per sentence

THREAD BEHAVIOR:
- ${analysis.tweetStructure.usesThreads ? `Creates threads ${analysis.tweetStructure.threadFrequency}% of the time for complex topics` : 'Rarely creates threads, prefers single tweets'}
`;
  }

  /**
   * Get variation instructions that match their actual content patterns
   */
  private getVariationInstructions(variationType: VariationType, analysis: VoiceAnalysis): string {
    const avgLength = analysis.tweetStructure.averageLength;
    const usesThreads = analysis.tweetStructure.usesThreads;
    const personalLevel = analysis.writingStyle.vulnerabilityLevel;
    
    switch (variationType) {
      case 'short-punchy':
        return `
VARIATION: Short & Punchy (${Math.round(avgLength * 0.3)} chars target)
- Write a brief, impactful tweet in their style
- Use their most common opening phrases: "${analysis.contentPatterns.openingHooks.slice(0, 2).join('", "')}"
- Keep it under 100 characters if possible
- Maximum impact, minimum words
`;

      case 'medium-story':
        return `
VARIATION: Medium Story (${Math.round(avgLength * 0.8)} chars target)
- Tell a brief story or share an experience in their voice
- Use their storytelling patterns: ${analysis.contentPatterns.storytellingPatterns.slice(0, 2).join(', ')}
- Include personal touches if they do (vulnerability level: ${personalLevel}/10)
- Natural line breaks between thoughts
`;

      case 'long-detailed':
        return `
VARIATION: Detailed Content (${Math.round(avgLength * 1.5)} chars target)
- Provide more comprehensive coverage of the idea
- Use their detailed explanation style
- Include specific examples or data if that's their pattern
- Break into multiple paragraphs with line breaks
- Match their longer tweet format exactly
`;

      case 'thread-style':
        return `
VARIATION: Thread-Style ${usesThreads ? '(they use threads)' : '(adapted to their style)'}
- Write as if this could be the start of a thread
- Use their thread opening patterns
- Set up for continuation but make it complete
- Include their typical thread hooks and structure
`;

      case 'casual-personal':
        return `
VARIATION: Casual & Personal (vulnerability: ${personalLevel}/10)
- Use their most casual tone and vocabulary
- Include personal elements if they share them (${personalLevel > 5 ? 'they are open' : 'they are private'})
- Use their common casual phrases: "${analysis.contentPatterns.commonPhrases.slice(0, 3).join('", "')}"
- Natural, conversational flow
`;

      case 'professional-insight':
        return `
VARIATION: Professional Insight (formality: ${analysis.writingStyle.formalityLevel}/10)
- Use their professional/expert voice
- Include industry terms they use: ${analysis.vocabulary.industryTerms.slice(0, 3).join(', ')}
- Share insights in their authoritative style
- Match their professional tweet format
`;

      default:
        return 'Write exactly as this person would naturally express this idea.';
    }
  }

  /**
   * Clean and format content while preserving authentic voice patterns
   */
  private cleanAndFormatContent(content: string): string {
    let cleaned = content.trim();
    
    // Remove AI conversation starters
    const conversationalPhrases = [
      /^here's\s+/i,
      /^i'll\s+generate\s+/i,
      /^let\s+me\s+/i,
      /^here\s+is\s+/i,
      /^this\s+is\s+/i,
      /^\w+\s+version:\s*/i,
      /^generated\s+content:\s*/i,
      /^tweet:\s*/i,
    ];
    
    conversationalPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Remove quotes if they wrap entire content
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove promotional/engagement bait
    const promotionalPhrases = [
      /what\s+do\s+you\s+think\?.*$/gmi,
      /drop\s+a\s+comment.*$/gmi,
      /let\s+me\s+know.*$/gmi,
      /share\s+if\s+you\s+agree.*$/gmi,
      /tag\s+someone.*$/gmi,
    ];
    
    promotionalPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Clean up excessive spacing but preserve intentional line breaks
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single
    cleaned = cleaned.replace(/\n\s+/g, '\n'); // Remove leading spaces on new lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
    
    // Remove meta commentary
    cleaned = cleaned.replace(/\[.*?\]/gi, '');
    cleaned = cleaned.replace(/\(Note:.*?\)/gi, '');
    
    return cleaned.trim();
  }

  /**
   * Regenerate a specific variation
   */
  async regenerateVariation(
    userId: string,
    voiceModelId: string,
    originalIdea: string,
    variationType: VariationType
  ): Promise<{
    success: boolean;
    variation?: TweetVariation;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      // Get voice model
      const voiceModel = await voiceAnalysisService.getVoiceModel(voiceModelId);
      if (!voiceModel || voiceModel.userId !== userId) {
        return {
          success: false,
          error: 'Voice model not found',
        };
      }

      // Validate analysis data completeness
      if (!this.isValidAnalysisData(voiceModel.analysisData)) {
        return {
          success: false,
          error: 'Voice model analysis data is incomplete. Please refresh the voice model.',
        };
      }

      // Generate single variation
      const result = await this.generateSingleVariation(
        originalIdea,
        voiceModel.analysisData as VoiceAnalysis,
        variationType
      );

      const generationTime = Date.now() - startTime;

      const variation: TweetVariation = {
        id: crypto.randomUUID(),
        content: result.content,
        variationType,
        characterCount: result.content.length,
        metadata: {
          generationTime,
          promptUsed: result.promptUsed,
          aiModel: 'gpt-4-turbo-preview',
        },
      };

      // Save to database
      const dbInsert: NewGeneratedTweet = {
        userId,
        voiceModelId,
        originalIdea,
        generatedContent: variation.content,
        variationType: variation.variationType,
        characterCount: variation.characterCount.toString(),
        metadata: variation.metadata,
      };

      await db.insert(generatedTweets).values(dbInsert);

      return {
        success: true,
        variation,
      };
    } catch (error) {
      console.error('Error regenerating tweet variation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const tweetGenerationService = new TweetGenerationService();

// Export types
export type { TweetVariation };
