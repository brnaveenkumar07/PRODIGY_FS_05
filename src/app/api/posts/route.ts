import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPostSchema, paginationSchema } from "@/lib/validators";
import { apiSuccess, apiError } from "@/lib/utils";
import { postRateLimit } from "@/lib/rateLimit";
import { sanitizeText, normalizeTag } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = paginationSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) return apiError("Invalid pagination params", 400);

    const { cursor, limit } = parsed.data;
    const session = await getSession();

    const posts = await prisma.post.findMany({
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
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return apiSuccess({
      posts: items.map((p: { likes: { id: string }[] }) => ({
        ...p,
        likedByMe: session ? p.likes.length > 0 : false,
        likes: undefined,
      })),
      nextCursor,
    });
  } catch {
    return apiError("Failed to fetch posts", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const limit = postRateLimit(session.userId);
  if (!limit.success) return apiError("Too many requests", 429);

  try {
    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

    const { content, tags = [], mediaUrl, mediaType } = parsed.data;
    const sanitizedContent = sanitizeText(content);
    const normalizedTags = [...new Set(tags.map(normalizeTag).filter(Boolean))];

    const post = await prisma.post.create({
      data: {
        content: sanitizedContent,
        mediaUrl,
        mediaType,
        authorId: session.userId,
        tags: {
          create: await Promise.all(
            normalizedTags.map(async (name) => {
              const tag = await prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
              });
              return { tag: { connect: { id: tag.id } } };
            })
          ),
        },
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    revalidatePath("/");
    return apiSuccess({ ...post, likedByMe: false }, 201);
  } catch {
    return apiError("Failed to create post", 500);
  }
}
