// Application Constants
export const APP_CONFIG = {
  name: "TweetInspire",
  description: "AI-powered tweet inspiration and content generation platform",
  url: "https://tweetinspire.com",
  version: "1.0.0",
} as const;

// API Configuration
export const API_CONFIG = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
  },
  
  // Timeouts
  timeouts: {
    default: 30000, // 30 seconds
    ai: 60000, // 60 seconds for AI operations
    twitter: 10000, // 10 seconds for Twitter API
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

// Twitter API Configuration
export const TWITTER_CONFIG = {
  // Search parameters
  search: {
    maxResults: 35, // Updated: return 30+ tweets (increased from 30)
    tweetFields: [
      "id",
      "text",
      "author_id",
      "created_at",
      "public_metrics",
      "context_annotations",
      "lang",
    ],
    userFields: ["id", "name", "username", "profile_image_url", "verified"],
    expansions: ["author_id"],
  },
  
  // Engagement thresholds (updated for 6-month range)
  engagement: {
    high: 2000,      // Primary threshold: 2k+ impressions (reduced from 10k)
    medium: 1000,    // Secondary threshold: 1k+ impressions
    low: 500,        // Fallback threshold: 500+ impressions
    minLikes: 10,
    minRetweets: 5,
    minReplies: 2,
  },
  
  // Time filters (in days)
  timeFilters: {
    week: 7,
    month: 30,
    quarter: 90,
    sixMonths: 180,  // New: 6 months filter for enhanced results
  },
} as const;

// AI Tools Configuration
export const AI_TOOLS = {
  // Left column tools
  left: [
    {
      id: "copywriting-tips",
      name: "Copywriting Tips",
      icon: "🚀",
      description: "Get viral copywriting insights",
    },
    {
      id: "keep-writing",
      name: "Keep Writing",
      icon: "✍️",
      description: "Continue the thought naturally",
    },
    {
      id: "add-emojis",
      name: "Add Emojis",
      icon: "😊",
      description: "Strategic emoji placement",
    },
    {
      id: "make-shorter",
      name: "Make Shorter",
      icon: "✂️",
      description: "Condense while keeping punch",
    },
    {
      id: "expand-tweet",
      name: "Expand Tweet",
      icon: "🔄",
      description: "Turn into viral thread",
    },
    {
      id: "create-hook",
      name: "Create Hook",
      icon: "▶️",
      description: "Generate scroll-stopping opener",
    },
    {
      id: "create-cta",
      name: "Create CTA",
      icon: "📢",
      description: "Add natural call-to-action",
    },
  ],
  
  // Right column tools
  right: [
    {
      id: "improve-tweet",
      name: "Improve Tweet",
      icon: "⚡",
      description: "Make it more viral",
    },
    {
      id: "more-assertive",
      name: "More Assertive",
      icon: "💪",
      description: "Add confidence and authority",
    },
    {
      id: "more-casual",
      name: "More Casual",
      icon: "😎",
      description: "Make it feel like texting a friend",
    },
    {
      id: "more-formal",
      name: "More Formal",
      icon: "👔",
      description: "Professional but human tone",
    },
    {
      id: "fix-grammar",
      name: "Fix Grammar",
      icon: "🔧",
      description: "Perfect the writing",
    },
    {
      id: "tweet-ideas",
      name: "Tweet Ideas",
      icon: "💡",
      description: "Generate related tweet concepts",
    },
  ],
} as const;

// User Topics/Interests
export const USER_TOPICS = [
  "AI & Machine Learning",
  "SaaS & Startups",
  "Marketing & Growth",
  "Web Development",
  "Entrepreneurship",
  "Productivity",
  "Design & UX",
  "Business Strategy",
  "Technology Trends",
  "Personal Branding",
] as const;

// Database Configuration
export const DB_CONFIG = {
  // Connection pool
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  
  // Query timeouts
  queryTimeout: 30000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  // Animation durations (in ms)
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Breakpoints (matches Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
} as const;

// Export types for TypeScript
export type AITool = (typeof AI_TOOLS.left | typeof AI_TOOLS.right)[number];
export type UserTopic = (typeof USER_TOPICS)[number];
export type TimeFilter = keyof typeof TWITTER_CONFIG.timeFilters;
