import { router, protectedProcedure } from '@/server/trpc/trpc';
import { z } from 'zod';
import { AITool } from '@/lib/types/aiTools';
import { aiContentGenerator } from '@/lib/services/ai-content-generator';
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
      try {
        const result = await aiContentGenerator.generateContent(
          input.tool,
          input.originalTweet,
          { customPrompt: input.customPrompt }
        );        
        return {
          success: true,
          content: result.content,
          suggestions: result.suggestions
        };
      } catch (error) {
        console.error('AI Generation failed:', error);
        throw new Error('Failed to generate content');
      }
    }),
});
