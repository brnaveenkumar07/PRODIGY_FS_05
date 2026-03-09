"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import type { Post } from "@/lib/types";

interface FeedListProps {
  /** Optional initial posts (from SSR/RSC) */
  initialPosts?: Post[];
  /** Optional initial cursor for pagination */
  initialCursor?: string | null;
  /** API URL to fetch posts from */
  apiUrl?: string;
  /** Whether to show the composer at the top */
  showComposer?: boolean;
}

export function FeedList({
  initialPosts,
  initialCursor,
  apiUrl = "/api/posts",
  showComposer = true,
}: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor ?? null);
  const [loading, setLoading] = useState(!initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialized, setInitialized] = useState(!!initialPosts);

  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      try {
        const url = new URL(apiUrl, window.location.origin);
        if (cursor) url.searchParams.set("cursor", cursor);
        url.searchParams.set("limit", "10");

        const res = await fetch(url.toString());
        const json = await res.json();
        if (!res.ok) return;

        const newPosts: Post[] = json.data?.posts ?? [];
        if (cursor) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        setNextCursor(json.data?.nextCursor ?? null);
      } catch {
        // silently fail
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    if (!initialized) {
      setLoading(true);
      fetchPosts().finally(() => {
        setLoading(false);
        setInitialized(true);
      });
    }
  }, [initialized, fetchPosts]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(nextCursor);
    setLoadingMore(false);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showComposer && <Skeleton className="h-32 w-full rounded-xl" />}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showComposer && <PostComposer onPostCreated={handleNewPost} />}

      {posts.length === 0 && (
        <div className="rounded-xl border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No posts yet.{" "}
            {showComposer ? "Be the first to post!" : "Check back later."}
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={handleDelete} />
      ))}

      {nextCursor && (
        <div className="flex justify-center pb-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
