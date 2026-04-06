CREATE TYPE "public"."role" AS ENUM('admin', 'merchant', 'user');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
