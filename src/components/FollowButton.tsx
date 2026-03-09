"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowButton({ userId, initialFollowing, onToggle }: FollowButtonProps) {
  const { user } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!user || user.id === userId) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update follow");
        return;
      }
      setFollowing(json.data.following);
      onToggle?.(json.data.following);
      toast.success(json.data.following ? "Following!" : "Unfollowed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={handleToggle}
      disabled={loading}
    >
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
