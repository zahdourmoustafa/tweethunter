// Training System Types

export interface Tweet {
  id: string;
  text: string;
  url: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang?: string;
  bookmarkCount: number;
  inReplyToId?: string;
  conversationId?: string;
  isReply?: boolean;
  author: {
    userName: string;
    name: string;
    id: string;
    profilePicture: string;
    isBlueVerified: boolean;
  };
  entities?: {
    hashtags?: Array<{ text: string; indices: number[] }>;
    urls?: Array<{ display_url: string; expanded_url: string; url: string }>;
    user_mentions?: Array<{ screen_name: string; name: string; id_str: string }>;
  };
}

export interface ViralTweet extends Tweet {
  totalEngagement: number;
  viralScore: number;
}

export interface TwitterApiResponse {
  status: 'success' | 'error';
  code: number;
  msg: string;
  data: {
    pin_tweet: any; // Can be null or an object, depending on the API response
    tweets: Tweet[];
  };
  has_next_page: boolean;
  next_cursor: string;
}

export interface TrainingSession {
  id: string;
  userId: string;
  creatorUsername: string;
  status: 'collecting' | 'training' | 'completed' | 'failed';
  tweetsCollected?: ViralTweet[];
  trainingPrompt?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TrainedAiModel {
  id: string;
  userId: string;
  creatorUsername: string;
  modelName: string;
  modelPrompt: string;
  trainingData: ViralTweet[];
  totalEngagement: number;
  tweetsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface TrainingProgress {
  step: number;
  totalSteps: number;
  currentStep: string;
  isComplete: boolean;
  error?: string;
}

export interface AnalyzeCreatorRequest {
  username: string;
}

export interface AnalyzeCreatorResponse {
  success: boolean;
  data?: {
    tweets: ViralTweet[];
    totalEngagement: number;
    creatorInfo: {
      username: string;
      name: string;
      profilePicture: string;
      followers: number;
    };
    has_next_page?: boolean;
    next_cursor?: string;
  };
  error?: string;
}

export interface StartTrainingRequest {
  tweets: ViralTweet[];
  creatorUsername: string;
}

export interface StartTrainingResponse {
  success: boolean;
  data?: {
    trainingId: string;
    status: 'started';
  };
  error?: string;
}

export interface TrainingStatusResponse {
  success: boolean;
  data?: {
    status: 'in-progress' | 'completed' | 'failed';
    progress: TrainingProgress;
    modelId?: string;
  };
  error?: string;
}

// Utility types for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Constants
export const VIRAL_ENGAGEMENT_THRESHOLD = 100; // Lowered from 1000 to capture more viral tweets
export const MAX_VIRAL_TWEETS = 100;
export const MONTHS_BACK = 6;

export const TRAINING_STEPS = [
  'Analyzing tweet structures...',
  'Learning viral hooks...',
  'Understanding storytelling patterns...',
  'Identifying emotional triggers...',
  'Mastering voice and tone...',
  'Finalizing AI training...'
] as const;

export type TrainingStep = typeof TRAINING_STEPS[number];
