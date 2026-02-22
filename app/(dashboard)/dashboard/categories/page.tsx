import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/category/category-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "카테고리 관리",
};

export default async function DashboardCategoriesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">카테고리 관리</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
