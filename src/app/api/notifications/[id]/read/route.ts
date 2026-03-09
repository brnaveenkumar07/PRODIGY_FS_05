import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const { id } = await params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return apiError("Notification not found", 404);
    if (notification.recipientId !== session.userId) return apiError("Forbidden", 403);

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return apiSuccess(updated);
  } catch {
    return apiError("Failed to mark as read", 500);
  }
}
