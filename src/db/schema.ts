import { pgTable, uuid, text, timestamp, boolean, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Better-auth expects these specific table names and structures
// Users table - Better-auth expects "user" table name
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Sessions table - Better-auth expects "session" table name
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// Accounts table - Better-auth expects "account" table name for social providers
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Verification table - Better-auth expects "verification" table name
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Our custom application tables
// Users table - stores user information from Twitter OAuth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  twitterId: text("twitter_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  verified: boolean("verified").default(false),
  topics: jsonb("topics").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  twitterIdIdx: index("users_twitter_id_idx").on(table.twitterId),
  usernameIdx: index("users_username_idx").on(table.username),
}));

// Saved tweets table - stores user's saved/generated content
export const savedTweets = pgTable("saved_tweets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  originalTweetId: text("original_tweet_id"),
  originalContent: text("original_content").notNull(),
  generatedContent: text("generated_content").notNull(),
  toolUsed: varchar("tool_used", { length: 50 }).notNull(),
  isThread: boolean("is_thread").default(false),
  threadParts: jsonb("thread_parts").$type<string[]>(),
  metadata: jsonb("metadata").$type<{
    originalAuthor?: string;
    originalMetrics?: {
      likes: number;
      retweets: number;
      replies: number;
      impressions?: number;
    };
    generationPrompt?: string;
    tags?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("saved_tweets_user_id_idx").on(table.userId),
  toolUsedIdx: index("saved_tweets_tool_used_idx").on(table.toolUsed),
  createdAtIdx: index("saved_tweets_created_at_idx").on(table.createdAt),
}));

// Tweet cache table - caches discovered tweets to reduce API calls
export const tweetCache = pgTable("tweet_cache", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tweetId: text("tweet_id").notNull().unique(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull(),
  authorUsername: text("author_username").notNull(),
  authorDisplayName: text("author_display_name").notNull(),
  authorAvatarUrl: text("author_avatar_url"),
  authorVerified: boolean("author_verified").default(false),
  metrics: jsonb("metrics").$type<{
    likes: number;
    retweets: number;
    replies: number;
    impressions?: number;
    quotes?: number;
  }>().notNull(),
  topics: jsonb("topics").$type<string[]>().default([]),
  language: varchar("language", { length: 10 }).default("en"),
  source: varchar("source", { length: 50 }).default("trending"), // trending, inspiration_account, similar_account
  sourceAccountId: text("source_account_id"), // References inspiration account if applicable
  createdAt: timestamp("created_at").notNull(), // Original tweet creation time
  cachedAt: timestamp("cached_at").defaultNow().notNull(), // When we cached it
  expiresAt: timestamp("expires_at").notNull(), // Cache expiration
}, (table) => ({
  tweetIdIdx: index("tweet_cache_tweet_id_idx").on(table.tweetId),
  authorIdIdx: index("tweet_cache_author_id_idx").on(table.authorId),
  topicsIdx: index("tweet_cache_topics_idx").on(table.topics),
  expiresAtIdx: index("tweet_cache_expires_at_idx").on(table.expiresAt),
  metricsIdx: index("tweet_cache_metrics_idx").on(table.metrics),
  sourceIdx: index("tweet_cache_source_idx").on(table.source),
  sourceAccountIdx: index("tweet_cache_source_account_idx").on(table.sourceAccountId),
}));

// Inspiration accounts - stores accounts users want to follow for inspiration
export const inspirationAccounts = pgTable("inspiration_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  twitterUsername: text("twitter_username").notNull(),
  twitterUserId: text("twitter_user_id").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  verified: boolean("verified").default(false),
  followerCount: text("follower_count"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("inspiration_accounts_user_id_idx").on(table.userId),
  twitterUsernameIdx: index("inspiration_accounts_twitter_username_idx").on(table.twitterUsername),
  twitterUserIdIdx: index("inspiration_accounts_twitter_user_id_idx").on(table.twitterUserId),
  userAccountIdx: index("inspiration_accounts_user_account_idx").on(table.userId, table.twitterUsername),
}));

