CREATE TABLE "ai_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_used" varchar(50) NOT NULL,
	"original_tweet" text NOT NULL,
	"generated_content" text NOT NULL,
	"prompt_used" text NOT NULL,
	"model_used" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generations_user_id_idx" ON "ai_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_generations_tool_used_idx" ON "ai_generations" USING btree ("tool_used");--> statement-breakpoint
CREATE INDEX "ai_generations_created_at_idx" ON "ai_generations" USING btree ("created_at");