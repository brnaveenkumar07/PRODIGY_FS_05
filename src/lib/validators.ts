import { z } from "zod";

// Auth validators
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile validators
export const profileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().max(100, "Location too long").optional(),
});

// Post validators
export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(2000, "Post too long"),
  tags: z.array(z.string().min(1).max(50)).max(10, "Too many tags").optional().default([]),
  mediaUrl: z
    .union([
      z.string().url().refine((value) => /^https?:\/\//.test(value), "Media URL must start with http or https"),
      z.string().regex(/^\/uploads\/.+/, "Invalid media path"),
    ])
    .optional(),
  mediaType: z.enum(["image", "video"]).optional(),
});

// Comment validators
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

// Pagination
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// Tag
export const tagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Tags can only contain letters, numbers, underscores, and hyphens"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
