import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { createSession, setSessionCookie } from "@/lib/auth";
import { apiSuccess, apiError, getClientIp } from "@/lib/utils";
import { authRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = authRateLimit(ip);
  if (!limit.success) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return apiError("Invalid email or password.", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return apiError("Invalid email or password.", 401);
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setSessionCookie(token);

    return apiSuccess({ id: user.id, name: user.name, email: user.email });
  } catch {
    return apiError("Something went wrong. Please try again.", 500);
  }
}
