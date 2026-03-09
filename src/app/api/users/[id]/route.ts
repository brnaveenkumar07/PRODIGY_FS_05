import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        profile: true,
        _count: {
          select: { posts: true, followers: true, following: true },
        },
      },
    });

    if (!user) return apiError("User not found", 404);

    let isFollowing = false;
    if (session && session.userId !== id) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.userId, followingId: id } },
      });
      isFollowing = !!follow;
    }

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });
    const { cursor, limit } = pagination.success
      ? pagination.data
      : { cursor: undefined, limit: 20 };

    const posts = await prisma.post.findMany({
      where: { authorId: id },
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
      user: { ...user, isFollowing, followedByMe: isFollowing },
      posts: items.map((p: { likes: { id: string }[] }) => ({
        ...p,
        likedByMe: session ? p.likes.length > 0 : false,
        likes: undefined,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch {
    return apiError("Failed to fetch user", 500);
  }
}
