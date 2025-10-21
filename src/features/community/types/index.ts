export interface Author {
  id: number;
  user_name: string;
  profile_pic_url?: string;
  role?: string;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Thread {
  id: number;
  title: string;
  body: string;
  author: Author;
  client?: number;
  tags: string[];
  created_at: string;
  updated_at?: string;
  upvotes: number;
  downvotes: number;
  bookmarks_count?: number;
  comments_count?: number;
}

export type CreateThread = {
  title: string;
  body: string;
  tags: number[]; // Changed to number[] to support array of tag IDs
};

export type CreateComment = {
  parent: number | null;
  body: string;
};

export type AddVote = {
  threadId: number;
  vote_type: VoteType;
};

export enum VoteType {
  Upvote = "upvote",
  Downvote = "downvote",
}

export interface Comment {
  id: number;
  thread: number;
  author: {
    id: number;
    user_name: string;
    profile_pic_url?: string;
    role?: string;
    name?: string;
  };
  parent: number | null;
  body: string;
  created_at: string;
  updated_at?: string;
  upvotes: number;
  downvotes: number;
  replies: Comment[]; // Changed from number[] to Comment[] for actual nested data
}
