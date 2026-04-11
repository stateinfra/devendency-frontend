CREATE TYPE "public"."ReportStatus" AS ENUM('PENDING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."ReportType" AS ENUM('POST', 'COMMENT');--> statement-breakpoint
CREATE TABLE "Report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "ReportType" NOT NULL,
	"targetId" uuid NOT NULL,
	"reason" text NOT NULL,
	"reporterId" uuid NOT NULL,
	"status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SpamFilter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_User_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;