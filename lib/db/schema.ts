import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Enums ──
export const roleEnum = pgEnum("Role", [
  "WRITER",
  "ADMIN",
]);

// ── User ──
export const users = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").unique(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: roleEnum("role").default("WRITER").notNull(),
  suspended: boolean("suspended").default(false).notNull(),
  bio: text("bio"),
  github: text("github"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  deletionScheduledAt: timestamp("deletionScheduledAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

// ── Account ──
export const accounts = pgTable(
  "Account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("Account_provider_providerAccountId_key").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

// ── Session ──
export const sessions = pgTable("Session", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ── VerificationToken ──
export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("VerificationToken_identifier_token_key").on(
      table.identifier,
      table.token,
    ),
  ],
);

// ── Post ──
export const posts = pgTable(
  "Post",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: varchar("excerpt", { length: 300 }),
    coverImage: text("coverImage"),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("publishedAt", { mode: "date" }),
    authorId: uuid("authorId")
      .notNull()
      .references(() => users.id),
    seriesId: uuid("seriesId").references(() => series.id, { onDelete: "set null" }),
    seriesOrder: integer("seriesOrder"),
    isAnnouncement: boolean("isAnnouncement").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("Post_published_publishedAt_idx").on(
      table.published,
      table.publishedAt,
    ),
    index("Post_authorId_idx").on(table.authorId),
    index("Post_seriesId_idx").on(table.seriesId),
  ],
);

// ── Tag ──
export const tags = pgTable("Tag", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// ── PostTag (composite PK) ──
export const postTags = pgTable(
  "PostTag",
  {
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

// ── Comment ──
export const comments = pgTable(
  "Comment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("authorId")
      .notNull()
      .references(() => users.id),
    parentId: uuid("parentId"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("Comment_postId_idx").on(table.postId),
    index("Comment_authorId_idx").on(table.authorId),
  ],
);

// ── Follow (composite PK) ──
export const follows = pgTable(
  "Follow",
  {
    followerId: uuid("followerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("followingId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.followerId, table.followingId] })],
);

// ── Series ──
export const series = pgTable(
  "Series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    visibility: text("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("public"),
    authorId: uuid("authorId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("Series_authorId_idx").on(table.authorId)],
);

// ── Like (composite PK) ──
export const likes = pgTable(
  "Like",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })],
);

// ── PostLink (wiki-style backlinks) ──
export const postLinks = pgTable(
  "PostLink",
  {
    fromPostId: uuid("fromPostId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    toSlug: text("toSlug").notNull(),
    toPostId: uuid("toPostId").references(() => posts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.fromPostId, table.toSlug] }),
    index("PostLink_toPostId_idx").on(table.toPostId),
    index("PostLink_toSlug_idx").on(table.toSlug),
  ],
);

// ── Report ──
export const reportTypeEnum = pgEnum("ReportType", ["POST", "COMMENT"]);
export const reportStatusEnum = pgEnum("ReportStatus", ["PENDING", "RESOLVED", "DISMISSED"]);

export const reports = pgTable("Report", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: reportTypeEnum("type").notNull(),
  targetId: uuid("targetId").notNull(),
  reason: text("reason").notNull(),
  reporterId: uuid("reporterId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: reportStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// ── Spam Filter ──
export const spamFilters = pgTable("SpamFilter", {
  id: uuid("id").defaultRandom().primaryKey(),
  pattern: text("pattern").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});
