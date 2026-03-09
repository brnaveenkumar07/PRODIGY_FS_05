import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { createSession, setSessionCookie } from "@/lib/auth";
import { apiSuccess, apiError, getClientIp } from "@/lib/utils";
import { authRateLimit } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = authRateLimit(ip);
  if (!limit.success) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const { name, email, password } = parsed.data;
    const sanitizedName = sanitizeText(name);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return apiError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: email.toLowerCase(),
        passwordHash,
        profile: { create: {} },
      },
    });

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setSessionCookie(token);

    return apiSuccess({ id: user.id, name: user.name, email: user.email }, 201);
  } catch {
    return apiError("Something went wrong. Please try again.", 500);
  }
}
