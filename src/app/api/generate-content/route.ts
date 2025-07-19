import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/services/openai-content';

export async function POST(request: NextRequest) {
  try {
    const { category, contentType, idea, tone, topic } = await request.json();

    if (!category || !contentType || !idea || !tone || !topic) {
      return NextResponse.json(
        { error: 'All parameters are required' },
        { status: 400 }
      );
    }

    const content = await generateContent({
      category,
      contentType,
      idea,
      tone,
      topic,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}