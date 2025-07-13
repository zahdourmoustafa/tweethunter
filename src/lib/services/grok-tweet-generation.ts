/**
 * Grok-Powered Tweet Generation Service
 * Uses Grok-4 for authentic Twitter content generation with proper formatting
 */

import { grokClient, GROK_MODEL, type GrokMessage } from '@/lib/grok';
import { grokVoiceAnalysisService, type GrokVoiceAnalysis } from './grok-voice-analysis';
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

export class GrokTweetGenerationService {
  /**
   * Generate 6 tweet variations using Grok-4's Twitter expertise
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
      const voiceModel = await grokVoiceAnalysisService.getVoiceModel(voiceModelId);
      if (!voiceModel || voiceModel.userId !== userId) {
        return {
          success: false,
          error: 'Voice model not found',
        };
      }

      // Validate analysis data
      if (!this.isValidGrokAnalysis(voiceModel.analysisData)) {
        return {
          success: false,
          error: 'Voice model analysis data is incomplete. Please refresh the voice model.',
        };
      }

      // Generate all 6 variations
      const variationTypes: VariationType[] = [
        'short-punchy',
        'medium-story', 
        'long-detailed',
        'thread-style',
        'casual-personal',
        'professional-insight'
      ];

      const generationPromises = variationTypes.map(type => 
        this.generateSingleVariation(originalIdea, voiceModel.analysisData as GrokVoiceAnalysis, type)
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
          generationTime: Math.round(totalTime / 6),
          promptUsed: result.promptUsed,
          aiModel: GROK_MODEL,
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
      console.error('Grok tweet generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a single tweet variation using Grok-4
   */
  private async generateSingleVariation(
    idea: string,
    analysis: GrokVoiceAnalysis,
    variationType: VariationType
  ): Promise<{ content: string; promptUsed: string }> {
    const prompt = this.buildGrokPrompt(idea, analysis, variationType);

    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `You are a tweet generation expert. Your sole purpose is to write tweets that are indistinguishable from a user's actual content. You will be given a detailed analysis of their voice, and you must adhere to it strictly. 

CRITICAL TWITTER FORMATTING REQUIREMENTS:
- Use authentic Twitter formatting with natural line breaks and proper spacing
- Follow this exact formatting pattern for multi-part tweets:

EXAMPLE FORMAT:
"Opening statement or hook – additional context or emphasis.
Here's the main point: 

• Bullet point with spacing
• Another bullet point with spacing  
• Third bullet point with spacing

Additional insight or tip: Specific details for better context.
Strong closing statement. Final call to action 🔥

↓ Engagement hook or question!"

KEY FORMATTING RULES:
- Single line break (\n) after opening statements
- Double line break (\n\n) before and after bullet point sections
- Single line break (\n) between individual bullet points
- Double line break (\n\n) before closing sections
- Use bullet points (•) with proper spacing when listing items
- Add emojis naturally where appropriate
- Include engagement hooks like "↓ Drop your thoughts below!" when suitable
- Maintain natural sentence flow with proper punctuation
- Each distinct thought or section should have breathing room

Remember: Twitter users naturally format their tweets with strategic line breaks and spacing to maximize readability and engagement. Replicate this authentic Twitter formatting style exactly.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      console.log('🚀 Sending request to Grok API...');
      console.log('Model:', GROK_MODEL);
      console.log('Messages length:', messages.length);
      console.log('Prompt preview:', prompt.substring(0, 200) + '...');

      const completion = await grokClient.chat.completions.create({
        model: GROK_MODEL,
        messages,
      });

      console.log('✅ Grok API response received');
      console.log('Choices length:', completion.choices?.length || 0);
      console.log('First choice:', completion.choices?.[0]);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ No content in Grok response:', {
          choices: completion.choices,
          usage: completion.usage,
          model: completion.model,
        });
        throw new Error('No content generated by Grok - API returned empty response');
      }

      console.log('✅ Content generated:', content.substring(0, 100) + '...');

      // Clean the content while preserving authentic formatting
      const cleanedContent = this.cleanGrokContent(content);

      return {
        content: cleanedContent,
        promptUsed: prompt,
      };
    } catch (error) {
      console.error('❌ Grok API Error Details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      
      // Re-throw with more context
      throw new Error(`Grok API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build Grok-specific prompt for authentic voice replication
   */
  /**
   * Build Grok-specific prompt for authentic voice replication
   */
  private buildGrokPrompt(idea: string, analysis: GrokVoiceAnalysis, variationType: VariationType): string {
    const variationInstructions = this.getVariationInstructions(variationType, analysis);

    return `You are a master tweet writer, tasked with crafting content that perfectly mirrors a specific individual's online voice.

**ANALYSIS OF THE USER'S VOICE:**

*   **Personality & Tone:**
    *   **Primary Tones:** ${analysis.writingPersonality.primaryTone.join(', ')}
    *   **Emotional Range:** ${analysis.writingPersonality.emotionalRange}
    *   **Humor Style:** ${analysis.writingPersonality.humorStyle}
    *   **Confidence Level:** ${analysis.writingPersonality.confidenceLevel}
    *   **Key Traits:** ${analysis.writingPersonality.personalityTraits.join(', ')}

*   **Tweet Structure & Formatting:**
    *   **Average Length:** ${analysis.tweetPatterns.averageLength} characters
    *   **Preferred Structure:** ${analysis.tweetPatterns.preferredStructure}
    *   **Line Breaks:** ${analysis.tweetPatterns.lineBreakStyle}
    *   **Paragraphs:** ${analysis.tweetPatterns.paragraphFlow}
    *   **Threads:** ${analysis.tweetPatterns.threadUsage}

*   **Language & Style:**
    *   **Vocabulary:** ${analysis.languageStyle.vocabularyLevel}
    *   **Sentence Complexity:** ${analysis.languageStyle.sentenceComplexity}
    *   **Punctuation:** ${analysis.languageStyle.punctuationHabits.join(', ')}
    *   **Emoji Usage:** ${analysis.languageStyle.emojiUsage}
    *   **Slang & Casualness:** ${analysis.languageStyle.slangAndCasualness}

*   **Signature Elements:**
    *   **Openings:** "${analysis.formatSignatures.openingPatterns.join('", "')}"
    *   **Closings:** "${analysis.formatSignatures.closingPatterns.join('", "')}"
    *   **Transitions:** "${analysis.formatSignatures.transitionPhrases.join('", "')}"
    *   **Unique Phrases:** "${analysis.formatSignatures.uniqueExpressions.join('", "')}"

*   **Content Themes:**
    *   **Main Topics:** ${analysis.contentThemes.mainTopics.join(', ')}
    *   **Areas of Expertise:** ${analysis.contentThemes.expertiseAreas.join(', ')}
    *   **Personal Sharing:** ${analysis.contentThemes.personalSharing}

**YOUR TASK:**

1.  **Internalize the Voice:** Read the analysis carefully. Understand the user's unique style.
2.  **Adhere to the Format:** Replicate their use of line breaks, spacing, and punctuation.
3.  **Generate the Tweet:** Based on the original idea below, write a tweet that is indistinguishable from the user's own content.

**VARIATION INSTRUCTIONS:**

${variationInstructions}

**ORIGINAL IDEA:**

"${idea}"
`;
  }

  /**
   * Get variation-specific instructions
   */
  private getVariationInstructions(variationType: VariationType, analysis: GrokVoiceAnalysis): string {
    const avgLength = analysis.tweetPatterns.averageLength;

    switch (variationType) {
      case 'short-punchy':
        return `*   **Focus:** Create a brief, high-impact tweet (around ${Math.round(avgLength * 0.4)} characters).
*   **Action:** Use their most powerful opening patterns. Keep the core message, but make it concise.`;

      case 'medium-story':
        return `*   **Focus:** Frame the idea as a short story or personal experience (around ${Math.round(avgLength * 0.9)} characters).
*   **Action:** Use their storytelling approach (${analysis.engagementStyle.storytellingApproach}). Weave in personal elements that match their sharing style (${analysis.contentThemes.personalSharing}).`;

      case 'long-detailed':
        return `*   **Focus:** Provide a comprehensive, detailed take on the idea (around ${Math.round(avgLength * 1.4)} characters).
*   **Action:** Use their style for detailed explanations. Structure the tweet with their typical paragraph flow (${analysis.tweetPatterns.paragraphFlow}).`;

      case 'thread-style':
        return `*   **Focus:** Write the tweet as the beginning of a thread (around ${Math.round(avgLength * 1.6)} characters).
*   **Action:** Use their thread-opening patterns. Set up the topic for continuation, but ensure the first tweet is a complete thought.`;

      case 'casual-personal':
        return `*   **Focus:** Adopt their most casual and personal tone.
*   **Action:** Use their casual expressions and slang (${analysis.languageStyle.slangAndCasualness}). The tweet should feel like a natural, off-the-cuff thought.`;

      case 'professional-insight':
        return `*   **Focus:** Write from their professional or expert perspective.
*   **Action:** Focus on their areas of expertise (${analysis.contentThemes.expertiseAreas.join(', ')}). Use industry-specific language that matches their vocabulary level (${analysis.languageStyle.vocabularyLevel}).`;

      default:
        return '*   **Focus:** Generate a tweet that authentically matches their voice and style.';
    }
  }

  /**
   * Clean Grok-generated content while preserving authentic formatting
   */
  private cleanGrokContent(content: string): string {
    let cleaned = content.trim();
    
    // Remove any AI conversation starters
    const aiPhrases = [
      /^here's\s+/i,
      /^i'll\s+generate\s+/i,
      /^let\s+me\s+/i,
      /^here\s+is\s+/i,
      /^tweet:\s*/i,
      /^generated\s+tweet:\s*/i,
    ];
    
    aiPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Remove quotes if they wrap entire content
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Clean up excessive spacing but preserve intentional line breaks
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single
    cleaned = cleaned.replace(/\n\s+/g, '\n'); // Remove leading spaces on new lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
    
    return cleaned.trim();
  }

  /**
   * Validate Grok analysis data
   */
  private isValidGrokAnalysis(data: any): data is GrokVoiceAnalysis {
    return (
      data &&
      data.writingPersonality &&
      data.tweetPatterns &&
      data.languageStyle &&
      data.formatSignatures &&
      Array.isArray(data.writingPersonality.primaryTone) &&
      typeof data.tweetPatterns.averageLength === 'number'
    );
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
      const voiceModel = await grokVoiceAnalysisService.getVoiceModel(voiceModelId);
      if (!voiceModel || voiceModel.userId !== userId) {
        return {
          success: false,
          error: 'Voice model not found',
        };
      }

      // Validate analysis data
      if (!this.isValidGrokAnalysis(voiceModel.analysisData)) {
        return {
          success: false,
          error: 'Voice model analysis data is incomplete.',
        };
      }

      // Generate single variation
      const result = await this.generateSingleVariation(
        originalIdea,
        voiceModel.analysisData as GrokVoiceAnalysis,
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
          aiModel: GROK_MODEL,
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
export const grokTweetGenerationService = new GrokTweetGenerationService();

// Export types
export type { TweetVariation };
