import { openai } from '@/lib/ai/config';
import { generateText } from 'ai';
import type { PostCategory, ContentType, ToneType } from '@/components/create-post/create-post-context';

interface GenerateContentParams {
  category: PostCategory;
  contentType: ContentType;
  idea: string;
  tone: ToneType;
  topic: string;
}

export async function generateTopicIdeas(topic: string, category: PostCategory): Promise<string[]> {
  try {
    const prompt = `Generate 5-8 unique and engaging content ideas for a ${category.replace('-', ' ')} post about "${topic}".

Requirements:
- Each idea should be specific and actionable
- Focus on providing value to the audience
- Make ideas engaging and shareable
- Use natural, conversational language
- Avoid generic or vague concepts

Return only the ideas as a numbered list, one per line.`;

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.8,
      maxTokens: 500,
    });

    const ideas = result.text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    return ideas.slice(0, 8);
  } catch (error) {
    console.error('Error generating topic ideas:', error);
    throw new Error('Failed to generate topic ideas');
  }
}

export async function generateContent(params: GenerateContentParams): Promise<string> {
  try {
    const { category, contentType, idea, tone, topic } = params;

    const toneInstructions = {
      standard: 'Use a professional, authoritative tone. Be confident and informative.',
      descriptive: 'Use detailed, explanatory language. Paint a clear picture with words.',
      casual: 'Use a conversational, friendly tone. Write like you\'re talking to a friend.',
      narrative: 'Tell a compelling story. Use storytelling techniques and emotional language.',
      humorous: 'Use light-hearted, entertaining language. Include appropriate humor and wit.',
    };

    const categoryInstructions = {
      'case-study-client': 'Focus on client success stories, specific results, and transformation journeys.',
      'case-study-professional': 'Highlight personal achievements, career milestones, and professional growth.',
      'personal-story': 'Share authentic personal experiences, lessons learned, and genuine insights.',
      'list-tips': 'Provide actionable, practical advice in a clear, scannable format.',
      'industry-insight': 'Offer thought leadership, analysis, and forward-thinking perspectives.',
      'product-service': 'Create engaging promotional content that provides value while highlighting benefits.',
      'behind-scenes': 'Give transparent insights into processes, workflows, and the human side of work.',
      'question-engagement': 'Craft questions that spark discussion and encourage community engagement.',
    };

    const contentTypeInstructions = {
      thread: 'Create a Twitter thread with 8-15 tweets. Each tweet should be engaging and flow naturally to the next.',
      tweet: 'Create a single, impactful tweet under 280 characters.',
      'long-tweet': 'Create an extended tweet that uses line breaks effectively for readability.',
      'short-tweet': 'Create a concise, punchy tweet that gets straight to the point.',
    };

    const prompt = `Create ${contentTypeInstructions[contentType]}

Topic: ${topic}
Specific idea: ${idea}
Category: ${category.replace('-', ' ')}
Tone: ${toneInstructions[tone]}

Category focus: ${categoryInstructions[category]}

Requirements:
- Use proper Twitter formatting with line breaks for readability
- Make content engaging and shareable
- Include specific examples or insights
- Use natural, conversational language
- Ensure high engagement potential
- Format appropriately for the content type

Generate the complete content:`;

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.7,
      maxTokens: contentType === 'thread' ? 2000 : 500,
    });

    return result.text.trim();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content');
  }
}