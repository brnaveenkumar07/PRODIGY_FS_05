"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "./UserAvatar";
import { TagPill } from "./TagPill";
import { CommentSection } from "./CommentSection";
import { timeAgo } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useSession();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Sign in to like posts");
      return;
    }
    const prev = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setLiked(prev);
        setLikeCount(prevCount);
        toast.error(json.error ?? "Failed to like post");
      } else {
        setLiked(json.data.liked);
        setLikeCount(json.data.count);
      }
    } catch {
      setLiked(prev);
      setLikeCount(prevCount);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        onDelete?.(post.id);
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Failed to delete post");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/u/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80">
            <UserAvatar name={post.author.name} image={post.author.image} size="sm" />
            <div>
              <p className="font-semibold text-sm leading-none">{post.author.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo(post.createdAt)}</p>
            </div>
          </Link>
          {user?.id === post.author.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

        {post.mediaUrl && post.mediaType === "image" && (
          <div className="relative overflow-hidden rounded-xl bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="block h-auto w-full"
            />
          </div>
        )}

        {post.mediaUrl && post.mediaType === "video" && (
          <video src={post.mediaUrl} controls className="w-full rounded-lg max-h-96" />
        )}

        {post.mediaUrl && post.mediaType === "file" && (
          <a
            href={post.mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 transition hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Open attachment</p>
              <p className="text-xs text-muted-foreground">View or download the attached file</p>
            </div>
          </a>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map(({ tag }) => (
              <TagPill key={tag.id} name={tag.name} />
            ))}
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="pt-3 flex flex-col gap-3">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${liked ? "text-red-500 hover:text-red-500" : ""}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span>{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </Button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
            onCommentDeleted={() => setCommentCount((c) => Math.max(0, c - 1))}
          />
        )}
      </CardFooter>
    </Card>
  );
}
