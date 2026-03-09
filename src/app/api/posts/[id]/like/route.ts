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
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return apiError("Post not found", 404);

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.userId, postId } },
    });

    if (existing) {
      // Unlike
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId } });
      return apiSuccess({ liked: false, count });
    } else {
      // Like
      await prisma.like.create({ data: { userId: session.userId, postId } });

      // Create notification if liking someone else's post
      if (post.authorId !== session.userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            recipientId: post.authorId,
            triggeredBy: session.userId,
            postId,
          },
        });
      }

      const count = await prisma.like.count({ where: { postId } });
      return apiSuccess({ liked: true, count });
    }
  } catch {
    return apiError("Failed to toggle like", 500);
  }
}
