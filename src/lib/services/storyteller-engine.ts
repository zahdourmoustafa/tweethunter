import { AITool } from '@/lib/types/aiTools';
import { VOICE_GENERATOR_PROMPTS } from '@/lib/prompts/voice-generator';
import { AI_TOOL_PROMPTS } from '@/lib/prompts/ai-tools';
import { ContentFormatter } from './content-formatter';
import { ViralFramework } from './viral-framework';
import { openai } from '@/lib/ai/config';
import { generateText } from 'ai';

interface StorytellerOptions {
  category?: string;
  contentType?: string;
  tone?: string;
  topic?: string;
  idea?: string;
}

export class StorytellerEngine {
  /**
   * Main content generation method
   */
  async generateContent(
    tool: AITool,
    originalContent: string,
    options: StorytellerOptions = {}
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(tool, originalContent, options);
      
      const result = await generateText({
        model: openai('gpt-4o'),
        system: prompt.system,
        prompt: prompt.user,
        temperature: 0.7,
        maxTokens: tool === AITool.VoiceGenerator ? 2000 : 1000,
      });

      let content = result.text;
      content = ContentFormatter.cleanContent(content);
      content = ContentFormatter.formatForTwitter(content);

      return content;
    } catch (error) {
      console.error('Storyteller engine error:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Build appropriate prompt for each tool
   */
  private buildPrompt(tool: AITool, content: string, options: StorytellerOptions) {
    const basePrompt = VOICE_GENERATOR_PROMPTS.system;
    
    switch (tool) {
      case AITool.VoiceGenerator:
        return {
          system: basePrompt,
          user: `Generate content about: ${content} using ${options.category || 'any'} format`
        };

      case AITool.ExpandTweet:
        return {
          system: AI_TOOL_PROMPTS[AITool.ExpandTweet].system,
          user: `Expand this tweet: ${content}`
        };

      case AITool.CreateHook:
        return {
          system: AI_TOOL_PROMPTS[AITool.CreateHook].system,
          user: `Create hooks for: ${content}`
        };

      default:
        return {
          system: AI_TOOL_PROMPTS[tool]?.system || basePrompt,
          user: content
        };
    }
  }

  /**
   * Validate generated content
   */
  validateContent(content: string): boolean {
    return content.length > 0 && content.length <= 2000;
  }
}