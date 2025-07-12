import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { AITool } from '@/lib/types/aiTools';
import { env } from '@/config/env';

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
  private openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  private model = this.openai('gpt-4o');

  /**
   * Main generation method - creates viral, human-like content
   */
  async generateContent(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      // Debug: Check if API key is available
      if (!env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      console.log('🤖 Starting AI generation with tool:', tool);
      console.log('📝 Original content length:', originalContent.length);
      console.log('🔑 API key available:', !!env.OPENAI_API_KEY);
      
      const systemPrompt = this.buildSystemPrompt(tool);
      const userPrompt = this.buildUserPrompt(tool, originalContent, options);
      
      console.log('🎯 System prompt length:', systemPrompt.length);
      console.log('📋 User prompt length:', userPrompt.length);

      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.9,
        maxTokens: 400,
      });

      console.log('✅ AI generation successful');

      return {
        content: this.cleanAndFormatContent(result.text),
        suggestions: this.generateQuickSuggestions(tool)
      };
    } catch (error) {
      console.error('❌ AI Generation failed:', error);
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace'
      });
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
      const systemPrompt = `You are a viral content creator. Output ONLY the refined content, no explanations or conversational text.

Apply the user's request to the content. Common requests:
- "longer" = expand with more detail/examples
- "shorter" = condense while keeping impact  
- "funnier" = add appropriate humor
- "more personal" = add personal touch/experience
- "less formal" = make more casual
- "add story" = weave in narrative elements

Format like viral tweets:
- Natural line breaks between thoughts
- Use bullet points with dashes (–) when listing
- Authentic, conversational tone
- No AI-like phrases`;

      const userPrompt = `Current content: "${currentContent}"

User request: "${userMessage}"

Apply the request and output ONLY the refined content:`;
      
      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.8,
        maxTokens: 350,
      });

      return {
        content: this.cleanAndFormatContent(result.text),
        reasoning: `Applied: ${userMessage}`
      };
    } catch (error) {
      console.error('AI Refinement failed:', error);
      throw new Error('Failed to refine content. Please try again.');
    }
  }

  /**
   * Build system prompts that create viral, human-like content
   */
  private buildSystemPrompt(tool: AITool): string {
    const baseInstructions = `You are a viral content creator who writes like a successful human entrepreneur on Twitter.

CRITICAL RULES:
- Output ONLY the generated content, no explanations or conversational text
- Never start with phrases like "Here's", "I'll generate", "What do you think", etc.
- Write like a real human with genuine experiences and insights
- Use natural, authentic language patterns
- Create content that feels viral and engaging

FORMATTING RULES:
- Use natural line breaks between thoughts
- Use bullet points with dashes (–) when listing items
- Keep sentences punchy and scannable
- Make it mobile-friendly with good line breaks
- Use contractions and casual language

HUMAN-LIKE PATTERNS:
- Start sentences with "And" or "But" naturally
- Use authentic voice and personal touches
- Include minor imperfections that feel human
- Avoid AI phrases like "delve into", "furthermore", "moreover"
- Make it conversational but not verbose`;

    return baseInstructions + '\n\n' + this.getToolSpecificSystemPrompt(tool);
  }

  /**
   * Tool-specific system prompts
   */
  private getToolSpecificSystemPrompt(tool: AITool): string {
    switch (tool) {
      case AITool.ExpandTweet:
        return `EXPAND TWEET TASK:
Transform into a compelling 3-4 tweet thread. Format each tweet clearly with thread indicators.
Make each tweet valuable on its own while building the narrative.
Use authentic storytelling and personal insights.`;

      case AITool.CreateHook:
        return `CREATE HOOK TASK:
Generate an irresistible opening that stops scrolling.
Use curiosity, emotion, or bold statements.
Make it feel like authentic human insight.`;

      case AITool.AddEmojis:
        return `ADD EMOJIS TASK:
Strategically place emojis to enhance emotion and visual appeal.
Use them naturally like a real person would.
Don't overdo it - quality over quantity.`;

      case AITool.MakeShorter:
        return `MAKE SHORTER TASK:
Condense while keeping maximum impact.
Remove fluff but preserve personality and punch.
Make every word count.`;

      case AITool.MoreAssertive:
        return `MORE ASSERTIVE TASK:
Make the tone more confident and direct.
Use strong, decisive language.
Show conviction and authority.`;

      case AITool.MoreCasual:
        return `MORE CASUAL TASK:
Make it feel like texting a friend.
Use relaxed language and contractions.
Add warmth and approachability.`;

      case AITool.MoreFormal:
        return `MORE FORMAL TASK:
Elevate the language while keeping it human.
Use professional tone but stay relatable.
Sound expert but not stuffy.`;

      case AITool.CreateCTA:
        return `CREATE CTA TASK:
Add a natural call-to-action that doesn't feel pushy.
Make it feel like genuine curiosity about others' experiences.
Use authentic engagement patterns.`;

      case AITool.ImproveTweet:
        return `IMPROVE TWEET TASK:
Polish the content while keeping authentic voice.
Enhance clarity, impact, and engagement potential.
Make it more viral and shareable.`;

      case AITool.FixGrammar:
        return `FIX GRAMMAR TASK:
Correct grammar and spelling while preserving natural voice.
Keep the personality intact.
Make it polished but not robotic.`;

      case AITool.TweetIdeas:
        return `TWEET IDEAS TASK:
Generate 3-4 related tweet ideas that build on the concept.
Make each idea unique and valuable.
Format as separate tweet concepts.`;

      case AITool.CopywritingTips:
        return `COPYWRITING TIPS TASK:
Provide 3-4 actionable copywriting insights based on the content.
Make them practical and specific.
Format as clear, valuable tips.`;

      case AITool.KeepWriting:
        return `KEEP WRITING TASK:
Continue the thought naturally from where it left off.
Maintain the same voice and style.
Add valuable insights or examples.`;

      default:
        return `ENHANCE CONTENT TASK:
Improve the content while keeping it authentic and engaging.
Make it more viral and human-like.`;
    }
  }

  /**
   * Build user prompts with examples and context
   */
  private buildUserPrompt(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions
  ): string {
    const contextInfo = this.buildContextInfo(options);
    const examples = this.getToolExamples(tool);
    
    return `${contextInfo}

${examples}

Original content: "${originalContent}"

Generate the ${tool.replace('-', ' ')} version:`;
  }

  /**
   * Build context information
   */
  private buildContextInfo(options: GenerationOptions): string {
    let context = '';
    
    if (options.action) {
      context += `Quick action: ${options.action}\n`;
    }
    
    if (options.customPrompt) {
      context += `Custom instruction: ${options.customPrompt}\n`;
    }
    
    return context;
  }

  /**
   * Get tool-specific examples
   */
  private getToolExamples(tool: AITool): string {
    switch (tool) {
      case AITool.ExpandTweet:
        return `Example viral thread format:
1/ Main insight or hook

2/ Supporting detail or story
Break thoughts into digestible pieces

3/ Key takeaway or lesson
Make it actionable

4/ Strong conclusion or question
Drive engagement`;

      case AITool.CreateHook:
        return `Example viral hooks:
– "Almost $100k in 4 months"
– "Nobody talks about this..."
– "I made every mistake so you don't have to"
– "The thing they don't tell you about..."`;

      case AITool.MoreCasual:
        return `Example casual style:
– Use contractions (don't, won't, can't)
– Start with "And" or "But"
– Add personal touches
– Use everyday language`;

      case AITool.MakeShorter:
        return `Example shortened format:
Remove:
– Unnecessary words
– Redundant phrases
– Filler content
Keep:
– Core message
– Emotional impact
– Key insights`;

      default:
        return `Example viral tweet patterns:
– Use line breaks for emphasis
– Add bullet points with dashes (–)
– Keep it scannable
– Make it feel authentic`;
    }
  }

  /**
   * Clean and format the generated content
   */
  private cleanAndFormatContent(content: string): string {
    // Remove any conversational wrapper text
    let cleaned = content.trim();
    
    // Remove common AI conversation starters
    const conversationalPhrases = [
      /^here's\s+/i,
      /^i'll\s+generate\s+/i,
      /^what\s+do\s+you\s+think\s+/i,
      /^how\s+about\s+/i,
      /^let\s+me\s+/i,
      /^i\s+can\s+/i,
      /^here\s+is\s+/i,
      /^this\s+is\s+/i,
      /^\w+\s+version:\s*/i,
      /^generated\s+content:\s*/i,
      /^improved\s+version:\s*/i,
      /^expanded\s+version:\s*/i,
      /^shortened\s+version:\s*/i,
      /^more\s+\w+\s+version:\s*/i,
    ];
    
    conversationalPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Remove quotes if they wrap the entire content
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove trailing phrases
    const trailingPhrases = [
      /\s+what\s+do\s+you\s+think\?$/i,
      /\s+how\s+does\s+this\s+sound\?$/i,
      /\s+let\s+me\s+know\s+if\s+you'd\s+like\s+changes\.$/i,
    ];
    
    trailingPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Clean up spacing but preserve intentional line breaks
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\n\s+/g, '\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
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
