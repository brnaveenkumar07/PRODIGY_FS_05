import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createCommentSchema, paginationSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";
import { commentRateLimit } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const parsed = paginationSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) return apiError("Invalid pagination", 400);
    const { cursor, limit } = parsed.data;

    const comments = await prisma.comment.findMany({
      where: { postId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    return apiSuccess({
      comments: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch {
    return apiError("Failed to fetch comments", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const limit = commentRateLimit(session.userId);
  if (!limit.success) return apiError("Too many requests", 429);

  try {
    const { id: postId } = await params;
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return apiError("Post not found", 404);

    const comment = await prisma.comment.create({
      data: {
        content: sanitizeText(parsed.data.content),
        authorId: session.userId,
        postId,
      },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    if (post.authorId !== session.userId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          recipientId: post.authorId,
          triggeredBy: session.userId,
          postId,
        },
      });
    }

    return apiSuccess(comment, 201);
  } catch {
    return apiError("Failed to create comment", 500);
  }
}
