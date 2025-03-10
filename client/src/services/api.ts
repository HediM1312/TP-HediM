import axios from 'axios';
import { Tweet, User, Like, Comment } from '@/types';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      // S'assurer que le token est correctement formaté avec Bearer
      config.headers.Authorization = `Bearer ${token}`;
      // Déboguer les en-têtes
      console.log('En-têtes de requête:', config.headers);
    } else {
      console.warn('Aucun token trouvé dans localStorage');
    }
  }
  return config;
});

export const loginUser = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await axios.post(`${API_URL}/token`, formData);
  return response.data;
};

export const registerUser = async (username: string, email: string, password: string) => {
  const response = await api.post('/users', { username, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get<User>('/users/me');
  return response.data;
};

export const createTweet = async (content: string) => {
  const response = await api.post<Tweet>('/tweets', { content });
  return response.data;
};

export const getTweets = async () => {
  const response = await api.get<Tweet[]>('/tweets');
  return response.data;
};

export const getUserTweets = async (username: string) => {
  const response = await api.get<Tweet[]>(`/users/${username}/tweets`);
  return response.data;
};

export const createComment = async (tweetId: string, content: string) => {
  const response = await api.post<Comment>('/comments', {
    tweet_id: tweetId,
    content
  });
  return response.data;
};

export const getTweetComments = async (tweetId: string) => {
  const response = await api.get<Comment[]>(`/tweets/${tweetId}/comments`);
  return response.data;
};

// Fonctions pour les likes
export const likeTweet = async (tweetId: string) => {
  const response = await api.post<Like>(`/tweets/${tweetId}/like`);
  return response.data;
};

export const unlikeTweet = async (tweetId: string) => {
  const response = await api.delete(`/tweets/${tweetId}/unlike`);
  return response.data;
};

export const checkLikeStatus = async (tweetId: string) => {
  const response = await api.get<{ liked: boolean }>(`/tweets/${tweetId}/like_status`);
  return response.data;
};

export const getTweetLikes = async (tweetId: string) => {
  const response = await api.get<Like[]>(`/tweets/${tweetId}/likes`);
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get<Notification[]>('/notifications');
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await api.get<{ count: number }>('/notifications/count');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const getTweetById = async (tweetId: string) => {
  const response = await api.get<Tweet>(`/tweets/${tweetId}`);
  return response.data;
};