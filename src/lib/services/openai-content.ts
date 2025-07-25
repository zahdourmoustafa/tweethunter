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
    const prompt = `Generate 10 highly viral, human-like hooks for a ${category.replace('-', ' ')} post about "${topic}".

    Each hook must be a complete, attention-grabbing opening sentence. No titles, no descriptions – just the hook itself.
    
    **Focus on these elements to maximize virality and human authenticity:**
    
    **1. Psychological Triggers & Emotional Resonance:**
       - **Curiosity Gap:** Create an irresistible information gap. Hint at a secret, a surprising truth, or an unexpected outcome without revealing it. (e.g., "The one thing I learned about ${topic} that changed everything...")
       - **Emotional Arousal:** Tap into strong emotions like awe, frustration, relief, surprise, fear, or inspiration. Make the reader *feel* something immediately. (e.g., "I almost quit ${topic} until this happened...")
       - **Relatability:** Address a common pain point, struggle, or aspiration directly. Make the reader think, "That's me!" (e.g., "If you're struggling with ${topic}, you're not alone. Here's why...")
       - **Contrarian/Unexpected:** Challenge conventional wisdom or present a surprising counter-narrative. (e.g., "Everyone tells you to do X for ${topic}, but they're wrong. Here's what actually works...")
       - **Urgency/Scarcity:** Imply a time-sensitive insight or a hidden opportunity. (e.g., "Don't even *think* about ${topic} until you read this.")
    
    **2. Human-Like Authenticity & Specificity (Undetectable by AI):**
       - **Personal Anecdote/Experience:** Frame the hook as a genuine insight from a lived experience. Use "I" statements. (e.g., "After 3 years of failing at ${topic}, I finally cracked the code...")
       - **Concrete Details:** Include specific numbers, timeframes, tools, or vivid scenarios to build credibility and make it feel real. Avoid vague language. (e.g., "My ${topic} strategy went from 0 to 100k views in a week because of one tiny tweak...")
       - **Conversational Tone:** Write as if you're texting a friend. Use natural language, varied sentence lengths, and occasional colloquialisms. Avoid overly formal or robotic phrasing.
       - **Pattern Interrupts:** Start with something unexpected or a bold claim to immediately stop the scroll.
    
    **3. Diverse Hook Patterns (Beyond just cost/time):**
       - **Problem-Solution:** "The biggest problem with ${topic} isn't X, it's Y. Here's how to fix it."
       - **Before-After Transformation:** "I used to think X about ${topic}, now I realize Y."
       - **Myth-Busting:** "The biggest lie about ${topic} is X."
       - **Question-Based:** "What if everything you learned about ${topic} was wrong?"
       - **Warning/Mistake:** "Avoid this critical mistake when dealing with ${topic}."
    
    Return exactly 10 unique, compelling hooks as a numbered list, one per line. Ensure no emojis, no hashtags, and no sales language. Each hook should stand alone as a powerful opening sentence.`
    
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

    return ideas.slice(0, 10);
  } catch (error) {
    console.error('Error generating topic ideas:', error);
    throw new Error('Failed to generate topic ideas');
  }
}

