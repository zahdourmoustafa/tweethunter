/**
 * Grok-Powered Voice Analysis Service
 * Uses Grok-4 for superior Twitter voice analysis and understanding
 */

import { grokClient, GROK_MODEL, type GrokMessage } from '@/lib/grok';
import { twitterApiService, type Tweet } from './twitter-api-io';
import { voiceCacheService } from './voice-cache';
import { db } from '@/lib/db';
import { voiceModels, type NewVoiceModel } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Enhanced voice analysis schema for Grok
interface GrokVoiceAnalysis {
  writingPersonality: {
    primaryTone: string[];
    emotionalRange: string;
    humorStyle: string;
    confidenceLevel: string;
    personalityTraits: string[];
  };
  tweetPatterns: {
    averageLength: number;
    preferredStructure: string;
    lineBreakStyle: string;
    paragraphFlow: string;
    threadUsage: string;
  };
  languageStyle: {
    vocabularyLevel: string;
    sentenceComplexity: string;
    punctuationHabits: string[];
    emojiUsage: string;
    slangAndCasualness: string;
  };
  contentThemes: {
    mainTopics: string[];
    expertiseAreas: string[];
    personalSharing: string;
    controversialTakes: string;
  };
  engagementStyle: {
    questionUsage: string;
    callToActions: string;
    communityInteraction: string;
    storytellingApproach: string;
  };
  formatSignatures: {
    openingPatterns: string[];
    closingPatterns: string[];
    transitionPhrases: string[];
    uniqueExpressions: string[];
  };
}

