"use client";

import { useEffect, useState } from "react";
import { Flame, Hash, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { PostCard } from "@/components/PostCard";
import { TagPill } from "@/components/TagPill";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post, TrendingTag } from "@/lib/types";

interface ExploreData {
  trendingPosts: Post[];
  trendingTags: TrendingTag[];
}

export default function ExplorePage() {
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => r.json())
      .then((json) => setData(json.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Explore</h1>
          <p className="text-muted-foreground text-sm mt-1">Trending posts and tags from the last 7 days</p>
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1 gap-2">
              <Flame className="h-4 w-4" /> Trending Posts
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex-1 gap-2">
              <Hash className="h-4 w-4" /> Trending Tags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
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
            ) : data?.trendingPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No trending posts yet. Check back later!
              </div>
            ) : (
              data?.trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>

          <TabsContent value="tags" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data?.trendingTags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No trending tags yet. Start tagging your posts!
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trending Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {data?.trendingTags.map((tag) => (
                      <div key={tag.name} className="flex items-center gap-2">
                        <TagPill name={tag.name} />
                        <Badge variant="outline" className="text-xs">
                          {tag.count} post{tag.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
