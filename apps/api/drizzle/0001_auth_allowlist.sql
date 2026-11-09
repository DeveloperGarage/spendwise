CREATE TABLE "allowed_emails" (
	"email" text PRIMARY KEY NOT NULL,
	"suggested_display_name" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed_at" timestamp with time zone;