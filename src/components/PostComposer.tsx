"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, ImagePlus, Loader2, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FILE_INPUT_ACCEPT,
  MAX_UPLOAD_SIZE,
  buildFilename,
  detectMediaType,
  getUploadValidationError,
  type MediaType,
} from "@/lib/media";

const composerSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(2000, "Post too long"),
});

type ComposerFormData = z.infer<typeof composerSchema>;

interface PostComposerProps {
  onPostCreated?: (post: Post) => void;
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useSession();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ComposerFormData>({
    resolver: zodResolver(composerSchema),
    defaultValues: { content: "" },
  });

  const content = useWatch({ control, name: "content", defaultValue: "" });

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

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

  const setSelectedFile = (file: File | null) => {
    if (!file) return;

    const validationError = getUploadValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    setSelectedFile(file ?? null);
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setIsDragging(false);
    setInputKey((value) => value + 1);
  };

  const uploadMedia = async (file: File): Promise<{ url: string; mediaType: MediaType }> => {
    const mediaType = detectMediaType(file);
    const pathname = buildFilename(user.id, file.name, mediaType);

    if (process.env.NODE_ENV === "production") {
      const blob = await upload(pathname, file, {
        access: "public",
        contentType: file.type || undefined,
        handleUploadUrl: "/api/upload",
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(percentage));
        },
      });

      return { url: blob.url, mediaType };
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error ?? "Upload failed");
    }

    return {
      url: json.data.url as string,
      mediaType: json.data.mediaType as MediaType,
    };
  };

  const onSubmit = async (data: ComposerFormData) => {
    let mediaUrl: string | undefined;
    let mediaType: MediaType | undefined;

    if (mediaFile) {
      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadResult = await uploadMedia(mediaFile);
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.mediaType;
        setUploadProgress(100);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
        setUploading(false);
        setUploadProgress(0);
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
      if (!res.ok) {
        toast.error(json.error ?? "Failed to post");
        return;
      }

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

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Add media</p>
                <p className="text-xs leading-5 text-slate-500">
                  Upload images, videos, audio, or documents from your device.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50"
              >
                Select file
              </Button>
            </div>

            {!mediaPreview && (
              <div
                className={cn(
                  "mt-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition",
                  isDragging
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50"
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (e.currentTarget === e.target) {
                    setIsDragging(false);
                  }
                }}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {isDragging ? "Release to upload" : "Drag and drop a file here"}
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  Or click to browse. Supports common media and document formats up to 100MB.
                </p>
              </div>
            )}

            {mediaPreview && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900">Selected media</p>
                    <p className="truncate text-xs text-slate-500">
                      {mediaFile?.name ?? "Selected media"}
                      {mediaFile ? ` • ${formatBytes(mediaFile.size)}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    onClick={clearMedia}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {mediaFile?.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="preview" className="block h-auto w-full" />
                ) : mediaFile?.type.startsWith("video/") ? (
                  <video src={mediaPreview} className="max-h-72 w-full bg-black object-contain" controls />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{mediaFile?.name}</p>
                      <p className="text-xs text-slate-500">Attached file</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploading && mediaFile && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-700">Uploading media</p>
                  <p className="text-xs text-slate-500">{uploadProgress}%</p>
                </div>
                <Progress
                  value={uploadProgress}
                  className="h-2 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-slate-900"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Tags
            </p>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag (press Enter)"
                className="h-9 rounded-xl border-slate-300 bg-white text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-9 rounded-xl px-4 text-sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <input
            key={inputKey}
            ref={fileRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <div className="text-xs text-muted-foreground">
            Images, video, audio, and documents up to {Math.round(MAX_UPLOAD_SIZE / (1024 * 1024))}MB
          </div>
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
