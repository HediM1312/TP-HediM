'use client';

import React, { useState, useEffect } from 'react';
import { getUserFollowing } from '@/services/api';
import { User } from '@/types';
import Link from 'next/link';
import FollowButton from './FollowButton';

interface FollowingListProps {
  username: string;
  isVisible: boolean;
  onClose: () => void;
}

const FollowingList: React.FC<FollowingListProps> = ({ username, isVisible, onClose }) => {
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!isVisible) return;

      try {
        setLoading(true);
        const data = await getUserFollowing(username);
        setFollowing(data);
        setError('');
      } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
        setError('Impossible de charger les abonnements');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [username, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Abonnements de @{username}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 text-center">{error}</div>
          ) : following.length > 0 ? (
            <ul className="divide-y divide-gray-800">
              {following.map((followed) => (
                <li key={followed.id} className="p-4 hover:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/profile/${followed.username}`}
                      className="flex items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {followed.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-white">{followed.username}</p>
                        <p className="text-sm text-gray-400">@{followed.username}</p>
                      </div>
                    </Link>
                    <FollowButton username={followed.username} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-400">
              Aucun abonnement pour le moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingList;