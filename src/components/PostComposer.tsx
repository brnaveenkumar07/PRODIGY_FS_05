"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import type { Post } from "@/lib/types";

// Focused schema just for the form — tags managed in state
const composerSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(2000, "Post too long"),
});
type ComposerFormData = z.infer<typeof composerSchema>;

interface PostComposerProps {
  onPostCreated?: (post: Post) => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useSession();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<ComposerFormData>({
    resolver: zodResolver(composerSchema),
    defaultValues: { content: "" },
  });

  const content = watch("content", "");

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
          <a href="/login" className="hover:underline font-medium">Sign in</a> to share something.
        </CardContent>
      </Card>
    );
  }

  const addTag = () => {
    const normalized = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (normalized && !tags.includes(normalized) && tags.length < 10) {
      setTags([...tags, normalized]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    setMediaUrlInput("");
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleMediaUrlChange = (value: string) => {
    setMediaUrlInput(value);
    if (value.trim()) {
      setMediaFile(null);
      setMediaPreview(value.trim());
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaUrlInput("");
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (data: ComposerFormData) => {
    let mediaUrl: string | undefined;
    let mediaType: "image" | "video" | undefined;

    if (mediaUrlInput.trim()) {
      try {
        const parsed = new URL(mediaUrlInput.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          toast.error("Media URL must start with http or https");
          return;
        }
        mediaUrl = parsed.toString();
        mediaType = "image";
      } catch {
        toast.error("Enter a valid media URL");
        return;
      }
    } else if (mediaFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", mediaFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Upload failed"); setUploading(false); return; }
        mediaUrl = json.data.url;
        mediaType = json.data.mediaType;
      } catch {
        toast.error("Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content, tags, mediaUrl, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to post"); return; }
      toast.success("Posted!");
      reset();
      setTags([]);
      clearMedia();
      onPostCreated?.(json.data);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} size="sm" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            What&apos;s on your mind, {user.name.split(" ")[0]}?
          </CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3 pb-3">
          <Textarea
            {...register("content")}
            placeholder="Share something..."
            className="min-h-[80px] resize-none border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
          />
          {errors.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}

          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden border">
              {mediaFile ? (
                mediaFile.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="preview" className="max-h-48 w-auto object-cover" />
                ) : (
                  <video src={mediaPreview} className="max-h-48 w-full" controls />
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPreview} alt="preview" className="max-h-48 w-auto object-cover" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={clearMedia}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Tag input */}
          <div className="space-y-2">
            <Input
              value={mediaUrlInput}
              onChange={(e) => handleMediaUrlChange(e.target.value)}
              placeholder="Paste an image URL from the internet"
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use either an internet image URL or upload a local image/video file.
            </p>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag (press Enter)"
                className="h-7 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-7 text-xs">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                    #{tag} <X className="h-2.5 w-2.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="gap-2 text-muted-foreground"
          >
            <ImagePlus className="h-4 w-4" />
            Media
          </Button>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${content.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
              {content.length}/2000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || uploading || !content.trim()}
            >
              {(isSubmitting || uploading) && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              Post
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

