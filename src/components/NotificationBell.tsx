"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data?.notifications ?? []);
        setUnreadCount(json.data?.unreadCount ?? 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      await fetch("/api/notifications", { method: "PUT" });
      setUnreadCount(0);
    }
  };

  const notificationText = (n: Notification) => {
    const name = n.triggerer?.name ?? "Someone";
    switch (n.type) {
      case "LIKE": return `${name} liked your post`;
      case "COMMENT": return `${name} commented on your post`;
      case "FOLLOW": return `${name} followed you`;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Link href="/notifications" className="text-xs text-muted-foreground hover:underline">
            See all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className={`flex flex-col items-start gap-1 ${!n.read ? "bg-accent/40" : ""}`}>
              <span className="text-sm">{notificationText(n)}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
