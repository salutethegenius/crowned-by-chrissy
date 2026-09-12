"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createOwnerSession, clearOwnerSession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function loginAction(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] || "local";
  const limited = await rateLimit(`login:${ip}`, 10);
  if (!limited.ok) redirect("/owner/login?error=rate");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const owner = await prisma.owner.findUnique({ where: { email } });
  if (!owner || !(await verifyPassword(password, owner.passwordHash))) {
    redirect("/owner/login?error=auth");
  }
  await createOwnerSession(owner.id);
  const next = String(formData.get("next") || "/owner");
  redirect(next.startsWith("/owner") ? next : "/owner");
}

export async function logoutAction() {
  await clearOwnerSession();
  redirect("/owner/login");
}
