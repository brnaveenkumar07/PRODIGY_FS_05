import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session?.userId ?? "" }, select: { id: true } },
      },
    });

    if (!post) return apiError("Post not found", 404);

    return apiSuccess({
      ...post,
      likedByMe: session ? post.likes.length > 0 : false,
      likes: undefined,
    });
  } catch {
    return apiError("Failed to fetch post", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return apiError("Post not found", 404);
    if (post.authorId !== session.userId) return apiError("Forbidden", 403);

    await prisma.post.delete({ where: { id } });
    revalidatePath("/");
    return apiSuccess({ message: "Post deleted" });
  } catch {
    return apiError("Failed to delete post", 500);
  }
}
