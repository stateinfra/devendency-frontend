import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminPanel } from "@/components/admin/admin-panel";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">관리자</h1>
      <AdminPanel isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
