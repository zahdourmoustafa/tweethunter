CREATE TABLE "generated_tweets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"voice_model_id" text NOT NULL,
	"original_idea" text NOT NULL,
	"generated_content" text NOT NULL,
	"variation_type" varchar(50) NOT NULL,
	"character_count" text NOT NULL,
	"used" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_tweets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"original_content" text,
	"tool_used" text,
	"scheduled_at" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_thread" boolean DEFAULT false,
	"thread_parts" jsonb,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"posted_at" timestamp,
	"posted_tweet_id" text,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_models" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"twitter_username" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"analysis_data" jsonb NOT NULL,
	"confidence_score" text DEFAULT '0',
	"tweet_count" text DEFAULT '0',
	"last_analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_content" ADD COLUMN "tweet_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "generated_tweets" ADD CONSTRAINT "generated_tweets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_tweets" ADD CONSTRAINT "generated_tweets_voice_model_id_voice_models_id_fk" FOREIGN KEY ("voice_model_id") REFERENCES "public"."voice_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_tweets" ADD CONSTRAINT "scheduled_tweets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_models" ADD CONSTRAINT "voice_models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generated_tweets_user_id_idx" ON "generated_tweets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generated_tweets_voice_model_id_idx" ON "generated_tweets" USING btree ("voice_model_id");--> statement-breakpoint
CREATE INDEX "generated_tweets_variation_type_idx" ON "generated_tweets" USING btree ("variation_type");--> statement-breakpoint
CREATE INDEX "generated_tweets_used_idx" ON "generated_tweets" USING btree ("used");--> statement-breakpoint
CREATE INDEX "generated_tweets_created_at_idx" ON "generated_tweets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scheduled_tweets_user_id_idx" ON "scheduled_tweets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_tweets_scheduled_at_idx" ON "scheduled_tweets" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "scheduled_tweets_status_idx" ON "scheduled_tweets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_tweets_created_at_idx" ON "scheduled_tweets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "voice_models_user_id_idx" ON "voice_models" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voice_models_twitter_username_idx" ON "voice_models" USING btree ("twitter_username");--> statement-breakpoint
CREATE INDEX "voice_models_user_username_idx" ON "voice_models" USING btree ("user_id","twitter_username");--> statement-breakpoint
CREATE INDEX "voice_models_last_analyzed_idx" ON "voice_models" USING btree ("last_analyzed_at");