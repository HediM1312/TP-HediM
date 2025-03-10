// Mettre à jour le fichier types.ts avec ces interfaces

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Tweet {
  id: string;
  content: string;
  author_id: string;
  author_username: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

export interface Comment {
  id: string;
  content: string;
  tweet_id: string;
  author_id: string;
  author_username: string;
  created_at: string;
}

export interface Like {
  id: string;
  tweet_id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender_username: string;
  type: 'like' | 'comment';
  tweet_id: string;
  tweet_content: string;
  comment_id?: string;
  comment_content?: string;
  read: boolean;
  created_at: string;
}