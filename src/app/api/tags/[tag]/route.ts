import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const session = await getSession();
    const { searchParams } = new URL(req.url);

    const pagination = paginationSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!pagination.success) return apiError("Invalid pagination", 400);
    const { cursor, limit } = pagination.data;

    const tagRecord = await prisma.tag.findUnique({ where: { name: tag.toLowerCase() } });
    if (!tagRecord) return apiSuccess({ posts: [], nextCursor: null, tag: tag.toLowerCase() });

    const posts = await prisma.post.findMany({
      where: { tags: { some: { tagId: tagRecord.id } } },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session?.userId ?? "" }, select: { id: true } },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return apiSuccess({
      tag: tag.toLowerCase(),
      posts: items.map((p: { likes: { id: string }[] }) => ({
        ...p,
        likedByMe: session ? p.likes.length > 0 : false,
        likes: undefined,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch {
    return apiError("Failed to fetch tag posts", 500);
  }
}
