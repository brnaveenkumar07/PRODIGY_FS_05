// Shared TypeScript types used across client components

export interface Author {
  id: string;
  name: string;
  image: string | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  tags: { tag: Tag }[];
  _count: { likes: number; comments: number };
  likedByMe: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  author: Author;
}

export interface Profile {
  bio: string | null;
  website: string | null;
  location: string | null;
}

/** Full user profile returned by /api/users/[id] */
export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  profile: Profile | null;
  isFollowing: boolean;
  followedByMe: boolean;
  _count: { posts: number; followers: number; following: number };
}

export interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  read: boolean;
  createdAt: string;
  postId: string | null;
  post: { id: string; content: string } | null;
  triggerer: Author | null;
}

export interface TrendingTag {
  id: string;
  name: string;
  count: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
