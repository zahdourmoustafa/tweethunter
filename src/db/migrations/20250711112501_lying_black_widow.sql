CREATE TABLE "inspiration_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"twitter_username" text NOT NULL,
	"twitter_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"verified" boolean DEFAULT false,
	"follower_count" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "similar_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_account_id" uuid NOT NULL,
	"twitter_username" text NOT NULL,
	"twitter_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"verified" boolean DEFAULT false,
	"follower_count" text,
	"bio" text,
	"similarity_score" text DEFAULT '0',
	"similarity_reasons" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_fetched_at" timestamp,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_seen_tweets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tweet_id" text NOT NULL,
	"seen_at" timestamp DEFAULT now() NOT NULL,
	"source" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tweet_cache" ADD COLUMN "source" varchar(50) DEFAULT 'trending';--> statement-breakpoint
ALTER TABLE "tweet_cache" ADD COLUMN "source_account_id" text;--> statement-breakpoint
ALTER TABLE "inspiration_accounts" ADD CONSTRAINT "inspiration_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_accounts" ADD CONSTRAINT "similar_accounts_base_account_id_inspiration_accounts_id_fk" FOREIGN KEY ("base_account_id") REFERENCES "public"."inspiration_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seen_tweets" ADD CONSTRAINT "user_seen_tweets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspiration_accounts_user_id_idx" ON "inspiration_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "inspiration_accounts_twitter_username_idx" ON "inspiration_accounts" USING btree ("twitter_username");--> statement-breakpoint
CREATE INDEX "inspiration_accounts_twitter_user_id_idx" ON "inspiration_accounts" USING btree ("twitter_user_id");--> statement-breakpoint
CREATE INDEX "inspiration_accounts_user_account_idx" ON "inspiration_accounts" USING btree ("user_id","twitter_username");--> statement-breakpoint
CREATE INDEX "similar_accounts_base_account_idx" ON "similar_accounts" USING btree ("base_account_id");--> statement-breakpoint
CREATE INDEX "similar_accounts_twitter_username_idx" ON "similar_accounts" USING btree ("twitter_username");--> statement-breakpoint
CREATE INDEX "similar_accounts_twitter_user_id_idx" ON "similar_accounts" USING btree ("twitter_user_id");--> statement-breakpoint
CREATE INDEX "similar_accounts_similarity_score_idx" ON "similar_accounts" USING btree ("similarity_score");--> statement-breakpoint
CREATE INDEX "user_seen_tweets_user_id_idx" ON "user_seen_tweets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_seen_tweets_tweet_id_idx" ON "user_seen_tweets" USING btree ("tweet_id");--> statement-breakpoint
CREATE INDEX "user_seen_tweets_user_tweet_idx" ON "user_seen_tweets" USING btree ("user_id","tweet_id");--> statement-breakpoint
CREATE INDEX "user_seen_tweets_seen_at_idx" ON "user_seen_tweets" USING btree ("seen_at");--> statement-breakpoint
CREATE INDEX "tweet_cache_source_idx" ON "tweet_cache" USING btree ("source");--> statement-breakpoint
CREATE INDEX "tweet_cache_source_account_idx" ON "tweet_cache" USING btree ("source_account_id");