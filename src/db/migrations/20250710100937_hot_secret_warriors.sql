CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"session_id" text,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_tweets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"original_tweet_id" text,
	"original_content" text NOT NULL,
	"generated_content" text NOT NULL,
	"tool_used" varchar(50) NOT NULL,
	"is_thread" boolean DEFAULT false,
	"thread_parts" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tweet_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tweet_id" text NOT NULL,
	"content" text NOT NULL,
	"author_id" text NOT NULL,
	"author_username" text NOT NULL,
	"author_display_name" text NOT NULL,
	"author_avatar_url" text,
	"author_verified" boolean DEFAULT false,
	"metrics" jsonb NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"language" varchar(10) DEFAULT 'en',
	"created_at" timestamp NOT NULL,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "tweet_cache_tweet_id_unique" UNIQUE("tweet_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"default_time_filter" varchar(20) DEFAULT 'week',
	"preferred_topics" jsonb DEFAULT '[]'::jsonb,
	"ai_tool_preferences" jsonb DEFAULT '{}'::jsonb,
	"notification_settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"twitter_access_token" text,
	"twitter_refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twitter_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"email" text,
	"verified" boolean DEFAULT false,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_twitter_id_unique" UNIQUE("twitter_id")
);
--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_tweets" ADD CONSTRAINT "saved_tweets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_user_id_idx" ON "analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_session_id_idx" ON "analytics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "saved_tweets_user_id_idx" ON "saved_tweets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_tweets_tool_used_idx" ON "saved_tweets" USING btree ("tool_used");--> statement-breakpoint
CREATE INDEX "saved_tweets_created_at_idx" ON "saved_tweets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tweet_cache_tweet_id_idx" ON "tweet_cache" USING btree ("tweet_id");--> statement-breakpoint
CREATE INDEX "tweet_cache_author_id_idx" ON "tweet_cache" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "tweet_cache_topics_idx" ON "tweet_cache" USING btree ("topics");--> statement-breakpoint
CREATE INDEX "tweet_cache_expires_at_idx" ON "tweet_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tweet_cache_metrics_idx" ON "tweet_cache" USING btree ("metrics");--> statement-breakpoint
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_twitter_id_idx" ON "users" USING btree ("twitter_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");