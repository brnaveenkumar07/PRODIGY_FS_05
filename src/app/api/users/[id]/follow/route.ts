import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const { id: followingId } = await params;
    if (followingId === session.userId) return apiError("Cannot follow yourself", 400);

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) return apiError("User not found", 404);

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.userId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return apiSuccess({ following: false });
    } else {
      await prisma.follow.create({
        data: { followerId: session.userId, followingId },
      });
      await prisma.notification.create({
        data: {
          type: "FOLLOW",
          recipientId: followingId,
          triggeredBy: session.userId,
        },
      });
      return apiSuccess({ following: true });
    }
  } catch {
    return apiError("Failed to toggle follow", 500);
  }
}
