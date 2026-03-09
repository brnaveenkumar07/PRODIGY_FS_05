import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    // Trending posts: highest likes + comments in last 7 days
    const trendingPosts = await prisma.post.findMany({
      where: { createdAt: { gte: since } },
      take: 20,
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
        // Always include likes relation — empty array when no session
        likes: { where: { userId: session?.userId ?? "" }, select: { id: true } },
      },
    });

    // Trending tags: most used in last 7 days
    const tagCounts = await prisma.postTag.groupBy({
      by: ["tagId"],
      where: { post: { createdAt: { gte: since } } },
      _count: { tagId: true },
      orderBy: { _count: { tagId: "desc" } },
      take: 20,
    });

    const tagIds = tagCounts.map((t) => t.tagId);
    const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } } });
    const tagMap = Object.fromEntries(tags.map((t: { id: string; name: string }) => [t.id, t]));

    const trendingTags = tagCounts
      .map((tc) => ({ ...tagMap[tc.tagId], count: tc._count.tagId }))
      .filter((t) => t.name);

    return apiSuccess({
      trendingPosts: trendingPosts.map((p: { likes: { id: string }[] }) => ({
        ...p,
        likedByMe: session ? p.likes.length > 0 : false,
        likes: undefined,
      })),
      trendingTags,
    });
  } catch {
    return apiError("Failed to fetch explore data", 500);
  }
}

