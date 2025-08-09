export interface ThreadComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  avatar?: string;
  upvotes: number;
  downvotes: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

export interface Answer {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  comments: ThreadComment[];
  avatar?: string;
  badge?: string;
  isAccepted?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  answers: Answer[];
  tags: string[];
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  avatar?: string;
  isPinned?: boolean;
  isSolved?: boolean;
  views?: number;
  badge?: string;
}
