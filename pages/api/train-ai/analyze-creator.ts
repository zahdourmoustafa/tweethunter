// API endpoint: /api/train-ai/analyze-creator
import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterApiService } from '@/lib/services/twitter-api';
import { TrainingDbService } from '@/lib/services/training-db';
import { AnalyzeCreatorRequest, AnalyzeCreatorResponse } from '@/lib/types/training';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeCreatorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { username }: AnalyzeCreatorRequest = req.body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Username is required and must be a string.'
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

    // Initialize services
    const twitterService = new TwitterApiService();
    const dbService = new TrainingDbService();

    // Step 1: Validate username exists
    const validation = await twitterService.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Step 2: Check if user already has a model for this creator
    const existingModel = await dbService.hasExistingModel(userId, username.replace('@', ''));
    if (existingModel.exists) {
      return res.status(409).json({
        success: false,
        error: `You already have a trained AI model for @${username.replace('@', '')}. Each creator can only be trained once per user.`
      });
    }

    // Step 3: Create training session
    const sessionResult = await dbService.createTrainingSession(userId, username.replace('@', ''));
    if (!sessionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create training session.'
      });
    }

    // Step 4: Fetch viral tweets
    const viralTweetsResult = await twitterService.fetchViralTweets(username);

    if (viralTweetsResult.error) {
      // Update session status to failed
      await dbService.updateTrainingSessionStatus(
        sessionResult.data!.id, 
        'failed', 
        viralTweetsResult.error
      );

      return res.status(400).json({
        success: false,
        error: viralTweetsResult.error
      });
    }

    // Step 5: Get creator info for display
    const creatorInfoResult = await twitterService.getUserInfo(username);
    const creatorInfo = creatorInfoResult.success ? {
      username: creatorInfoResult.data.userName,
      name: creatorInfoResult.data.name,
      profilePicture: creatorInfoResult.data.profilePicture,
      followers: creatorInfoResult.data.followers,
    } : {
      username: username.replace('@', ''),
      name: username.replace('@', ''),
      profilePicture: '',
      followers: 0,
    };

    // Step 6: Update training session with collected tweets
    await dbService.updateTrainingSessionTweets(
      sessionResult.data!.id,
      viralTweetsResult.tweets
    );

    // Step 7: Calculate total engagement
    const totalEngagement = viralTweetsResult.tweets.reduce(
      (sum, tweet) => sum + tweet.totalEngagement, 
      0
    );

    // Return success response
    const finalResponse = {
      success: true,
      data: {
        tweets: viralTweetsResult.tweets,
        totalEngagement,
        creatorInfo,
        has_next_page: viralTweetsResult.has_next_page,
        next_cursor: viralTweetsResult.next_cursor,
      },
    };
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Error in analyze-creator API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

// Export config for larger request bodies (tweets can be large)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};
