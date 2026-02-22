import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  events: {
    async createUser({ user }) {
      const base = (user.name || user.email?.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 15) || "user";

      let username = base;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${suffix}`;
        suffix++;
      }

      await prisma.user.update({
        where: { id: user.id! },
        data: { username },
      });
    },
  },
});
