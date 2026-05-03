// Matches backend FileOut schema exactly
export interface ReviewFile {
  id: string;
  name: string;               // server-side stored filename (uuid + ext)
  original_name: string;      // original upload filename
  file_type: string;          // "pdf" | "image"
  mime_type: string;
  size_bytes: number;
  page_count: number;
  width_px: number | null;
  height_px: number | null;
  uploaded_by: string;
  uploaded_at: string;
}

export type CommentStatus = 'open' | 'pending' | 'resolved';

// Matches backend CommentOut schema exactly
export interface ReviewComment {
  id: string;
  file_id: string;
  content: string;
  x_pct: number;
  y_pct: number;
  page: number;
  status: CommentStatus;
  author: string;
  created_at: string;
  updated_at: string;
  threads: ReviewReply[];
}

// Matches backend ThreadOut schema exactly
export interface ReviewReply {
  id: string;
  parent_comment_id: string;
  content: string;
  author: string;
  created_at: string;
}

// Matches backend ActivityOut schema exactly
export interface ActivityLog {
  id: string;
  file_id: string;
  comment_id: string | null;
  action: string;
  actor: string;
  meta: Record<string, any>;
  created_at: string;
}

// Auth types
export interface AuthToken {
  access_token: string;
  token_type: string;
  username: string;
  email: string;
}

export interface CurrentUser {
  username: string;
  email: string;
  token: string;
}
