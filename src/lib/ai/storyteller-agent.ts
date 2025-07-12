import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { AITool } from '@/lib/types/aiTools';

interface GenerationOptions {
  action?: string;
  customPrompt?: string;
  userStyle?: any;
  context?: {
    originalAuthor?: string;
    engagement?: any;
    topic?: string;
  };
}

interface GenerationResult {
  content: string;
  reasoning?: string;
  suggestions?: string[];
}

class StorytellerAgent {
  private model = openai('gpt-4o-mini');

  /**
   * Main generation method - the heart of our AI storyteller
   */
  async generateContent(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      const prompt = this.buildHumanLikePrompt(tool, originalContent, options);
      
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.8,
        maxTokens: 500,
      });

      return {
        content: this.postProcessContent(result.text),
        suggestions: this.generateQuickSuggestions(tool)
      };
    } catch (error) {
      console.error('AI Generation failed:', error);
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
      const prompt = this.buildConversationalPrompt(currentContent, userMessage, conversationHistory);
      
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 400,
      });

      return {
        content: this.postProcessContent(result.text),
        reasoning: `Applied: ${userMessage}`
      };
    } catch (error) {
      console.error('AI Refinement failed:', error);
      throw new Error('Failed to refine content. Please try again.');
    }
  }

  /**
   * Build human-like prompts that generate authentic content
   */
  private buildHumanLikePrompt(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions
  ): string {
    const basePersonality = `You are Alex, a master storyteller and copywriter who writes like a real human - not an AI. Your writing feels authentic, conversational, and engaging.

CRITICAL RULES:
- Write like a real person with genuine thoughts and experiences
- Use natural language patterns, including minor imperfections that make content feel human
- Avoid AI-like phrases: "delve into", "in conclusion", "furthermore", "moreover"
- Include personality quirks, casual language, and authentic voice
- Make content feel like it came from someone's genuine experience
- Use contractions, informal language, and natural flow
- Add subtle imperfections that humans naturally include

TWEET FORMATTING RULES:
- Use natural line breaks between thoughts/sentences
- Each line should be a complete thought or sentence
- Break up long sentences into shorter, punchier lines
- Use line breaks for emphasis and readability
- Make it scannable and easy to read on mobile
- Format like real tweets with natural pauses`;

    const toolSpecificPrompt = this.getToolPrompt(tool, originalContent);
    const contextPrompt = this.buildContextPrompt(options);
    const antiDetectionPrompt = this.getAntiDetectionPrompt();

    return `${basePersonality}

${toolSpecificPrompt}

${contextPrompt}

${antiDetectionPrompt}

Original content: "${originalContent}"

Generate content with proper tweet formatting (use line breaks between thoughts):`;
  }

  /**
   * Tool-specific prompts for different AI tools
   */
  private getToolPrompt(tool: AITool, originalContent: string): string {
    switch (tool) {
      case AITool.ExpandTweet:
        return `Transform this tweet into a compelling thread. Think like someone who just had a breakthrough moment and wants to share their story.

THREAD FORMATTING:
- Create 3-5 separate tweets (use "🧵" or numbers to indicate thread)
- Each tweet should be 1-3 sentences max
- Use line breaks within tweets for readability
- Make each tweet valuable on its own
- End with a compelling conclusion or question`;

      case AITool.CreateHook:
        return `Create an irresistible opening that makes people stop scrolling. Think like a master storyteller who knows how to grab attention in the first few words.`;

      case AITool.AddEmojis:
        return `Add emojis strategically to amplify emotion and visual appeal. Think like someone who naturally uses emojis in their conversations.`;

      case AITool.MakeShorter:
        return `Condense this while keeping the punch and personality. Think like someone editing their own tweet to fit the character limit.`;

      case AITool.MoreAssertive:
        return `Make this more confident and direct. Think like someone who's found their voice and isn't afraid to speak their truth.`;

      case AITool.MoreCasual:
        return `Make this feel like a conversation with a friend. Think like someone texting their buddy about something interesting.`;

      case AITool.MoreFormal:
        return `Elevate the language while keeping it human. Think like someone who's speaking at a professional event but still wants to connect personally.`;

      case AITool.CreateCTA:
        return `Add a natural call-to-action that doesn't feel pushy. Think like someone genuinely excited to hear others' thoughts or experiences.`;

      case AITool.ImproveTweet:
        return `Polish this content while keeping its authentic voice. Think like a skilled editor who enhances without changing the personality.`;

      case AITool.FixGrammar:
        return `Fix any grammar or spelling issues while preserving the natural voice. Think like a careful proofreader who corrects mistakes but keeps the personality intact.`;

      case AITool.TweetIdeas:
        return `Generate related ideas that build on this concept. Think like a creative brainstormer who sees connections and possibilities.`;

      case AITool.CopywritingTips:
        return `Analyze what makes this content work and suggest improvements. Think like a copywriting mentor who understands both the craft and the psychology.`;

      case AITool.KeepWriting:
        return `Continue this thought naturally. Think like the original author who had more to say but ran out of space.`;

      default:
        return `Enhance this content while keeping it authentic and human. Think like someone refining their own words to better express their thoughts.`;
    }
  }

  /**
   * Build conversational prompt for chat refinements
   */
  private buildConversationalPrompt(
    currentContent: string,
    userMessage: string,
    conversationHistory: any[]
  ): string {
    const historyContext = conversationHistory.length > 0 
      ? `Previous conversation:\n${conversationHistory.map(h => `User: ${h.user}\nAlex: ${h.assistant}`).join('\n')}\n\n`
      : '';

    return `You are Alex, continuing a conversation about improving this content. You understand natural language requests and respond like a helpful writing partner.

${historyContext}Current content: "${currentContent}"

User request: "${userMessage}"

Understand what the user wants and apply it naturally. Common requests:
- "longer" = expand with more detail/examples
- "shorter" = condense while keeping impact  
- "funnier" = add appropriate humor
- "more personal" = add personal touch/experience
- "less formal" = make more casual
- "add story" = weave in narrative elements

Apply the user's request while maintaining authentic, human-like writing with proper tweet formatting:`;
  }

  /**
   * Context building for better generation
   */
  private buildContextPrompt(options: GenerationOptions): string {
    let context = '';
    
    if (options.context?.originalAuthor) {
      context += `Original author style: ${options.context.originalAuthor}\n`;
    }
    
    if (options.context?.topic) {
      context += `Topic context: ${options.context.topic}\n`;
    }
    
    if (options.action) {
      context += `Quick action requested: ${options.action}\n`;
    }
    
    if (options.customPrompt) {
      context += `Custom instruction: ${options.customPrompt}\n`;
    }

    return context;
  }

  /**
   * Anti-AI-detection techniques
   */
  private getAntiDetectionPrompt(): string {
    return `HUMAN-LIKE WRITING TECHNIQUES:
- Use natural speech patterns and rhythm
- Include subtle imperfections (like starting sentences with "And" or "But")
- Vary sentence length naturally
- Use contractions and informal language
- Add personal touches and authentic voice
- Avoid overly perfect grammar or structure
- Include natural pauses and flow
- Use everyday language over fancy words
- Make it feel conversational, not written`;
  }

  /**
   * Post-process content to ensure human-like quality and proper tweet formatting
   */
  private postProcessContent(content: string): string {
    // Remove common AI phrases
    const aiPhrases = [
      /\bdelve into\b/gi,
      /\bin conclusion\b/gi,
      /\bfurthermore\b/gi,
      /\bmoreover\b/gi,
      /\bit's important to note\b/gi,
      /\bit's worth noting\b/gi,
    ];

    let processed = content;
    aiPhrases.forEach(phrase => {
      processed = processed.replace(phrase, '');
    });

    // Clean up extra spaces but preserve intentional line breaks
    processed = processed.replace(/[ \t]+/g, ' ');
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    processed = processed.trim();

    // Ensure proper tweet formatting
    processed = processed.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
    processed = processed.replace(/(\d+\/)/g, '\n$1');
    
    return processed;
  }

  /**
   * Generate contextual quick suggestions
   */
  private generateQuickSuggestions(tool: AITool): string[] {
    const suggestions: Record<AITool, string[]> = {
      [AITool.ExpandTweet]: ['Make it longer', 'Add more examples', 'Include a story'],
      [AITool.CreateHook]: ['More curiosity', 'Add emotion', 'Make it bolder'],
      [AITool.MoreCasual]: ['Even more casual', 'Add humor', 'Make it friendlier'],
      [AITool.MoreAssertive]: ['Stronger tone', 'More confident', 'Add conviction'],
      [AITool.CopywritingTips]: ['More tips', 'Add examples', 'Make it actionable'],
      [AITool.KeepWriting]: ['Continue further', 'Add more detail', 'Expand the idea'],
      [AITool.AddEmojis]: ['More emojis', 'Different emojis', 'Less emojis'],
      [AITool.MakeShorter]: ['Even shorter', 'More concise', 'Keep essentials only'],
      [AITool.CreateCTA]: ['Stronger CTA', 'Different action', 'More urgent'],
      [AITool.ImproveTweet]: ['More polish', 'Better flow', 'Stronger impact'],
      [AITool.MoreFormal]: ['More professional', 'Academic tone', 'Business style'],
      [AITool.FixGrammar]: ['Double check', 'Style improvements', 'Clarity fixes'],
      [AITool.TweetIdeas]: ['More ideas', 'Different angles', 'Related topics']
    };

    return suggestions[tool] || ['Make it longer', 'Make it shorter', 'Add emotion'];
  }
}

// Export singleton instance
export const storytellerAgent = new StorytellerAgent();
export type { GenerationOptions, GenerationResult };
