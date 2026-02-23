import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    // JWT 전략이므로 sessions 테이블은 사용되지 않으나,
    // 기존 Prisma DB의 PK(id)와 어댑터가 기대하는 PK(sessionToken)가 달라 타입 단언 필요
    sessionsTable: sessions as never,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  ...authConfig,
  events: {
    async createUser({ user }) {
      const base =
        (user.name || user.email?.split("@")[0] || "user")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .slice(0, 15) || "user";

      let username = base;
      let suffix = 1;
      while (true) {
        const existing = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        if (!existing) break;
        username = `${base}${suffix}`;
        suffix++;
      }

      await db
        .update(users)
        .set({ username, updatedAt: new Date() })
        .where(eq(users.id, user.id!));
    },
  },
});
