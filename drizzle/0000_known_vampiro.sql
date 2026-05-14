CREATE TYPE "public"."ai_usage_status" AS ENUM('success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."repo_section" AS ENUM('3d-motion', 'agent-skills');--> statement-breakpoint
CREATE TYPE "public"."repo_section_status" AS ENUM('approved', 'pending', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."repo_type" AS ENUM('portfolio', 'showcase', 'interactive-experience', 'visualization', 'creative-coding', 'starter', 'learning', 'game', 'agent-skill', 'mcp-server', 'prompt-pack', 'workflow', 'agent-tool', 'workflow-agent', 'browser-agent', 'coding-agent', 'agent-framework', 'automation-tool', 'llm-tool', 'ui-resource', 'library', 'tool', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'processing', 'approved', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('repo', 'skill_file');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "agent_skill_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"repo_section_id" uuid,
	"section" text DEFAULT 'agent-skills' NOT NULL,
	"skill_name" text NOT NULL,
	"slug" text NOT NULL,
	"file_path" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"confidence" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"category_id" uuid,
	"subcategory_id" uuid,
	"description" text,
	"allowed_tools" jsonb,
	"user_invocable" boolean,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_accepted" boolean DEFAULT true NOT NULL,
	"content" text,
	"content_preview" text,
	"raw_file_url" text,
	"content_sha" text,
	"content_fetched_at" timestamp with time zone,
	"skill_folder_path" text,
	"download_zip_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"file_label" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature" text NOT NULL,
	"section" "repo_section" NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" "ai_usage_status" NOT NULL,
	"reason" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_repos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"repo_section_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" "repo_section" NOT NULL,
	"total_fetched" integer DEFAULT 0 NOT NULL,
	"total_unique" integer DEFAULT 0 NOT NULL,
	"total_accepted" integer DEFAULT 0 NOT NULL,
	"total_rejected" integer DEFAULT 0 NOT NULL,
	"total_existing" integer DEFAULT 0 NOT NULL,
	"total_new" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"rate_limit_hit" boolean DEFAULT false NOT NULL,
	"search_requests_budget" integer DEFAULT 0 NOT NULL,
	"total_variants_tried" integer DEFAULT 0 NOT NULL,
	"discovery_plan_mode" text,
	"discovery_plan_diagnosis" text,
	"discovery_plan_confidence" text,
	"discovery_plan_summary" text,
	"discovery_plan_reason" text,
	"discovery_plan_query_selection" text,
	"discovery_plan_saturation_bps" integer,
	"discovery_plan_new_bps" integer,
	"discovery_plan_failure_bps" integer,
	"status" "sync_status" NOT NULL,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"username" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"section" "repo_section" NOT NULL,
	"repo_type" "repo_type" DEFAULT 'unknown' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"rejection_reasons" text[] DEFAULT '{}' NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"status" "repo_section_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" bigint NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"homepage" text,
	"avatar_url" text NOT NULL,
	"language" text,
	"topics" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"open_issues" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"fork" boolean DEFAULT false NOT NULL,
	"license" text,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"github_created_at" timestamp with time zone NOT NULL,
	"github_updated_at" timestamp with time zone NOT NULL,
	"pushed_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_readmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"owner" text NOT NULL,
	"repo_name" text NOT NULL,
	"default_branch" text NOT NULL,
	"readme_path" text,
	"readme_url" text,
	"raw_readme_url" text,
	"content" text,
	"content_preview" text,
	"content_sha" text,
	"content_fetched_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"agent_skill_file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"repo_section_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_discovery_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"per_page" integer DEFAULT 20 NOT NULL,
	"max_variants_per_run" integer DEFAULT 12 NOT NULL,
	"min_search_remaining" integer DEFAULT 3 NOT NULL,
	"max_candidate_multiplier" integer DEFAULT 3 NOT NULL,
	"pages" jsonb DEFAULT '[1,2]'::jsonb NOT NULL,
	"pushed_within_days" jsonb DEFAULT '[7,30]'::jsonb NOT NULL,
	"created_within_days" jsonb DEFAULT '[30,90]'::jsonb NOT NULL,
	"star_ranges" jsonb DEFAULT '[{"min":1,"max":20},{"min":20,"max":100},{"min":100,"max":500}]'::jsonb NOT NULL,
	"auto_tune_queries_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "section_discovery_settings_section_unique" UNIQUE("section")
);
--> statement-breakpoint
CREATE TABLE "section_search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" text NOT NULL,
	"query" text NOT NULL,
	"type" text DEFAULT 'seed' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 10 NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"total_fetched" integer DEFAULT 0 NOT NULL,
	"total_candidates" integer DEFAULT 0 NOT NULL,
	"total_new" integer DEFAULT 0 NOT NULL,
	"total_accepted" integer DEFAULT 0 NOT NULL,
	"total_rejected" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_search_query_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_log_id" uuid,
	"section_search_query_id" uuid,
	"section" text NOT NULL,
	"query" text NOT NULL,
	"query_type" text DEFAULT 'db' NOT NULL,
	"total_fetched" integer DEFAULT 0 NOT NULL,
	"total_candidates" integer DEFAULT 0 NOT NULL,
	"total_new" integer DEFAULT 0 NOT NULL,
	"total_accepted" integer DEFAULT 0 NOT NULL,
	"total_rejected" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"submission_type" "submission_type" NOT NULL,
	"github_url" text NOT NULL,
	"owner" text,
	"repo" text,
	"file_path" text,
	"suggested_section" "repo_section" NOT NULL,
	"suggested_category_id" uuid,
	"suggested_subcategory_id" uuid,
	"reason" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_skill_files" ADD CONSTRAINT "agent_skill_files_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_files" ADD CONSTRAINT "agent_skill_files_repo_section_id_repo_sections_id_fk" FOREIGN KEY ("repo_section_id") REFERENCES "public"."repo_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_files" ADD CONSTRAINT "agent_skill_files_category_id_agent_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agent_skill_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_files" ADD CONSTRAINT "agent_skill_files_subcategory_id_agent_skill_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."agent_skill_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_subcategories" ADD CONSTRAINT "agent_skill_subcategories_category_id_agent_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agent_skill_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_repos" ADD CONSTRAINT "collection_repos_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_repos" ADD CONSTRAINT "collection_repos_repo_section_id_repo_sections_id_fk" FOREIGN KEY ("repo_section_id") REFERENCES "public"."repo_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_sections" ADD CONSTRAINT "repo_sections_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_readmes" ADD CONSTRAINT "repository_readmes_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_saves" ADD CONSTRAINT "agent_skill_saves_agent_skill_file_id_agent_skill_files_id_fk" FOREIGN KEY ("agent_skill_file_id") REFERENCES "public"."agent_skill_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_saves" ADD CONSTRAINT "repo_saves_repo_section_id_repo_sections_id_fk" FOREIGN KEY ("repo_section_id") REFERENCES "public"."repo_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_search_query_runs" ADD CONSTRAINT "section_search_query_runs_sync_log_id_sync_logs_id_fk" FOREIGN KEY ("sync_log_id") REFERENCES "public"."sync_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_search_query_runs" ADD CONSTRAINT "section_search_query_runs_section_search_query_id_section_search_queries_id_fk" FOREIGN KEY ("section_search_query_id") REFERENCES "public"."section_search_queries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_suggested_category_id_agent_skill_categories_id_fk" FOREIGN KEY ("suggested_category_id") REFERENCES "public"."agent_skill_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_suggested_subcategory_id_agent_skill_subcategories_id_fk" FOREIGN KEY ("suggested_subcategory_id") REFERENCES "public"."agent_skill_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_files_repo_section_path_unique" ON "agent_skill_files" USING btree ("repo_id","section","file_path");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_files_slug_unique" ON "agent_skill_files" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_skill_files_section_idx" ON "agent_skill_files" USING btree ("section");--> statement-breakpoint
CREATE INDEX "agent_skill_files_status_idx" ON "agent_skill_files" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_skill_files_category_idx" ON "agent_skill_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_skill_files_slug_idx" ON "agent_skill_files" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_skill_files_is_accepted_idx" ON "agent_skill_files" USING btree ("is_accepted");--> statement-breakpoint
CREATE INDEX "agent_skill_files_category_id_idx" ON "agent_skill_files" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_subcategory_id_idx" ON "agent_skill_files" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_section_status_idx" ON "agent_skill_files" USING btree ("section","status");--> statement-breakpoint
CREATE INDEX "agent_skill_files_section_accepted_idx" ON "agent_skill_files" USING btree ("section","is_accepted");--> statement-breakpoint
CREATE INDEX "agent_skill_files_section_category_id_idx" ON "agent_skill_files" USING btree ("section","category_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_section_subcategory_id_idx" ON "agent_skill_files" USING btree ("section","subcategory_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_category_subcategory_id_idx" ON "agent_skill_files" USING btree ("category_id","subcategory_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_repo_id_idx" ON "agent_skill_files" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "agent_skill_files_content_fetched_at_idx" ON "agent_skill_files" USING btree ("content_fetched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_categories_slug_unique" ON "agent_skill_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_skill_categories_name_idx" ON "agent_skill_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agent_skill_categories_sort_order_idx" ON "agent_skill_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_subcategories_category_slug_unique" ON "agent_skill_subcategories" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "agent_skill_subcategories_category_id_idx" ON "agent_skill_subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "agent_skill_subcategories_slug_idx" ON "agent_skill_subcategories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_skill_subcategories_name_idx" ON "agent_skill_subcategories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agent_skill_subcategories_sort_order_idx" ON "agent_skill_subcategories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_section_created_at_idx" ON "ai_usage_logs" USING btree ("section","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_feature_created_at_idx" ON "ai_usage_logs" USING btree ("feature","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_status_idx" ON "ai_usage_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_repos_collection_repo_unique" ON "collection_repos" USING btree ("collection_id","repo_section_id");--> statement-breakpoint
CREATE INDEX "collection_repos_collection_id_idx" ON "collection_repos" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_repos_repo_section_id_idx" ON "collection_repos" USING btree ("repo_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_user_title_unique" ON "collections" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_unique" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_unique" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_sections_repo_section_unique" ON "repo_sections" USING btree ("repo_id","section");--> statement-breakpoint
CREATE INDEX "repo_sections_section_status_idx" ON "repo_sections" USING btree ("section","status");--> statement-breakpoint
CREATE INDEX "repo_sections_section_score_idx" ON "repo_sections" USING btree ("section","score");--> statement-breakpoint
CREATE INDEX "repo_sections_section_accepted_idx" ON "repo_sections" USING btree ("section","is_accepted");--> statement-breakpoint
CREATE INDEX "repo_sections_repo_id_idx" ON "repo_sections" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "repo_sections_status_idx" ON "repo_sections" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_github_id_unique" ON "repositories" USING btree ("github_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_full_name_unique" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_owner_name_unique" ON "repositories" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "repositories_owner_name_idx" ON "repositories" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "repositories_stars_idx" ON "repositories" USING btree ("stars");--> statement-breakpoint
CREATE INDEX "repositories_github_created_at_idx" ON "repositories" USING btree ("github_created_at");--> statement-breakpoint
CREATE INDEX "repositories_github_updated_at_idx" ON "repositories" USING btree ("github_updated_at");--> statement-breakpoint
CREATE INDEX "repositories_pushed_at_idx" ON "repositories" USING btree ("pushed_at");--> statement-breakpoint
CREATE INDEX "repositories_language_idx" ON "repositories" USING btree ("language");--> statement-breakpoint
CREATE INDEX "repositories_archived_idx" ON "repositories" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "repositories_fork_idx" ON "repositories" USING btree ("fork");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_readmes_repo_id_unique" ON "repository_readmes" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "repository_readmes_repo_id_idx" ON "repository_readmes" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "repository_readmes_content_fetched_at_idx" ON "repository_readmes" USING btree ("content_fetched_at");--> statement-breakpoint
CREATE INDEX "repository_readmes_updated_at_idx" ON "repository_readmes" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_saves_user_skill_unique" ON "agent_skill_saves" USING btree ("user_id","agent_skill_file_id");--> statement-breakpoint
CREATE INDEX "agent_skill_saves_user_id_idx" ON "agent_skill_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_skill_saves_skill_id_idx" ON "agent_skill_saves" USING btree ("agent_skill_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_saves_user_repo_unique" ON "repo_saves" USING btree ("user_id","repo_section_id");--> statement-breakpoint
CREATE INDEX "repo_saves_user_id_idx" ON "repo_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "repo_saves_repo_section_id_idx" ON "repo_saves" USING btree ("repo_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "section_search_queries_section_query_idx" ON "section_search_queries" USING btree ("section","query");--> statement-breakpoint
CREATE INDEX "section_search_query_runs_sync_log_idx" ON "section_search_query_runs" USING btree ("sync_log_id");--> statement-breakpoint
CREATE INDEX "section_search_query_runs_section_created_at_idx" ON "section_search_query_runs" USING btree ("section","created_at");--> statement-breakpoint
CREATE INDEX "section_search_query_runs_section_query_idx" ON "section_search_query_runs" USING btree ("section","query");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_github_section_type_unique" ON "submissions" USING btree ("github_url","suggested_section","submission_type");--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_submission_type_idx" ON "submissions" USING btree ("submission_type");--> statement-breakpoint
CREATE INDEX "submissions_suggested_section_idx" ON "submissions" USING btree ("suggested_section");--> statement-breakpoint
CREATE INDEX "submissions_owner_repo_idx" ON "submissions" USING btree ("owner","repo");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "submissions_processed_at_idx" ON "submissions" USING btree ("processed_at");