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
  private model = openai('gpt-4o');

  /**
   * Main generation method - creates viral, human-like content
   */
  async generateContent(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      console.log('🤖 Starting AI generation with tool:', tool);
      
      const systemPrompt = this.buildSystemPrompt(tool);
      const userPrompt = this.buildUserPrompt(tool, originalContent, options);
      
      console.log('🎯 System prompt length:', systemPrompt.length);
      console.log('📋 User prompt length:', userPrompt.length);

      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      });

      console.log('✅ AI generation completed');
      console.log('📝 Generated content length:', result.text.length);
      console.log('🔍 Raw AI response:', result.text);

      return {
        content: result.text.trim(),
        reasoning: `Generated ${tool} content with human-like Twitter formatting`,
        suggestions: []
      };
    } catch (error) {
      console.error('❌ AI generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tool,
        originalContentLength: originalContent.length,
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
- Use bullet points (•) and dashes (–) when listing
- Authentic, conversational tone
- No AI-like phrases

ABSOLUTELY FORBIDDEN - NEVER INCLUDE:
• "RT + comment" or "RT and comment" requests
• "Drop a comment" or "Comment below"
• "DM me" or "slide into DMs"
• "Must follow to get"
• "Like and retweet"
• "Tag a friend"
• Growth hacker tactics
• Promotional calls-to-action
• Social media engagement bait
• "What do you think?" endings

Focus on delivering value and insights, not gaining followers.`;

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
   * Build system prompt for each tool - focused on natural Twitter formatting
   */
  private buildSystemPrompt(tool: AITool): string {
    const basePrompt = `You are a viral Twitter content creator. Generate ONLY the content, no explanations, no conversational text, no "here's your..." or "what do you think" - just pure content that looks like it was written by a human for Twitter.

CRITICAL FORMATTING RULES:
• Use bullet points (•) for lists, never numbers (1., 2., 3.)
• Use dashes (–) for comparisons and contrasts
• Use natural line breaks and spacing like real tweets
• Keep sentences punchy and conversational
• Use emojis strategically, not excessively
• Make it sound like a real person wrote it
• NO thread numbering (1/, 2/, 3/ etc.)
• NO conversational wrapper text

ABSOLUTELY FORBIDDEN - NEVER INCLUDE:
• "RT + comment" or "RT and comment" requests
• "Drop a comment" or "Comment below"
• "DM me" or "slide into DMs"
• "Must follow to get"
• "Like and retweet"
• "Tag a friend"
• Growth hacker tactics
• Promotional calls-to-action
• Social media engagement bait
• "What do you think?" endings

CONTENT STYLE:
• Write like you're texting a friend who's also an expert
• Use confident, assertive language
• Include specific details and numbers when possible
• Use "you" to make it personal
• Keep paragraphs short (1-3 sentences max)
• Use strategic spacing for readability
• End with valuable insights, not promotional asks
• Focus on delivering value, not gaining followers`;

    const toolSpecificPrompts = {
      [AITool.ExpandTweet]: `${basePrompt}

EXPAND TWEET TASK:
Transform the tweet into a longer, more detailed version that could be a single long tweet or thread. Use natural Twitter formatting with bullet points, dashes, and proper spacing. Make it viral and engaging while maintaining authenticity.

FORMAT EXAMPLE:
"Original insight statement

Here's what's really happening:

• First key point
• Second insight
• Third revelation

This changes everything.

What this means for you:

– Strategy 1
– Strategy 2  
– Strategy 3

The bottom line:
Final powerful statement."`,

      [AITool.CreateHook]: `${basePrompt}

CREATE HOOK TASK:
Generate a scroll-stopping opening line that makes people want to read more. Use proven viral patterns but make it feel natural and authentic.

FORMAT EXAMPLES:
"$42K in 4 months from one simple realization:"
"Everyone thinks AI is expensive. They're wrong."
"I've spent $50K on courses. Here's what actually works:"`,

      [AITool.MoreCasual]: `${basePrompt}

MORE CASUAL TASK:
Make the content feel like you're texting a friend. Use casual language, contractions, and relaxed tone while keeping the value intact.

CASUAL PATTERNS:
• "Look, here's the thing..."
• "Honestly, this is wild..."
• "I've been thinking about this..."
• Use "you're" instead of "you are"
• Use "can't" instead of "cannot"`,

      [AITool.MoreAssertive]: `${basePrompt}

MORE ASSERTIVE TASK:
Make the content more confident and authoritative. Use strong, decisive language that positions you as an expert.

ASSERTIVE PATTERNS:
• "Here's what most people get wrong:"
• "This is exactly how..."
• "Stop doing X. Start doing Y."
• "The truth is..."
• Use definitive statements, not suggestions`,

      [AITool.AddEmojis]: `${basePrompt}

ADD EMOJIS TASK:
Add strategic emojis that enhance the message without making it look childish. Use 1-3 emojis max per section.

EMOJI STRATEGY:
• 📈 for growth/metrics
• 🎯 for goals/targets
• 💡 for insights
• 🔥 for trending/hot content
• ✅ for completed actions
• 🚀 for launches/momentum`,

      [AITool.MakeShorter]: `${basePrompt}

MAKE SHORTER TASK:
Condense the content while keeping the core message and impact. Remove fluff but maintain the engaging tone.

SHORTENING RULES:
• Keep the most impactful points
• Combine related ideas
• Remove redundant words
• Maintain the hook and conclusion`,

      [AITool.FixGrammar]: `${basePrompt}

FIX GRAMMAR TASK:
Correct grammar, spelling, and punctuation while maintaining the casual, authentic tone. Don't make it too formal.

GRAMMAR RULES:
• Fix obvious errors
• Keep contractions for casual tone
• Ensure proper punctuation
• Maintain original voice and style`,

      [AITool.MoreFormal]: `${basePrompt}

MORE FORMAL TASK:
Make the content more professional while keeping it engaging. Use complete sentences and proper grammar.

FORMAL PATTERNS:
• "Research shows..."
• "According to data..."
• "The key insight is..."
• "This demonstrates..."
• Use complete sentences, avoid slang`,

      [AITool.CopywritingTips]: `${basePrompt}

COPYWRITING TIPS TASK:
Improve the persuasive elements using proven copywriting principles. Focus on benefits, social proof, and clear value propositions.

COPYWRITING PRINCIPLES:
• Lead with benefits, not features
• Use social proof (numbers, testimonials)
• Create urgency when appropriate
• Address objections
• End with clear value statement`,

             [AITool.KeepWriting]: `${basePrompt}

KEEP WRITING TASK:
Continue the content naturally, expanding on the existing ideas with more value, examples, or insights.

CONTINUATION RULES:
• Build on existing themes
• Add new valuable insights
• Maintain consistent tone
• Provide concrete examples
• End with strong conclusion`,

       [AITool.CreateCTA]: `${basePrompt}

CREATE CTA TASK:
Add a natural ending that encourages engagement WITHOUT promotional tactics. Focus on genuine connection and value delivery.

NATURAL ENDING PATTERNS:
• "Anyone else experiencing this?"
• "This changes everything for [audience]"
• "The reality is more nuanced than this"
• "Worth considering next time you [relevant action]"
• "Makes you think differently about [topic]"
• Keep it conversational and authentic
• NO requests for likes, retweets, or follows
• NO "drop a comment" or "DM me" requests`,

       [AITool.ImproveTweet]: `${basePrompt}

IMPROVE TWEET TASK:
Polish the content while keeping authentic voice. Enhance clarity, impact, and engagement potential.

IMPROVEMENT FOCUS:
• Strengthen weak points
• Add more emotional impact
• Improve readability
• Make it more shareable
• Maintain human authenticity`,

       [AITool.TweetIdeas]: `${basePrompt}

TWEET IDEAS TASK:
Generate 3-4 related tweet ideas that build on the concept. Make each idea unique and valuable.

IDEAS FORMAT:
• Idea 1: [Brief compelling tweet]
• Idea 2: [Different angle on same topic]
• Idea 3: [Contrarian or surprising take]
• Idea 4: [Actionable insight]

Keep each idea concise but complete.`
     };

     return toolSpecificPrompts[tool] || basePrompt;
  }

  /**
   * Build user prompt with original content and context
   */
  private buildUserPrompt(
    tool: AITool,
    originalContent: string,
    options: GenerationOptions
  ): string {
    const basePrompt = `Original content:
"${originalContent}"

Generate the improved version following the system instructions. Return ONLY the content, no explanations or wrapper text.`;

    // Add context-specific instructions
    if (options.context?.topic) {
      return `${basePrompt}

Topic context: ${options.context.topic}`;
    }

    if (options.customPrompt) {
      return `${basePrompt}

Additional instructions: ${options.customPrompt}`;
    }

    return basePrompt;
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
    
    // Remove promotional/engagement bait content
    const promotionalPhrases = [
      /RT\s*\+\s*comment.*$/gmi,
      /like\s*\+\s*retweet.*$/gmi,
      /drop\s+a\s+comment.*$/gmi,
      /comment\s+below.*$/gmi,
      /dm\s+me.*$/gmi,
      /slide\s+into.*dm.*$/gmi,
      /must\s+follow\s+to\s+get.*$/gmi,
      /follow\s+for\s+more.*$/gmi,
      /tag\s+a\s+friend.*$/gmi,
      /share\s+if\s+you\s+agree.*$/gmi,
      /what\s+do\s+you\s+think\?.*$/gmi,
      /\(must\s+follow.*\)$/gmi,
      /want\s+the\s+full\s+playbook\?.*$/gmi,
      /interested\s+in\s+learning\s+more\?.*$/gmi,
    ];
    
    promotionalPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Remove trailing phrases
    const trailingPhrases = [
      /\s+what\s+do\s+you\s+think\?$/i,
      /\s+how\s+does\s+this\s+sound\?$/i,
      /\s+let\s+me\s+know\s+if\s+you'd\s+like\s+changes\.$/i,
      /\s+drop\s+your\s+thoughts\s+below\.$/i,
      /\s+share\s+your\s+experience\.$/i,
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

export const storytellerAgent = new StorytellerAgent();
export type { GenerationOptions, GenerationResult };
