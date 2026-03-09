"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Hash, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/lib/types";

export default function TagPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      try {
        const url = new URL(`/api/tags/${encodeURIComponent(tag)}`, window.location.origin);
        url.searchParams.set("limit", "10");
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url.toString());
        const json = await res.json();
        if (!res.ok) return;
        if (cursor) {
          setPosts((prev) => [...prev, ...(json.data.posts ?? [])]);
        } else {
          setPosts(json.data.posts ?? []);
        }
        setNextCursor(json.data.nextCursor ?? null);
      } catch {}
    },
    [tag]
  );

  useEffect(() => {
    setLoading(true);
    fetchPosts().finally(() => setLoading(false));
  }, [fetchPosts]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">#{tag}</h1>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {posts.length > 0
                  ? `${posts.length}+ posts`
                  : "No posts yet"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No posts tagged with #{tag} yet.</p>
              <p className="text-xs mt-1">Be the first to use this tag!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {nextCursor && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingMore}
                    onClick={async () => {
                      setLoadingMore(true);
                      await fetchPosts(nextCursor);
                      setLoadingMore(false);
                    }}
                  >
                    {loadingMore && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
