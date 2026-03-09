import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, image: true, profile: true },
    });
    if (!user) return apiError("User not found", 404);
    return apiSuccess(user);
  } catch {
    return apiError("Failed to fetch profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

    const { name, bio, website, location } = parsed.data;
    const sanitizedWebsite = website ? sanitizeUrl(website) : undefined;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = sanitizeText(name);

    const profileUpdates: Record<string, unknown> = {};
    if (bio !== undefined) profileUpdates.bio = sanitizeText(bio);
    if (website !== undefined) profileUpdates.website = sanitizedWebsite ?? "";
    if (location !== undefined) profileUpdates.location = sanitizeText(location);

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...updates,
        profile: {
          upsert: {
            create: profileUpdates,
            update: profileUpdates,
          },
        },
      },
      select: { id: true, name: true, email: true, image: true, profile: true },
    });

    return apiSuccess(user);
  } catch {
    return apiError("Failed to update profile", 500);
  }
}
