"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./UserAvatar";
import { timeAgo } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import type { Comment } from "@/lib/types";

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");

  const fetchComments = useCallback(async (cursor?: string) => {
    try {
      const url = `/api/posts/${postId}/comments${cursor ? `?cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        if (cursor) {
          setComments((prev) => [...prev, ...(json.data.comments ?? [])]);
        } else {
          setComments(json.data.comments ?? []);
        }
        setNextCursor(json.data.nextCursor);
      }
    } catch {}
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    fetchComments().finally(() => setLoading(false));
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) { toast.error("Sign in to comment"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (res.ok) {
        setComments((prev) => [json.data, ...prev]);
        setContent("");
        onCommentAdded?.();
      } else {
        toast.error(json.error ?? "Failed to post comment");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentDeleted?.();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Failed to delete comment");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="w-full space-y-4">
      {user && (
        <div className="flex gap-2">
          <UserAvatar name={user.name} size="sm" />
          <div className="flex-1 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
              }}
            />
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !content.trim()}>
              {submitting ? "Posting..." : "Comment"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <UserAvatar name={comment.author.name} image={comment.author.image} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                  {user?.id === comment.authorId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 ml-auto"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}

          {nextCursor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchComments(nextCursor)}
              className="w-full text-muted-foreground"
            >
              Load more comments
            </Button>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be first!</p>
          )}
        </div>
      )}
    </div>
  );
}
