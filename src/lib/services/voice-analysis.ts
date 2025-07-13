/**
 * Voice Analysis Service
 * Analyzes Twitter accounts to extract voice patterns using OpenAI
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { twitterApiService, type Tweet } from './twitter-api-io';
import { voiceCacheService } from './voice-cache';
import { db } from '@/lib/db';
import { voiceModels, type NewVoiceModel } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Voice analysis schema for structured output
const VoiceAnalysisSchema = z.object({
  tweetStructure: z.object({
    averageLength: z.number(),
    usesThreads: z.boolean(),
    threadFrequency: z.number(),
  }),
  writingStyle: z.object({
    tone: z.array(z.string()),
    formalityLevel: z.number().min(1).max(10),
    humorLevel: z.number().min(1).max(10),
    vulnerabilityLevel: z.number().min(1).max(10),
  }),
  contentPatterns: z.object({
    openingHooks: z.array(z.string()),
    commonPhrases: z.array(z.string()),
    ctaStyles: z.array(z.string()),
    storytellingPatterns: z.array(z.string()),
  }),
  engagementTactics: z.object({
    usesQuestions: z.boolean(),
    questionFrequency: z.number(),
    usesControversialTakes: z.boolean(),
    usesPersonalAnecdotes: z.boolean(),
  }),
  formatting: z.object({
    usesEmojis: z.boolean(),
    emojiFrequency: z.number(),
    usesBulletPoints: z.boolean(),
    usesNumberedLists: z.boolean(),
    punctuationStyle: z.array(z.string()),
  }),
  vocabulary: z.object({
    commonWords: z.array(z.string()),
    industryTerms: z.array(z.string()),
    uniquePhrases: z.array(z.string()),
    averageWordsPerSentence: z.number(),
  }),
});

type VoiceAnalysis = z.infer<typeof VoiceAnalysisSchema>;

export class VoiceAnalysisService {
  /**
   * Analyze a Twitter account and create/update voice model with enhanced validation
   */
  async analyzeAccount(userId: string, twitterUsername: string): Promise<{
    success: boolean;
    voiceModelId?: string;
    error?: string;
    warnings?: string[];
  }> {
    const warnings: string[] = [];

    try {
      // Test API connection first
      const connectionTest = await twitterApiService.testConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          error: `Twitter API connection failed: ${connectionTest.error}. Please check your TWITTERAPI_IO_API_KEY environment variable.`,
        };
      }

      // Clean username
      const cleanUsername = twitterUsername.replace('@', '').toLowerCase();

      // Enhanced account validation
      const validation = await this.validateAccountComprehensive(cleanUsername);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      if (validation.warnings) {
        warnings.push(...validation.warnings);
      }

      // Fetch tweets for analysis with retry logic
      const tweets = await this.fetchTweetsWithRetry(cleanUsername, 200);
      if (tweets.length < 10) {
        return {
          success: false,
          error: `Not enough tweets found for analysis (found ${tweets.length}, minimum 10 required)`,
        };
      }

      if (tweets.length < 50) {
        warnings.push(`Limited tweet data available (${tweets.length} tweets). Analysis quality may be reduced.`);
      }

      // Perform AI analysis with validation
      const analysis = await this.performAIAnalysisWithValidation(tweets);
      
      // Validate analysis quality
      const qualityCheck = voiceCacheService.validateAnalysisQuality(analysis);
      if (!qualityCheck.isValid) {
        warnings.push(`Analysis quality is below threshold (${qualityCheck.score}%): ${qualityCheck.issues.join(', ')}`);
      }

      // Calculate confidence score based on multiple factors
      const confidenceScore = this.calculateEnhancedConfidenceScore(tweets.length, analysis, qualityCheck.score);

      // Check if voice model already exists for this user and username
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
            analysisData: analysis,
            confidenceScore: confidenceScore.toString(),
            tweetCount: tweets.length.toString(),
            lastAnalyzedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(voiceModels.id, voiceModelId));

        // Update cache
        const updatedModel = await this.getVoiceModel(voiceModelId);
        if (updatedModel) {
          voiceCacheService.set(updatedModel);
        }
      } else {
        // Create new model
        const newModel: NewVoiceModel = {
          userId,
          twitterUsername: cleanUsername,
          displayName: validation.user?.name || cleanUsername,
          analysisData: analysis,
          confidenceScore: confidenceScore.toString(),
          tweetCount: tweets.length.toString(),
          lastAnalyzedAt: new Date(),
        };

        const [createdModel] = await db
          .insert(voiceModels)
          .values(newModel)
          .returning({ id: voiceModels.id });

        voiceModelId = createdModel.id;

        // Cache the new model
        const newVoiceModel = await this.getVoiceModel(voiceModelId);
        if (newVoiceModel) {
          voiceCacheService.set(newVoiceModel);
        }
      }

      return {
        success: true,
        voiceModelId,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error analyzing account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  /**
   * Comprehensive account validation with detailed checks
   */
  private async validateAccountComprehensive(username: string): Promise<{
    isValid: boolean;
    error?: string;
    warnings?: string[];
    user?: any;
  }> {
    const warnings: string[] = [];

    try {
      // Basic validation
      const validation = await twitterApiService.validateAccount(username);
      if (!validation.exists || !validation.isPublic) {
        return {
          isValid: false,
          error: 'Twitter account not found, is private, or is suspended',
        };
      }

      const user = validation.user;
      if (!user) {
        return {
          isValid: false,
          error: 'Unable to retrieve account information',
        };
      }

      // Check account quality indicators
      // Note: These checks are commented out because the current TwitterUser interface
      // doesn't include followers_count and tweet_count properties
      // if (user.followers_count < 100) {
      //   warnings.push('Account has very few followers, which may affect analysis quality');
      // }

      // if (user.tweet_count < 50) {
      //   warnings.push('Account has very few tweets, which may affect analysis quality');
      // }

      // Check if account is too new (less than 30 days old)
      // Note: This would require account creation date from API
      
      // Check if account is verified (can indicate quality)
      // Note: Commented out due to TypeScript strict checking
      // if (user.verified) {
      //   // Verified accounts often have higher quality content
      // }

      return {
        isValid: true,
        user,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Account validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Fetch tweets with retry logic and error handling
   */
  private async fetchTweetsWithRetry(username: string, count: number, maxRetries: number = 3): Promise<Tweet[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tweets = await twitterApiService.fetchUserTweets(username, count);
        return tweets;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Failed to fetch tweets after retries');
  }

  /**
   * Perform AI analysis with validation and error handling
   */
  private async performAIAnalysisWithValidation(tweets: Tweet[]): Promise<VoiceAnalysis> {
    try {
      const analysis = await this.performAIAnalysis(tweets);
      
      // Validate the analysis structure
      if (!analysis.tweetStructure || !analysis.writingStyle || !analysis.contentPatterns) {
        throw new Error('AI analysis returned incomplete data structure');
      }

      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Fallback to basic analysis if AI fails
      return this.createFallbackAnalysis(tweets);
    }
  }

  /**
   * Create fallback analysis when AI analysis fails
   */
  private createFallbackAnalysis(tweets: Tweet[]): VoiceAnalysis {
    const basicPatterns = twitterApiService.analyzeTweetPatterns(tweets);
    
    return {
      tweetStructure: {
        averageLength: basicPatterns.averageLength,
        usesThreads: basicPatterns.usesThreads,
        threadFrequency: basicPatterns.threadFrequency,
      },
      writingStyle: {
        tone: ['neutral'],
        formalityLevel: 5,
        humorLevel: 5,
        vulnerabilityLevel: 5,
      },
      contentPatterns: {
        openingHooks: ['Hey', 'So', 'Just'],
        commonPhrases: ['I think', 'you know', 'really'],
        ctaStyles: ['What do you think?', 'Let me know'],
        storytellingPatterns: ['personal experience'],
      },
      engagementTactics: {
        usesQuestions: basicPatterns.commonPatterns.includes('frequently_asks_questions'),
        questionFrequency: 20,
        usesControversialTakes: false,
        usesPersonalAnecdotes: true,
      },
      formatting: {
        usesEmojis: basicPatterns.commonPatterns.includes('uses_emojis_frequently'),
        emojiFrequency: 30,
        usesBulletPoints: basicPatterns.commonPatterns.includes('uses_lists_or_bullets'),
        usesNumberedLists: false,
        punctuationStyle: ['.', '!'],
      },
      vocabulary: {
        commonWords: ['really', 'think', 'know', 'great', 'good'],
        industryTerms: [],
        uniquePhrases: [],
        averageWordsPerSentence: 12,
      },
    };
  }

  /**
   * Calculate enhanced confidence score with multiple factors
   */
  private calculateEnhancedConfidenceScore(
    tweetCount: number, 
    analysis: VoiceAnalysis, 
    qualityScore: number
  ): number {
    let score = 0;

    // Base score from tweet count (30% weight)
    if (tweetCount >= 200) score += 30;
    else if (tweetCount >= 100) score += 25;
    else if (tweetCount >= 50) score += 20;
    else if (tweetCount >= 20) score += 15;
    else score += 10;

    // Quality score from AI analysis (40% weight)
    score += (qualityScore / 100) * 40;

    // Pattern richness (20% weight)
    let patternScore = 0;
    if (analysis.contentPatterns.openingHooks.length > 3) patternScore += 5;
    if (analysis.contentPatterns.commonPhrases.length > 5) patternScore += 5;
    if (analysis.vocabulary.uniquePhrases.length > 2) patternScore += 5;
    if (analysis.writingStyle.tone.length > 1) patternScore += 5;
    score += patternScore;

    // Consistency indicators (10% weight)
    if (analysis.engagementTactics.usesQuestions && analysis.engagementTactics.questionFrequency > 20) score += 5;
    if (analysis.formatting.usesEmojis && analysis.formatting.emojiFrequency > 30) score += 3;
    if (analysis.tweetStructure.usesThreads && analysis.tweetStructure.threadFrequency > 10) score += 2;

    return Math.min(Math.max(score, 0), 100); // Ensure score is between 0-100
  }

  /**
   * Perform AI analysis of tweets using OpenAI with advanced prompts
   */
  private async performAIAnalysis(tweets: Tweet[]): Promise<VoiceAnalysis> {
    // Step 1: Curate top tweets by engagement
    const sortedTweets = tweets
      .sort((a, b) => {
        const engagementA = a.public_metrics.like_count + a.public_metrics.retweet_count;
        const engagementB = b.public_metrics.like_count + b.public_metrics.retweet_count;
        return engagementB - engagementA;
      })
      .slice(0, 75); // Use top 75 tweets for a more in-depth analysis

    const tweetTexts = sortedTweets.map(tweet => tweet.text);
    
    console.log(`Performing deep AI analysis on ${tweetTexts.length} curated tweets.`);

    // Step 2: Create a more demanding, PRD-aligned prompt that includes formatting rules
    const analysisPrompt = `
You are a world-class social media analyst and expert in dissecting writing styles on Twitter. Your task is to perform a deep and comprehensive analysis of the following high-engagement tweets to create a detailed "voice profile." Be meticulous and thorough.

**CRITICAL FORMATTING RULES FOR TWEET GENERATION:**
*   **Line Breaks:** Use natural line breaks to create rhythm and visual appeal. Separate distinct thoughts.
*   **Bullet Points:** Use bullet points (•) for lists, never numbers.
*   **Dashes:** Use dashes (–) to emphasize contrasts, insights, or key takeaways.
*   **Spacing:** Use strategic blank lines to create pauses and improve readability. Avoid walls of text.
*   **Hook:** Start with a strong, attention-grabbing hook.
*   **Human Tone:** Write like a human, not a corporate AI.

**TWEETS FOR DEEP ANALYSIS:**
${tweetTexts.map((text, i) => `${i + 1}. ${text}`).join('\n\n')}

---

**DETAILED ANALYSIS REQUIREMENTS (Based on PRD):**

1.  **Tweet Structure & Cadence:**
    *   Analyze the typical tweet length in characters.
    *   Determine if the author prefers single, impactful tweets or multi-tweet threads.
    *   Estimate the frequency of threads (e.g., "Uses threads for ~20% of deep-dive topics").

2.  **Personality & Writing Style:**
    *   **Tone Profile:** Identify the primary tones (e.g., "Authoritative," "Witty," "Inspirational," "Vulnerable"). Provide examples.
    *   **Formality Score (1-10):** How formal is the language? (1=Very Casual, 10=Academic).
    *   **Humor Score (1-10):** How often is humor used? (1=Never, 10=Constantly).
    *   **Vulnerability Score (1-10):** How much personal experience or emotion is shared? (1=Guarded, 10=Very Open).

3.  **Content & Storytelling Patterns:**
    *   **Opening Hooks:** What specific techniques are used to start tweets and grab attention? (e.g., "Asks a provocative question," "States a surprising fact"). List 3-5 common patterns.
    *   **Common Phrases & Vocabulary:** List signature words or phrases that define their style.
    *   **Call-to-Action (CTA) Styles:** How do they encourage replies or clicks? (e.g., "Asks for opinions," "Directly promotes a link").
    *   **Storytelling Archetypes:** What narrative structures do they use? (e.g., "Problem -> Agitate -> Solution," "Personal failure -> Lesson learned").

4.  **Engagement & Formatting:**
    *   **Engagement Tactics:** Do they use questions, polls, or controversial takes to drive interaction?
    *   **Formatting Habits:** Analyze their use of emojis (and which ones), bullet points, numbered lists, and line breaks for emphasis.
    *   **Punctuation Style:** Do they favor short, punchy sentences, or more complex ones? Note any distinct punctuation habits (e.g., heavy use of ellipses, all-caps for emphasis).

Provide your final analysis as a structured JSON object. Be extremely detailed in your findings.
`;

    // Step 3: Generate the analysis with higher temperature for more creative insight
    const result = await generateObject({
      model: openai('gpt-4-turbo-preview'),
      schema: VoiceAnalysisSchema,
      prompt: analysisPrompt,
      temperature: 0.4, // Slightly higher temperature for more nuanced interpretation
    });

    console.log("Deep AI analysis complete.");
    return result.object;
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidenceScore(tweetCount: number, analysis: VoiceAnalysis): number {
    let score = 0;

    // Base score from tweet count
    if (tweetCount >= 100) score += 40;
    else if (tweetCount >= 50) score += 30;
    else if (tweetCount >= 20) score += 20;
    else score += 10;

    // Score from analysis depth
    if (analysis.contentPatterns.openingHooks.length > 0) score += 10;
    if (analysis.contentPatterns.commonPhrases.length > 0) score += 10;
    if (analysis.vocabulary.uniquePhrases.length > 0) score += 10;
    if (analysis.writingStyle.tone.length > 0) score += 10;

    // Score from pattern consistency
    if (analysis.engagementTactics.usesQuestions && analysis.engagementTactics.questionFrequency > 20) score += 10;
    if (analysis.formatting.usesEmojis && analysis.formatting.emojiFrequency > 30) score += 5;
    if (analysis.tweetStructure.usesThreads && analysis.tweetStructure.threadFrequency > 10) score += 5;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get voice model by ID with caching
   */
  async getVoiceModel(voiceModelId: string) {
    // Try cache first
    const cachedModel = voiceCacheService.get(voiceModelId);
    if (cachedModel) {
      return cachedModel;
    }

    // Fetch from database
    const [model] = await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.id, voiceModelId))
      .limit(1);

    if (model) {
      // Cache the model
      voiceCacheService.set(model);
    }

    return model || null;
  }

  /**
   * Get all voice models for a user with caching
   */
  async getUserVoiceModels(userId: string) {
    const models = await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.userId, userId))
      .orderBy(voiceModels.createdAt);

    // Cache all models
    models.forEach(model => voiceCacheService.set(model));

    return models;
  }

  /**
   * Delete voice model with cache cleanup
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

      // Clear from cache
      voiceCacheService.delete(voiceModelId);

      return true;
    } catch (error) {
      console.error('Error deleting voice model:', error);
      return false;
    }
  }

  /**
   * Refresh voice model analysis
   */
  async refreshVoiceModel(userId: string, voiceModelId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const model = await this.getVoiceModel(voiceModelId);
      if (!model || model.userId !== userId) {
        return {
          success: false,
          error: 'Voice model not found',
        };
      }

      // Re-analyze the account
      return await this.analyzeAccount(userId, model.twitterUsername);
    } catch (error) {
      console.error('Error refreshing voice model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const voiceAnalysisService = new VoiceAnalysisService();

// Export types
export type { VoiceAnalysis };
