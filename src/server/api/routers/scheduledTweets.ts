import { router, protectedProcedure } from '@/server/trpc/trpc';
import { z } from 'zod';
import { db } from '@/lib/db';
import { scheduledTweets } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

export const scheduledTweetsRouter = router({
  // Create a new scheduled tweet
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(280),
        originalContent: z.string().optional(),
        toolUsed: z.string().optional(),
        scheduledAt: z.string().datetime(),
        timezone: z.string().default('UTC'),
        isThread: z.boolean().default(false),
        threadParts: z.array(z.string()).optional(),
        metadata: z.object({
          aiToolUsed: z.string().optional(),
          originalTweetId: z.string().optional(),
          generationPrompt: z.string().optional(),
          retryCount: z.number().optional(),
          tags: z.array(z.string()).optional(),
        }).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const [scheduledTweet] = await db
          .insert(scheduledTweets)
          .values({
            userId,
            content: input.content,
            originalContent: input.originalContent,
            toolUsed: input.toolUsed,
            scheduledAt: new Date(input.scheduledAt),
            timezone: input.timezone,
            isThread: input.isThread,
            threadParts: input.threadParts,
            metadata: input.metadata,
          })
          .returning();

        return {
          success: true,
          scheduledTweet,
        };
      } catch (error) {
        console.error('Failed to create scheduled tweet:', error);
        throw new Error('Failed to schedule tweet');
      }
    }),

  // Get all scheduled tweets for a user
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['scheduled', 'posted', 'failed', 'cancelled']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const whereClause = input.status
          ? and(eq(scheduledTweets.userId, userId), eq(scheduledTweets.status, input.status))
          : eq(scheduledTweets.userId, userId);

        const tweets = await db
          .select()
          .from(scheduledTweets)
          .where(whereClause)
          .orderBy(asc(scheduledTweets.scheduledAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          tweets,
        };
      } catch (error) {
        console.error('Failed to fetch scheduled tweets:', error);
        throw new Error('Failed to fetch scheduled tweets');
      }
    }),

  // Get scheduled tweets for calendar view (by date range)
  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const tweets = await db
          .select()
          .from(scheduledTweets)
          .where(
            and(
              eq(scheduledTweets.userId, userId),
              // Filter by date range
              // Note: This is a simplified version - you might want to add proper date range filtering
            )
          )
          .orderBy(asc(scheduledTweets.scheduledAt));

        return {
          success: true,
          tweets,
        };
      } catch (error) {
        console.error('Failed to fetch scheduled tweets by date range:', error);
        throw new Error('Failed to fetch scheduled tweets');
      }
    }),

  // Update a scheduled tweet
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(280).optional(),
        scheduledAt: z.string().datetime().optional(),
        timezone: z.string().optional(),
        status: z.enum(['scheduled', 'posted', 'failed', 'cancelled']).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const updateData: any = {};
        
        if (input.content) updateData.content = input.content;
        if (input.scheduledAt) updateData.scheduledAt = new Date(input.scheduledAt);
        if (input.timezone) updateData.timezone = input.timezone;
        if (input.status) updateData.status = input.status;
        
        updateData.updatedAt = new Date();

        const [updatedTweet] = await db
          .update(scheduledTweets)
          .set(updateData)
          .where(
            and(
              eq(scheduledTweets.id, input.id),
              eq(scheduledTweets.userId, userId)
            )
          )
          .returning();

        if (!updatedTweet) {
          throw new Error('Scheduled tweet not found');
        }

        return {
          success: true,
          scheduledTweet: updatedTweet,
        };
      } catch (error) {
        console.error('Failed to update scheduled tweet:', error);
        throw new Error('Failed to update scheduled tweet');
      }
    }),

  // Delete a scheduled tweet
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const [deletedTweet] = await db
          .delete(scheduledTweets)
          .where(
            and(
              eq(scheduledTweets.id, input.id),
              eq(scheduledTweets.userId, userId)
            )
          )
          .returning();

        if (!deletedTweet) {
          throw new Error('Scheduled tweet not found');
        }

        return {
          success: true,
          deletedTweet,
        };
      } catch (error) {
        console.error('Failed to delete scheduled tweet:', error);
        throw new Error('Failed to delete scheduled tweet');
      }
    }),

  // Get a single scheduled tweet
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        const [tweet] = await db
          .select()
          .from(scheduledTweets)
          .where(
            and(
              eq(scheduledTweets.id, input.id),
              eq(scheduledTweets.userId, userId)
            )
          );

        if (!tweet) {
          throw new Error('Scheduled tweet not found');
        }

        return {
          success: true,
          tweet,
        };
      } catch (error) {
        console.error('Failed to fetch scheduled tweet:', error);
        throw new Error('Failed to fetch scheduled tweet');
      }
    }),
}); 