ALTER TABLE "User" ADD COLUMN "customDomain" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "domainVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_customDomain_unique" UNIQUE("customDomain");