export async function generateContent(params: GenerateContentParams): Promise<string> {
  try {
    const { category, contentType, idea, tone, topic } = params;

    const toneInstructions = {
      standard: 'Maintain a clear, direct, and informative tone. Focus on conveying information efficiently and professionally, suitable for broad appeal without being overly formal.',
      descriptive: 'Employ rich, evocative language to paint vivid mental images. Focus on sensory details and atmospheric descriptions to immerse the reader in the topic or experience.',
      casual: 'Adopt a relaxed, conversational, and approachable tone. Write as if speaking to a close friend, using common idioms and a friendly, informal style. This tone should feel effortlessly human and relatable.',
      narrative: 'Craft a compelling story with a clear beginning, middle, and end. Utilize storytelling techniques such as character development (even if it\'s just \'you\' as the protagonist), plot progression, conflict, and resolution. Emphasize emotional arcs and personal transformation.',
      humorous: 'Inject wit, irony, and light-heartedness. Use clever wordplay, relatable observations, and unexpected twists to entertain the reader. The humor should feel natural and enhance the message, not detract from it.',
      inspirational: 'Uplift and motivate the reader. Use encouraging language, share empowering insights, and focus on positive outcomes and growth. Aim to leave the reader feeling hopeful and capable.',
      contrarian: 'Challenge conventional wisdom and popular beliefs. Adopt a bold, provocative, and thought-provoking stance. Aim to spark debate and offer a fresh, often unexpected, perspective.',
      vulnerable: 'Share personal struggles, failures, and raw emotions with honesty and authenticity. Focus on the lessons learned from difficult experiences. This tone builds deep connection through shared humanity and imperfection.',
    };
    const categoryInstructions = {
      'any': 'Choose the most natural and engaging approach based on the topic and idea. Let the content flow organically without forcing a specific format.',
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
  thread: 'Generate a comprehensive Twitter thread (8-15 tweets) that tells a complete story or provides in-depth information. Each tweet should be concise yet engaging, with a clear hook, logical progression, and a strong call to action or concluding thought. Ensure smooth transitions between tweets and optimal readability on mobile.',
  tweet: 'Craft a single, highly impactful tweet (under 280 characters) designed for maximum engagement. Focus on a strong hook, a clear message, and a compelling reason for interaction (e.g., a question, a surprising fact, or a bold statement).',
  'long-tweet': 'Develop an extended tweet that leverages Twitter\s character limits and line breaks for enhanced readability and impact. Structure the content with natural pauses, short paragraphs, and visual separation to guide the reader through a more detailed message without overwhelming them.',
  'short-tweet': 'Create a concise, punchy, and memorable tweet (under 140 characters). Focus on delivering a single, powerful idea or question with immediate impact. Ideal for quick insights, announcements, or direct engagement prompts.',
  'image-caption': 'Write a compelling caption for an accompanying image or visual. The caption should complement the visual, add context or a narrative, and encourage engagement. Keep it concise but impactful, drawing attention to the visual.',
  'poll-question': 'Formulate a clear, engaging question for a Twitter poll, along with compelling options (if applicable). The question should be thought-provoking and relevant to the audience, encouraging participation and revealing interesting insights.',
};


    const prompt = `You are a seasoned creator, a genuine human with lived experience, not an AI. Your task is to craft a single, highly engaging tweet (or short thread if necessary for depth) about "${idea}" related to "${topic}". This tweet must feel 100% authentic, raw, and written by a senior content creator or copywriter, undetectable by AI. Focus on emotional resonance, surprising insights, and actionable takeaways.

    **Core Principles for Human-Like Virality:**
    1.  **Authentic Voice:** Write as if you're texting a close friend who's grappling with the same challenge. Use natural language, occasional colloquialisms, and a conversational flow. Avoid overly formal or perfectly structured sentences. Let your personality shine through.
    2.  **Emotional Arc:** Tap into high-arousal emotions (awe, frustration, relief, curiosity, inspiration). Show vulnerability, share genuine struggles, and celebrate hard-won breakthroughs. Make the reader *feel* something.
    3.  **Unexpected Insights:** Challenge common assumptions. Reveal a hidden truth or a counter-intuitive lesson that nobody else is talking about. This is your unique value.
    4.  **Specificity & Tangibility:** Include concrete numbers, specific tools, real timeframes, and vivid details. This builds credibility and makes your story real.
    5.  **Pacing & Readability:** Use short, punchy sentences. Employ frequent, natural line breaks to create visual pauses and enhance mobile readability. Vary sentence length for rhythm.
    
    **Tweet Structure (Adapt as needed for flow, but ensure all elements are present):**
    
    **1. The Irresistible Hook (1-2 sentences):**
       - Start with a bold, personal statement or a surprising revelation related to ${topic} or ${idea}. Aim for immediate curiosity or strong relatability.
       - *Examples:* "I spent [X time/money] on ${topic} and almost gave up, but then...", "Everyone tells you to do [common approach] for ${idea}, but they're wrong. Here's why...", "The biggest lie I was told about ${topic} was [common misconception]."
    
    **2. The Raw Struggle (2-4 sentences):**
       - Detail the specific, relatable problems, failures, or misconceptions you faced with ${topic} or ${idea}. Show your vulnerability.
       - Describe what you *thought* would work, and why it failed. What was the breaking point or moment of deep frustration?
    
    **3. The 'Aha!' Breakthrough (1-2 sentences):**
       - Pinpoint the exact moment or specific insight that changed everything. This should be a clear turning point.
       - *Focus:* What was the unique realization or discovery that shifted your perspective or approach?
    
    **4. The Tangible Results (2-3 sentences):**
       - Provide concrete, quantifiable outcomes (even if approximate) and qualitative personal impact.
       - *Examples:* "Before: [Metric 1] -> After: [Metric 1]", "My [feeling] went from [negative] to [positive]."
       - Show the transformation.
    
    **5. The Unfiltered Lesson & Next Step (2-3 sentences):**
       - Share the profound, often unsaid, lesson learned about ${topic} or ${idea}. What do people *really* need to know?
       - Offer a clear, actionable first step for the reader. What should they do *instead* of the common wrong approach?
    
    **Formatting Guidelines (Strictly Adhere):**
    -   **No Emojis.**
    -   **No Hashtags.**
    -   **No Sales Language.**
    -   **New Line Breaks:** Use generously for readability.
    -   **Sentence Spacing:** Ensure natural spacing between sentences.
    -   **Bullet Points/Dashes:** Use (•) or (–) for lists when appropriate, but don't overuse.
    -   **Transitions:** Use natural conversational connectors. Avoid overly formal transition words.
    -   **Word Choice:** Prefer strong verbs and evocative language over generic terms. Inject subtle personal quirks or a hint of self-deprecating humor.
    -   **Imperfection:** Allow for minor grammatical variations or sentence fragments if they enhance the human, conversational feel. Avoid robotic perfection.
    
    Generate the complete tweet content based on the provided ${topic} and ${idea} .`;

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