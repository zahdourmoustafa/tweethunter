// API endpoint: /api/train-ai/start-training
import { NextApiRequest, NextApiResponse } from 'next';
import { TrainingDbService } from '@/lib/services/training-db';
import { StartTrainingRequest, StartTrainingResponse } from '@/lib/types/training';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StartTrainingResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { tweets, creatorUsername }: StartTrainingRequest = req.body;

    // Validate input
    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tweets array is required and must not be empty.'
      });
    }

    if (!creatorUsername || typeof creatorUsername !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Creator username is required.'
      });
    }

    // TODO: Add user authentication
    // const userId = await getUserIdFromSession(req);
    // if (!userId) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Authentication required.'
    //   });
    // }
    const userId = 'temp-user-id'; // Placeholder

    // Initialize database service
    const dbService = new TrainingDbService();

    // Create new training session for the training phase
    const sessionResult = await dbService.createTrainingSession(userId, creatorUsername);
    if (!sessionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create training session.'
      });
    }

    const trainingId = sessionResult.data!.id;

    // Update session status to training
    await dbService.updateTrainingSessionStatus(trainingId, 'training');

    // Start background training process
    // Note: In a production environment, you'd want to use a job queue (Bull, Agenda, etc.)
    // For now, we'll use a simple async function
    startBackgroundTraining(trainingId, userId, creatorUsername, tweets);

    // Return immediate response with training ID
    return res.status(200).json({
      success: true,
      data: {
        trainingId,
        status: 'started'
      }
    });

  } catch (error) {
    console.error('Error in start-training API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

/**
 * Background training process
 * In production, this should be moved to a job queue system
 */
async function startBackgroundTraining(
  trainingId: string,
  userId: string,
  creatorUsername: string,
  tweets: any[]
) {
  const dbService = new TrainingDbService();

  try {
    // Simulate training steps with delays
    const steps = [
      'Analyzing tweet structures...',
      'Learning viral hooks...',
      'Understanding storytelling patterns...',
      'Identifying emotional triggers...',
      'Mastering voice and tone...',
      'Finalizing AI training...'
    ];

    // Simulate training process (2-5 minutes total)
    for (let i = 0; i < steps.length; i++) {
      // Random delay between 20-60 seconds per step
      const delay = Math.random() * 40000 + 20000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // In a real implementation, you'd update progress in the database
      console.log(`Training ${trainingId}: ${steps[i]}`);
    }

    // Generate training prompt based on viral tweets
    const trainingPrompt = generateTrainingPrompt(creatorUsername, tweets);

    // Create the trained AI model
    const modelName = `${creatorUsername} Style AI`;
    const modelResult = await dbService.createTrainedModel(
      userId,
      creatorUsername,
      modelName,
      trainingPrompt,
      tweets
    );

    if (modelResult.success) {
      // Mark training session as completed
      await dbService.updateTrainingSessionStatus(trainingId, 'completed');
      console.log(`Training ${trainingId} completed successfully`);
    } else {
      throw new Error('Failed to create trained model');
    }

  } catch (error) {
    console.error(`Training ${trainingId} failed:`, error);
    await dbService.updateTrainingSessionStatus(
      trainingId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Generates a training prompt based on viral tweets
 */
function generateTrainingPrompt(creatorUsername: string, tweets: any[]): string {
  // Analyze tweets to extract patterns
  const tweetTexts = tweets.map(t => t.text).join('\n\n---\n\n');
  
  // Calculate average engagement
  const avgEngagement = tweets.reduce((sum, t) => sum + t.totalEngagement, 0) / tweets.length;
  
  // Extract common patterns (simplified for now)
  const hasThreads = tweets.some(t => t.text.includes('🧵') || t.text.includes('Thread'));
  const commonHashtags = extractCommonHashtags(tweets);
  const avgLength = tweets.reduce((sum, t) => sum + t.text.length, 0) / tweets.length;

  return `You are an AI trained to write viral tweets in the style of @${creatorUsername}. 

TRAINING DATA ANALYSIS:
- Analyzed ${tweets.length} viral tweets with average ${Math.round(avgEngagement).toLocaleString()} engagement
- Average tweet length: ${Math.round(avgLength)} characters
- Uses threads: ${hasThreads ? 'Yes' : 'No'}
- Common themes: ${commonHashtags.join(', ')}

VIRAL TWEET EXAMPLES:
${tweetTexts}

INSTRUCTIONS:
1. Write tweets that match @${creatorUsername}'s voice, tone, and style
2. Use similar sentence structures and vocabulary patterns
3. Apply the same emotional triggers and psychological hooks
4. Maintain the same level of authenticity and personality
5. Focus on topics and themes that resonate with their audience
6. Use similar formatting, punctuation, and emoji patterns

When generating content, always:
- Start with a strong hook that grabs attention
- Use the same conversational tone and personality
- Include relevant insights or value propositions
- End with engagement-driving elements when appropriate
- Keep the authentic voice while optimizing for viral potential

Remember: You're not copying content, you're learning and applying the successful patterns that make @${creatorUsername}'s tweets go viral.`;
}

/**
 * Extracts common hashtags from tweets
 */
function extractCommonHashtags(tweets: any[]): string[] {
  const hashtagCounts: { [key: string]: number } = {};
  
  tweets.forEach(tweet => {
    if (tweet.entities?.hashtags) {
      tweet.entities.hashtags.forEach((hashtag: any) => {
        const tag = hashtag.text.toLowerCase();
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(hashtagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => `#${tag}`);
}

// Export config for larger request bodies
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};