export class GrokVoiceAnalysisService {
  /**
   * Analyze Twitter account using Grok-4's native Twitter understanding
   */
  async analyzeAccount(userId: string, twitterUsername: string): Promise<{
    success: boolean;
    voiceModelId?: string;
    error?: string;
    warnings?: string[];
  }> {
    const warnings: string[] = [];

    try {
      // Clean username
      const cleanUsername = twitterUsername.replace('@', '').toLowerCase();

      // Validate account
      const validation = await twitterApiService.validateAccount(cleanUsername);
      if (!validation.exists || !validation.isPublic) {
        return {
          success: false,
          error: 'Twitter account not found, is private, or is suspended',
        };
      }

      // Fetch tweets for analysis
      const tweets = await twitterApiService.fetchUserTweets(cleanUsername, 100);
      if (tweets.length < 10) {
        return {
          success: false,
          error: `Not enough tweets found for analysis (found ${tweets.length}, minimum 10 required)`,
        };
      }

      if (tweets.length < 30) {
        warnings.push(`Limited tweet data (${tweets.length} tweets). Analysis quality may be reduced.`);
      }

      // Perform Grok-powered analysis
      const analysis = await this.performGrokAnalysis(tweets);
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(tweets.length, analysis);

      // Check if voice model exists
      const existingModel = await db
        .select()
        .from(voiceModels)
        .where(
          and(
            eq(voiceModels.userId, userId),
            eq(voiceModels.twitterUsername, cleanUsername)
          )
        )
        .limit(1);

      let voiceModelId: string;

      if (existingModel.length > 0) {
        // Update existing model
        voiceModelId = existingModel[0].id;
        await db
          .update(voiceModels)
          .set({
            displayName: validation.user?.name || cleanUsername,
            analysisData: analysis as any,
            confidenceScore: confidenceScore.toString(),
            tweetCount: tweets.length.toString(),
            lastAnalyzedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(voiceModels.id, voiceModelId));
      } else {
        // Create new model
        const newModel: NewVoiceModel = {
          userId,
          twitterUsername: cleanUsername,
          displayName: validation.user?.name || cleanUsername,
          analysisData: analysis as any,
          confidenceScore: confidenceScore.toString(),
          tweetCount: tweets.length.toString(),
          lastAnalyzedAt: new Date(),
        };

        const [createdModel] = await db
          .insert(voiceModels)
          .values(newModel)
          .returning({ id: voiceModels.id });

        voiceModelId = createdModel.id;
      }

      // Add warning if fallback was used
      if (analysis.writingPersonality.primaryTone.includes('conversational') && 
          analysis.formatSignatures.uniqueExpressions.includes('authentic voice')) {
        warnings.push('Used fallback analysis due to API issues. Voice model quality may be reduced.');
      }

      return {
        success: true,
        voiceModelId,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Grok voice analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  /**
   * Perform deep voice analysis using Grok-4's Twitter expertise
   */
  private async performGrokAnalysis(tweets: Tweet[]): Promise<GrokVoiceAnalysis> {
    // Get top tweets by engagement for better analysis
    const topTweets = tweets
      .sort((a, b) => {
        const engagementA = a.public_metrics.like_count + a.public_metrics.retweet_count;
        const engagementB = b.public_metrics.like_count + b.public_metrics.retweet_count;
        return engagementB - engagementA;
      })
      .slice(0, 50);

    const tweetTexts = topTweets.map(tweet => tweet.text);

    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `You are Grok, X's AI with deep understanding of Twitter culture and writing patterns. Analyze this Twitter account's voice with expert precision.

Your task: Perform a comprehensive voice analysis that captures the EXACT way this person tweets - their personality, formatting, language patterns, and unique style signatures.

Focus on:
1. How they structure tweets (line breaks, spacing, flow)
2. Their authentic personality and tone
3. Language patterns and vocabulary choices
4. Content themes and expertise areas
5. Unique expressions and signature phrases
6. Engagement and storytelling style

Be extremely detailed and accurate - this analysis will be used to replicate their voice perfectly.`
      },
      {
        role: 'user',
        content: `Analyze these ${tweetTexts.length} tweets from a Twitter account. Provide a comprehensive voice analysis in JSON format.

TWEETS TO ANALYZE:
${tweetTexts.map((text, i) => `${i + 1}. ${text}`).join('\n\n')}

Return a detailed JSON analysis with these exact fields:
{
  "writingPersonality": {
    "primaryTone": ["tone1", "tone2"],
    "emotionalRange": "description",
    "humorStyle": "description", 
    "confidenceLevel": "description",
    "personalityTraits": ["trait1", "trait2"]
  },
  "tweetPatterns": {
    "averageLength": number,
    "preferredStructure": "description",
    "lineBreakStyle": "description",
    "paragraphFlow": "description", 
    "threadUsage": "description"
  },
  "languageStyle": {
    "vocabularyLevel": "description",
    "sentenceComplexity": "description",
    "punctuationHabits": ["habit1", "habit2"],
    "emojiUsage": "description",
    "slangAndCasualness": "description"
  },
  "contentThemes": {
    "mainTopics": ["topic1", "topic2"],
    "expertiseAreas": ["area1", "area2"],
    "personalSharing": "description",
    "controversialTakes": "description"
  },
  "engagementStyle": {
    "questionUsage": "description",
    "callToActions": "description", 
    "communityInteraction": "description",
    "storytellingApproach": "description"
  },
  "formatSignatures": {
    "openingPatterns": ["pattern1", "pattern2"],
    "closingPatterns": ["pattern1", "pattern2"],
    "transitionPhrases": ["phrase1", "phrase2"],
    "uniqueExpressions": ["expr1", "expr2"]
  }
}`
      }
    ];

    try {
      console.log('🔍 Starting Grok voice analysis...');
      console.log('Analyzing', tweetTexts.length, 'tweets');
      console.log('Sample tweet:', tweetTexts[0]?.substring(0, 100) + '...');

      // Add API key validation
      if (!process.env.GROK_API_KEY) {
        throw new Error('GROK_API_KEY is not configured');
      }

      console.log('✅ Grok API key configured, making request...');

      const completion = await grokClient.chat.completions.create({
        model: GROK_MODEL,
        messages,
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 2000,
      });

      console.log('✅ Grok analysis response received');
      console.log('Response choices:', completion.choices?.length || 0);

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        console.error('❌ No response from Grok analysis:', {
          choices: completion.choices,
          usage: completion.usage,
        });
        throw new Error('No response from Grok analysis');
      }

      console.log('✅ Analysis response length:', response.length);
      console.log('Response preview:', response.substring(0, 200) + '...');

      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ No JSON found in Grok response:', response);
          throw new Error('No JSON found in Grok response');
        }

        console.log('✅ JSON extracted, parsing...');
        const analysis = JSON.parse(jsonMatch[0]) as GrokVoiceAnalysis;
        
        console.log('✅ Voice analysis completed successfully');
        console.log('Analysis summary:', {
          primaryTone: analysis.writingPersonality?.primaryTone,
          averageLength: analysis.tweetPatterns?.averageLength,
          mainTopics: analysis.contentThemes?.mainTopics,
        });

        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse Grok analysis JSON:', {
          error: parseError,
          response: response.substring(0, 500),
        });
        throw new Error('Failed to parse voice analysis from Grok');
      }
    } catch (error) {
      console.error('❌ Grok voice analysis error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        // Add more debugging info
        apiKeyExists: !!process.env.GROK_API_KEY,
        apiKeyLength: process.env.GROK_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      });
      
      // Create a fallback analysis if Grok fails
      console.log('🔄 Creating fallback voice analysis...');
      return this.createFallbackAnalysis(tweets);
    }
  }

  /**
   * Calculate confidence score based on analysis quality
   */
  private calculateConfidenceScore(tweetCount: number, analysis: GrokVoiceAnalysis): number {
    let score = 0;

    // Base score from tweet count (40%)
    if (tweetCount >= 100) score += 40;
    else if (tweetCount >= 50) score += 35;
    else if (tweetCount >= 30) score += 30;
    else if (tweetCount >= 20) score += 25;
    else score += 20;

    // Analysis depth score (30%)
    if (analysis.formatSignatures.uniqueExpressions.length > 3) score += 10;
    if (analysis.contentThemes.mainTopics.length > 2) score += 10;
    if (analysis.writingPersonality.personalityTraits.length > 2) score += 10;

    // Pattern richness (20%)
    if (analysis.formatSignatures.openingPatterns.length > 2) score += 7;
    if (analysis.formatSignatures.closingPatterns.length > 1) score += 7;
    if (analysis.languageStyle.punctuationHabits.length > 1) score += 6;

    // Consistency indicators (10%)
    if (analysis.tweetPatterns.averageLength > 0) score += 5;
    if (analysis.engagementStyle.storytellingApproach.length > 10) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Create a fallback analysis when Grok API fails
   */
  private createFallbackAnalysis(tweets: Tweet[]): GrokVoiceAnalysis {
    console.log('Creating fallback analysis for', tweets.length, 'tweets');
    
    // Basic analysis based on tweet patterns
    const tweetTexts = tweets.map(t => t.text);
    const avgLength = tweetTexts.reduce((sum, text) => sum + text.length, 0) / tweetTexts.length;
    
    // Extract common patterns
    const hasEmojis = tweetTexts.some(text => /\p{Emoji}/u.test(text));
    const hasQuestions = tweetTexts.some(text => text.includes('?'));
    const hasExclamations = tweetTexts.some(text => text.includes('!'));
    
    return {
      writingPersonality: {
        primaryTone: ['conversational', 'engaging'],
        emotionalRange: 'moderate',
        humorStyle: 'casual',
        confidenceLevel: 'confident',
        personalityTraits: ['authentic', 'relatable'],
      },
      tweetPatterns: {
        averageLength: Math.round(avgLength),
        preferredStructure: 'natural flow',
        lineBreakStyle: 'as needed',
        paragraphFlow: 'conversational',
        threadUsage: 'occasional',
      },
      languageStyle: {
        vocabularyLevel: 'accessible',
        sentenceComplexity: 'moderate',
        punctuationHabits: hasExclamations ? ['exclamation marks'] : ['standard'],
        emojiUsage: hasEmojis ? 'moderate' : 'minimal',
        slangAndCasualness: 'casual',
      },
      contentThemes: {
        mainTopics: ['general', 'personal'],
        expertiseAreas: ['general knowledge'],
        personalSharing: 'moderate',
        controversialTakes: 'balanced',
      },
      engagementStyle: {
        questionUsage: hasQuestions ? 'frequent' : 'occasional',
        callToActions: 'moderate',
        communityInteraction: 'engaged',
        storytellingApproach: 'conversational',
      },
      formatSignatures: {
        openingPatterns: ['direct start'],
        closingPatterns: ['natural end'],
        transitionPhrases: ['and', 'but', 'so'],
        uniqueExpressions: ['authentic voice'],
      },
    };
  }

  /**
   * Get voice model by ID
   */
  async getVoiceModel(voiceModelId: string) {
    const cachedModel = voiceCacheService.get(voiceModelId);
    if (cachedModel) {
      return cachedModel;
    }

    const [model] = await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.id, voiceModelId))
      .limit(1);

    if (model) {
      voiceCacheService.set(model);
    }

    return model || null;
  }

  /**
   * Get all voice models for a user
   */
  async getUserVoiceModels(userId: string) {
    const models = await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.userId, userId))
      .orderBy(voiceModels.createdAt);

    models.forEach(model => voiceCacheService.set(model));
    return models;
  }

  /**
   * Delete voice model
   */
  async deleteVoiceModel(userId: string, voiceModelId: string): Promise<boolean> {
    try {
      await db
        .delete(voiceModels)
        .where(
          and(
            eq(voiceModels.id, voiceModelId),
            eq(voiceModels.userId, userId)
          )
        );

      voiceCacheService.delete(voiceModelId);
      return true;
    } catch (error) {
      console.error('Error deleting voice model:', error);
      return false;
    }
  }
}

// Export singleton instance
export const grokVoiceAnalysisService = new GrokVoiceAnalysisService();

// Export types
export type { GrokVoiceAnalysis };
