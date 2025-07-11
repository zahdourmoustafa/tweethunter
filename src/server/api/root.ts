import { router } from '@/server/trpc/trpc';
import { aiEditorRouter } from './routers/aiEditor';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  aiEditor: aiEditorRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
