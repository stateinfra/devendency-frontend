import { sql, and, eq, or, isNull } from "drizzle-orm";
import { posts } from "./schema";

export const publicPostWhere = and(
  eq(posts.published, true),
  or(
    isNull(posts.seriesId),
    sql`EXISTS (SELECT 1 FROM "Series" WHERE "Series"."id" = ${posts.seriesId} AND "Series"."visibility" = 'public')`,
  ),
);