// User seen tweets - tracks which tweets a user has seen to prevent repetition
export const userSeenTweets = pgTable("user_seen_tweets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tweetId: text("tweet_id").notNull(),
  seenAt: timestamp("seen_at").defaultNow().notNull(),
  source: varchar("source", { length: 50 }).notNull(), // trending, inspiration_account, similar_account
}, (table) => ({
  userIdIdx: index("user_seen_tweets_user_id_idx").on(table.userId),
  tweetIdIdx: index("user_seen_tweets_tweet_id_idx").on(table.tweetId),
  userTweetIdx: index("user_seen_tweets_user_tweet_idx").on(table.userId, table.tweetId),
  seenAtIdx: index("user_seen_tweets_seen_at_idx").on(table.seenAt),
}));

// Similar accounts discovery - stores algorithmically discovered similar accounts
export const similarAccounts = pgTable("similar_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  baseAccountId: uuid("base_account_id").references(() => inspirationAccounts.id, { onDelete: "cascade" }).notNull(),
  twitterUsername: text("twitter_username").notNull(),
  twitterUserId: text("twitter_user_id").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  verified: boolean("verified").default(false),
  followerCount: text("follower_count"),
  bio: text("bio"),
  similarityScore: text("similarity_score").default("0"), // 0-100 score
  similarityReasons: jsonb("similarity_reasons").$type<string[]>().default([]), // bio_keywords, hashtags, followers
  isActive: boolean("is_active").default(true),
  lastFetchedAt: timestamp("last_fetched_at"),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  baseAccountIdx: index("similar_accounts_base_account_idx").on(table.baseAccountId),
  twitterUsernameIdx: index("similar_accounts_twitter_username_idx").on(table.twitterUsername),
  twitterUserIdIdx: index("similar_accounts_twitter_user_id_idx").on(table.twitterUserId),
  similarityScoreIdx: index("similar_accounts_similarity_score_idx").on(table.similarityScore),
}));

// User preferences table - stores user settings and preferences
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  defaultTimeFilter: varchar("default_time_filter", { length: 20 }).default("week"),
  preferredTopics: jsonb("preferred_topics").$type<string[]>().default([]),
  aiToolPreferences: jsonb("ai_tool_preferences").$type<{
    favoriteTools?: string[];
    tonePreference?: "casual" | "formal" | "assertive";
    includeEmojis?: boolean;
    threadPreference?: boolean;
  }>().default({}),
  notificationSettings: jsonb("notification_settings").$type<{
    emailNotifications?: boolean;
    weeklyDigest?: boolean;
    newFeatures?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
}));

// Analytics table - tracks user activity and usage patterns
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  eventData: jsonb("event_data").$type<{
    toolUsed?: string;
    tweetId?: string;
    searchQuery?: string;
    timeFilter?: string;
    success?: boolean;
    errorMessage?: string;
    responseTime?: number;
    [key: string]: unknown;
  }>(),
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("analytics_user_id_idx").on(table.userId),
  eventTypeIdx: index("analytics_event_type_idx").on(table.eventType),
  createdAtIdx: index("analytics_created_at_idx").on(table.createdAt),
  sessionIdIdx: index("analytics_session_id_idx").on(table.sessionId),
}));

// Export types for TypeScript
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type AppUser = typeof users.$inferSelect;
export type NewAppUser = typeof users.$inferInsert;

export type SavedTweet = typeof savedTweets.$inferSelect;
export type NewSavedTweet = typeof savedTweets.$inferInsert;

export type TweetCache = typeof tweetCache.$inferSelect;
export type NewTweetCache = typeof tweetCache.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;

export type InspirationAccount = typeof inspirationAccounts.$inferSelect;
export type NewInspirationAccount = typeof inspirationAccounts.$inferInsert;

export type UserSeenTweet = typeof userSeenTweets.$inferSelect;
export type NewUserSeenTweet = typeof userSeenTweets.$inferInsert;

export type SimilarAccount = typeof similarAccounts.$inferSelect;
export type NewSimilarAccount = typeof similarAccounts.$inferInsert;
