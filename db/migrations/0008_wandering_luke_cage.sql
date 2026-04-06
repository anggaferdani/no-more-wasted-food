ALTER TABLE "transactions" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "original_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "percentage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_code_unique" UNIQUE("code");