export interface Author {
  id: number;
  user_name: string;
  profile_pic_url?: string;
  role?: string;
}

export interface Author {
  id: number;
  user_name: string;
  profile_pic_url?: string;
  role?: string;
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
  tags: string[];
};

export type CreateComment = {
  parent: number;
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
