import { generateText } from 'ai';
import { openai } from '@/lib/ai/config';
import { grokClient, GROK_MODEL } from '@/lib/grok';
import { AITool, ContentType } from '@/lib/types/aiTools';
import { AI_TOOL_PROMPTS } from '@/lib/prompts/ai-tools';
import { VOICE_GENERATOR_PROMPTS } from '@/lib/prompts/voice-generator';

interface GenerationOptions {
  action?: string;
  customPrompt?: string;
  userStyle?: any;
  context?: {
    originalAuthor?: string;
    engagement?: any;
    topic?: string;
  };
  voiceGeneratorOptions?: {
    contentType: ContentType;
    voiceModelData?: {
      twitterUsername: string;
      analysisData?: any;
    };
  };
}

interface GenerationResult {
  content: string;
  reasoning?: string;
  suggestions?: string[];
}

class AIContentGenerator {
  private gptModel = openai('gpt-4o');
  private grokModel = GROK_MODEL;

  /**
   * Main generation method using modular prompts
   */
  async generateContent(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      console.log('🤖 Starting AI generation with tool:', tool);
      
      const systemPrompt = this.getSystemPrompt(tool, options);
      const userPrompt = this.getUserPrompt(tool, originalContent, options);
      
      console.log('🎯 System prompt length:', systemPrompt.length);
      console.log('📋 User prompt length:', userPrompt.length);

      const result = await generateText({
        model: this.gptModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.75,
        maxTokens: tool === AITool.VoiceGenerator ? 2000 : 1000,
      });

      let generatedText = result.text;
      console.log('✅ AI generation completed');
      console.log('📝 Generated content length:', generatedText.length);

      const cleanedContent = this.cleanAndFormatContent(generatedText);

      return {
        content: cleanedContent,
        reasoning: `Generated ${tool} content using modular prompts`,
        suggestions: []
      };
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  /**
   * Handle conversational refinements
   */
  async refineContent(
    currentContent: string,
    userMessage: string,
    conversationHistory: any[] = []
  ): Promise<GenerationResult> {
    try {
      const systemPrompt = `${AI_TOOL_PROMPTS[AITool.ImproveTweet]?.system || ''}

REFINEMENT MISSION:
You're refining content while keeping the EXACT same format.
Apply: ${userMessage} while maintaining storytelling format.`;

      const userPrompt = `Current content: "${currentContent}"

User wants: "${userMessage}"

Transform this while keeping the format. Output ONLY the refined content:`;

      const result = await generateText({
        model: this.gptModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.75,
        maxTokens: 600,
      });

      const cleanedContent = this.cleanAndFormatContent(result.text);

      return {
        content: cleanedContent,
        reasoning: `Applied: ${userMessage} while maintaining format`
      };
    } catch (error) {
      console.error('AI Refinement failed:', error);
      throw new Error('Failed to refine content. Please try again.');
    }
  }

  /**
   * Get system prompt from modular prompt files
   */
  private getSystemPrompt(tool: AITool, options: GenerationOptions): string {
    if (tool === AITool.VoiceGenerator) {
      return VOICE_GENERATOR_PROMPTS.system;
    }

    const prompt = AI_TOOL_PROMPTS[tool as keyof typeof AI_TOOL_PROMPTS];
    return prompt?.system || VOICE_GENERATOR_PROMPTS.system;
  }

  /**
   * Build user prompt with context
   */
  private getUserPrompt(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions
  ): string {
    if (tool === AITool.VoiceGenerator && options.voiceGeneratorOptions) {
      const { contentType, voiceModelData } = options.voiceGeneratorOptions;
      
      return `IDENTITY: You are @${voiceModelData?.twitterUsername || 'unknown'} and you have PERSONALLY EXPERIENCED everything about "${originalContent}".

VOICE ANALYSIS DATA:
${voiceModelData ? JSON.stringify(voiceModelData.analysisData || {}, null, 2) : 'Voice analysis data not available'}

CONTENT TYPE: ${contentType}

Write authentically from personal experience using current 2025 context.`;
    }

    const basePrompt = `Original content: "${originalContent}"

Transform this following the system instructions. Return ONLY the improved content.`;

    if (options.customPrompt) {
      return `${basePrompt}\n\nAdditional instructions: ${options.customPrompt}`;
    }

    return basePrompt;
  }

  /**
   * Clean and format content
   */
  private cleanAndFormatContent(content: string): string {
    let cleaned = content.trim();
    
    // Remove AI conversation starters
    const conversationalPhrases = [
      /^here's\s+/i,
      /^i'll\s+generate\s+/i,
      /^here\s+is\s+/i,
      /^this\s+is\s+/i,
      /^generated\s+content:\s*/i,
      /^improved\s+version:\s*/i,
    ];
    
    conversationalPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });

    // Convert numbered lists to bullet points
    cleaned = cleaned.replace(/^\d+\.\s/gm, '• ');
    cleaned = cleaned.replace(/\n\d+\.\s/g, '\n• ');

    // Clean up spacing
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s+/g, '\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }
}

export const aiContentGenerator = new AIContentGenerator();
export type { GenerationOptions, GenerationResult };