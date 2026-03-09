import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const { id } = await params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return apiError("Comment not found", 404);
    if (comment.authorId !== session.userId) return apiError("Forbidden", 403);

    await prisma.comment.delete({ where: { id } });
    return apiSuccess({ message: "Comment deleted" });
  } catch {
    return apiError("Failed to delete comment", 500);
  }
}
