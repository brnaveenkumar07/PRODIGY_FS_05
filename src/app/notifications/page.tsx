"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { timeAgo } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import type { Notification } from "@/lib/types";

const NotificationText = ({ n }: { n: Notification }) => {
  const name = n.triggerer?.name ?? "Someone";
  switch (n.type) {
    case "LIKE":   return <><span className="font-semibold">{name}</span> liked your post</>;
    case "COMMENT":return <><span className="font-semibold">{name}</span> commented on your post</>;
    case "FOLLOW": return <><span className="font-semibold">{name}</span> followed you</>;
  }
};

export default function NotificationsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (cursor?: string | null) => {
    try {
      const url = new URL("/api/notifications", window.location.origin);
      url.searchParams.set("limit", "20");
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok) return;
      if (cursor) {
        setNotifications((prev) => [...prev, ...(json.data.notifications ?? [])]);
      } else {
        setNotifications(json.data.notifications ?? []);
      }
      setNextCursor(json.data.nextCursor ?? null);
      setUnreadCount(json.data.unreadCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!sessionLoading && user) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [user, sessionLoading, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  if (!sessionLoading && !user) {
    return (
      <MainLayout>
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>Please <Link href="/login" className="text-primary hover:underline font-medium">sign in</Link> to see notifications.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No notifications yet.</p>
            <p className="text-xs mt-1">Interactions on your posts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.read) markOneRead(n.id); }}
                className={`w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/50 ${!n.read ? "bg-accent/30" : ""}`}
              >
                <UserAvatar
                  name={n.triggerer?.name ?? "?"}
                  image={n.triggerer?.image}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <NotificationText n={n} />
                  </p>
                  {n.postId && (
                    <Link
                      href={`#`}
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View post
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Badge className="h-2 w-2 rounded-full p-0 shrink-0 mt-1.5" />
                )}
              </button>
            ))}

            {nextCursor && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    await fetchNotifications(nextCursor);
                    setLoadingMore(false);
                  }}
                >
                  {loadingMore && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
