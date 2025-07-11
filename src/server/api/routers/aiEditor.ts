import { router, protectedProcedure } from '@/server/trpc/trpc';
import { z } from 'zod';
import { streamText } from 'ai';
import { openai } from '@/lib/ai/config';
import { AITool } from '@/lib/types/aiTools';
import { getToolPrompt } from '@/lib/ai/prompts';

export const aiEditorRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        tool: z.nativeEnum(AITool),
        originalTweet: z.string(),
        customPrompt: z.string().optional(),
      }),
    )
    .mutation(async ({ input }: { input: { tool: AITool; originalTweet: string; customPrompt?: string } }) => {
      const systemPrompt = getToolPrompt(input.tool, input.originalTweet);
      const result = await streamText({
        model: openai('gpt-4o'),
        system: systemPrompt,
        prompt: input.customPrompt || input.originalTweet,
      });
      return result.toTextStreamResponse();
    }),
});
