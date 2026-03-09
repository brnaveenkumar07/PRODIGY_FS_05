"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  profile: {
    bio: string | null;
    website: string | null;
    location: string | null;
  } | null;
}

export default function SettingsProfilePage() {
  const { user, refetch } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProfileData(json.data);
          reset({
            name: json.data.name,
            bio: json.data.profile?.bio ?? "",
            website: json.data.profile?.website ?? "",
            location: json.data.profile?.location ?? "",
          });
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileInput) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Update failed"); return; }
      setProfileData(json.data);
      reset({
        name: json.data.name,
        bio: json.data.profile?.bio ?? "",
        website: json.data.profile?.website ?? "",
        location: json.data.profile?.location ?? "",
      });
      await refetch();
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Update your public profile information
          </p>
        </div>

        <Separator />

        {/* Avatar preview */}
        {profileData && (
          <div className="flex items-center gap-4">
            <UserAvatar name={profileData.name} image={profileData.image} size="lg" />
            <div>
              <p className="font-semibold">{profileData.name}</p>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Profile photo via avatar initials
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public Profile</CardTitle>
            <CardDescription>This information will be visible to all users.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" {...register("name")} placeholder="Your name" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...register("bio")}
                  placeholder="Tell people about yourself..."
                  className="min-h-[80px] resize-none"
                />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://yoursite.com"
                />
                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="San Francisco, CA"
                />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
