import type { ReviewFile, ReviewComment, ReviewReply, ActivityLog, CommentStatus, AuthToken } from "../types";

const API_BASE = 'http://localhost:8000/api/v1';

function getToken(): string | null {
  const session = localStorage.getItem('solarview_session');
  if (!session) return null;
  try {
    return JSON.parse(session).token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async register(username: string, email: string, password: string): Promise<AuthToken> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return handleResponse<AuthToken>(res);
  },

  async login(username: string, password: string): Promise<AuthToken> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<AuthToken>(res);
  },

  // ── Files ─────────────────────────────────────────────────────────────────
  async getFiles(): Promise<ReviewFile[]> {
    const res = await fetch(`${API_BASE}/files`, {
      headers: { ...authHeaders() },
    });
    return handleResponse<ReviewFile[]>(res);
  },

  async uploadFile(file: File, uploadedBy: string): Promise<ReviewFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', uploadedBy);
    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
    });
    return handleResponse<ReviewFile>(res);
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}`);
    }
  },

  // ── Comments ──────────────────────────────────────────────────────────────
  async getComments(fileId: string): Promise<ReviewComment[]> {
    const res = await fetch(
      `${API_BASE}/files/${fileId}/comments?sort_by=created_at&order=asc`,
      { headers: { ...authHeaders() } }
    );
    return handleResponse<ReviewComment[]>(res);
  },

  async createComment(
    fileId: string,
    data: { x_pct: number; y_pct: number; content: string; author: string; page?: number }
  ): Promise<ReviewComment> {
    const res = await fetch(`${API_BASE}/files/${fileId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        content: data.content,
        x_pct: data.x_pct,
        y_pct: data.y_pct,
        page: data.page ?? 1,
        author: data.author,
      }),
    });
    return handleResponse<ReviewComment>(res);
  },

  async updateCommentStatus(
    fileId: string,
    commentId: string,
    status: CommentStatus,
    actor: string
  ): Promise<ReviewComment> {
    const res = await fetch(
      `${API_BASE}/files/${fileId}/comments/${commentId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status, actor }),
      }
    );
    return handleResponse<ReviewComment>(res);
  },

  async addReply(
    fileId: string,
    commentId: string,
    content: string,
    author: string
  ): Promise<ReviewReply> {
    const res = await fetch(
      `${API_BASE}/files/${fileId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ content, author }),
      }
    );
    return handleResponse<ReviewReply>(res);
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  async getActivity(fileId: string): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/files/${fileId}/activity`, {
      headers: { ...authHeaders() },
    });
    return handleResponse<ActivityLog[]>(res);
  },
};
