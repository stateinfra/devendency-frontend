"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import slugify from "slugify";

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "권한이 없습니다" };
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) {
    return { error: "카테고리 이름을 입력해주세요" };
  }

  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return { error: "이미 존재하는 카테고리입니다" };
  }

  await prisma.category.create({ data: { name, slug, description } });

  revalidatePath("/dashboard/categories");
  revalidatePath("/categories");
  return { success: true };
}
