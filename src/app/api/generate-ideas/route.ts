import { NextRequest, NextResponse } from 'next/server';
import { generateTopicIdeas } from '@/lib/services/openai-content';

export async function POST(request: NextRequest) {
  try {
    const { topic, category } = await request.json();

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Topic and category are required' },
        { status: 400 }
      );
    }

    const ideas = await generateTopicIdeas(topic, category);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}