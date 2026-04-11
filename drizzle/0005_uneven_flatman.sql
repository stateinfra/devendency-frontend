ALTER TABLE "User" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'WRITER'::text;--> statement-breakpoint
DROP TYPE "public"."Role";--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('WRITER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'WRITER'::"public"."Role";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DATA TYPE "public"."Role" USING "role"::"public"."Role";