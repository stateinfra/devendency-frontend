import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { CustomDomainSection } from "@/components/settings/custom-domain-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { username: true, name: true, bio: true, image: true, password: true, deletionScheduledAt: true, customDomain: true, domainVerified: true, role: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">설정</h1>
      <SettingsForm
        initialData={{
          username: user?.username || "",
          name: user?.name || "",
          bio: user?.bio || "",
          image: user?.image || null,
        }}
      />
      {user?.role === "SUPER_ADMIN" && (
        <CustomDomainSection
          currentDomain={user.customDomain ?? null}
          domainVerified={user.domainVerified ?? false}
        />
      )}
      <DeleteAccountSection
        deletionScheduledAt={user?.deletionScheduledAt?.toISOString() ?? null}
        hasPassword={!!user?.password}
      />
    </div>
  );
}
