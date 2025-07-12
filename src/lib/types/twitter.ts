// TypeScript types for twitterapi.io API responses

export interface TwitterUser {
  name: string
  username: string
  profile_image_url: string
  verified?: boolean
  isBlueVerified?: boolean
  verifiedType?: string
}

export interface TweetMetrics {
  like_count: number
  retweet_count: number
  reply_count: number
  impression_count?: number
}

export interface TwitterMedia {
  type: 'photo' | 'video' | 'animated_gif'
  url: string
  media_url_https: string
  display_url: string
  expanded_url: string
  width?: number
  height?: number
}

export interface Tweet {
  id: string
  text: string
  author: TwitterUser
  public_metrics: TweetMetrics
  created_at: string
  // Media attachments
  media?: TwitterMedia[]
  // Thread/conversation context
  conversation_id?: string
  in_reply_to_user_id?: string
  referenced_tweets?: Array<{
    type: 'replied_to' | 'quoted' | 'retweeted'
    id: string
  }>
  // Expanded thread context
  thread_context?: {
    is_thread: boolean
    thread_position?: number
    total_tweets?: number
    thread_tweets?: Tweet[]
  }
  // Enhanced source information for inspiration accounts
  source?: 'inspiration_account' | 'trending' | 'similar_account'
  source_account?: string
  sourceLabel?: string
}

export interface TwitterApiSearchResponse {
  data?: Array<{
    id: string
    text: string
    author_id: string
    created_at: string
    public_metrics: {
      like_count: number
      retweet_count: number
      reply_count: number
      impression_count?: number
    }
  }>
  includes?: {
    users?: Array<{
      id: string
      name: string
      username: string
      profile_image_url: string
      verified?: boolean
      public_metrics?: {
        followers_count: number
        following_count: number
      }
    }>
  }
  meta?: {
    result_count: number
    next_token?: string
  }
}

export interface TwitterApiUserResponse {
  data: {
    id: string
    name: string
    username: string
    profile_image_url: string
    verified?: boolean
    isBlueVerified?: boolean
    verifiedType?: string
    description?: string
    location?: string
    followers: number
    following: number
    createdAt: string
    statusesCount: number
  }
  status: string
  msg: string
}

export interface TwitterApiError {
  status: string
  msg: string
  error?: string
}

export type TwitterApiResponse<T = any> = {
  status: 'success' | 'error'
  msg: string
  data?: T
  error?: string
} 