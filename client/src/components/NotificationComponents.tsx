import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '@/types';
import { getNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/api';
import Link from 'next/link';

// Composant pour l'icône de notification avec badge
export const NotificationBell: React.FC = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Charger le nombre de notifications non lues
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const data = await getUnreadNotificationsCount();
        setNotificationCount(data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    
    // Actualiser le compteur toutes les 30 secondes
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fermer la liste de notifications lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Charger les notifications lorsque l'utilisateur ouvre le menu
  const handleToggleNotifications = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    if (newState && notifications.length === 0) {
      setLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotificationCount(0);
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Mettre à jour le compteur
      const unreadCount = notifications.filter(
        notif => notif.id !== notificationId && !notif.read
      ).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleToggleNotifications}
        className="relative p-2 text-gray-700 hover:text-blue-500 focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {notificationCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead} 
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Aucune notification pour le moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composant pour un élément de notification
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  // Format de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'à l\'instant';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    
    return date.toLocaleDateString();
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Link 
      href={`/tweet/${notification.tweet_id}`}
      onClick={handleClick}
      className={`block p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-bold">
              {notification.sender_username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            <span className="font-bold">{notification.sender_username}</span>
            {notification.type === 'like' ? (
              <span> a aimé votre tweet</span>
            ) : (
              <span> a commenté votre tweet</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {notification.tweet_content}
          </p>
          {notification.type === 'comment' && notification.comment_content && (
            <p className="text-xs text-gray-700 mt-1 italic">
              "{notification.comment_content}"
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(notification.created_at)}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
        )}
      </div>
    </Link>
  );
};

// Page de notifications complète
export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
        
        // Marquer toutes les notifications comme lues automatiquement
        await markAllNotificationsAsRead();
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Format de date complet pour la page
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold p-4 border-b">Notifications</h1>
      
      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 hover:bg-gray-50">
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-bold">
                      {notification.sender_username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p>
                    <Link href={`/profile/${notification.sender_username}`} className="font-bold hover:underline">
                      {notification.sender_username}
                    </Link>
                    {notification.type === 'like' ? (
                      <span> a aimé votre tweet</span>
                    ) : (
                      <span> a commenté votre tweet</span>
                    )}
                  </p>
                  <Link href={`/tweet/${notification.tweet_id}`} className="block mt-1 text-gray-600 hover:underline">
                    {notification.tweet_content}
                  </Link>
                  {notification.type === 'comment' && notification.comment_content && (
                    <p className="mt-2 p-2 bg-gray-100 rounded-lg text-gray-700 italic">
                      "{notification.comment_content}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          Aucune notification pour le moment.
        </div>
      )}
    </div>
  );
};