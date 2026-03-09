import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const { searchParams } = new URL(req.url);
    const parsed = paginationSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) return apiError("Invalid pagination", 400);
    const { cursor, limit } = parsed.data;

    const notifications = await prisma.notification.findMany({
      where: { recipientId: session.userId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        triggerer: { select: { id: true, name: true, image: true } },
        post: { select: { id: true, content: true } },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: session.userId, read: false },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return apiSuccess({
      notifications: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      unreadCount,
    });
  } catch {
    return apiError("Failed to fetch notifications", 500);
  }
}

export async function PUT() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    await prisma.notification.updateMany({
      where: { recipientId: session.userId, read: false },
      data: { read: true },
    });
    return apiSuccess({ message: "All notifications marked as read" });
  } catch {
    return apiError("Failed to mark notifications as read", 500);
  }
}
