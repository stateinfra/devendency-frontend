import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, image: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">설정</h1>
      <SettingsForm
        initialData={{
          name: user?.name || "",
          bio: user?.bio || "",
        }}
      />
    </div>
  );
}
