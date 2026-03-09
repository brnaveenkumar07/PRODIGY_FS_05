"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Globe, CalendarDays, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Post, UserProfile } from "@/lib/types";

interface UserPageData {
  user: UserProfile;
  posts: Post[];
  nextCursor: string | null;
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<UserPageData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUser = useCallback(
    async (cursor?: string | null) => {
      try {
        const url = new URL(`/api/users/${params.id}`, window.location.origin);
        url.searchParams.set("limit", "10");
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url.toString());
        if (!res.ok) { setError(true); return; }
        const json = await res.json();
        if (cursor && data) {
          setData((prev) =>
            prev
              ? { ...prev, posts: [...prev.posts, ...(json.data.posts ?? [])], nextCursor: json.data.nextCursor }
              : json.data
          );
        } else {
          setData(json.data);
        }
      } catch {
        setError(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.id]
  );

  useEffect(() => {
    setLoading(true);
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Separator />
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">User not found</p>
          <p className="text-sm mt-1">This account may have been removed or doesn&apos;t exist.</p>
        </div>
      </MainLayout>
    );
  }

  const { user, posts, nextCursor } = data;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Profile header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <UserAvatar name={user.name} image={user.image} size="lg" />
              <div>
                <h1 className="text-xl font-bold">{user.name}</h1>
                {user.profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{user.profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  {user.profile?.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {user.profile.location}
                    </span>
                  )}
                  {user.profile?.website && (
                    <a
                      href={user.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" /> {user.profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            <FollowButton
              userId={user.id}
              initialFollowing={user.followedByMe}
              onToggle={(following) =>
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        user: {
                          ...prev.user,
                          followedByMe: following,
                          _count: {
                            ...prev.user._count,
                            followers: following
                              ? prev.user._count.followers + 1
                              : prev.user._count.followers - 1,
                          },
                        },
                      }
                    : prev
                )
              }
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span><strong>{user._count.posts}</strong> <span className="text-muted-foreground">posts</span></span>
            <span><strong>{user._count.followers}</strong> <span className="text-muted-foreground">followers</span></span>
            <span><strong>{user._count.following}</strong> <span className="text-muted-foreground">following</span></span>
          </div>
        </div>

        <Separator />

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Posts</h2>

          {posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No posts yet.
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
                      await fetchUser(nextCursor);
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
