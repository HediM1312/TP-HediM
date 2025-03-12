'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiImage, FiSmile, FiVideo, FiX, FiUser } from 'react-icons/fi';
import { useAuth } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { searchUsers } from '@/services/api';
import { User } from '@/types';
import debounce from 'lodash/debounce';

interface TweetFormProps {
  onSubmit: (content: string, mediaFile?: File, tags?: string[]) => Promise<void>;
}


export const TweetForm: React.FC<TweetFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [showMentionResults, setShowMentionResults] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');


  // Fonction pour rechercher des utilisateurs (avec debounce)
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm) {
        try {
          const users = await searchUsers(searchTerm);
          setMentionResults(users);
        } catch (error) {
          console.error('Error searching users:', error);
          setMentionResults([]);
        }
      } else {
        setMentionResults([]);
      }
    }, 300),
    []
  );

  // Traitement des mentions et détection du curseur
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const selectionStart = textareaRef.current.selectionStart || 0;
    setCursorPosition(selectionStart);
    
    // Détecter si nous sommes en train de taper une mention
    let lastAtSymbol = -1;
    for (let i = selectionStart - 1; i >= 0; i--) {
      if (content[i] === '@') {
        lastAtSymbol = i;
        break;
      } else if (content[i] === ' ' || content[i] === '\n') {
        break;
      }
    }
    
    if (lastAtSymbol !== -1) {
      const query = content.substring(lastAtSymbol + 1, selectionStart);
      setMentionSearch(query);
      setShowMentionResults(true);
      debouncedSearch(query);
    } else {
      setShowMentionResults(false);
    }
  }, [content, debouncedSearch]);

  // Fermer le menu des mentions au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(e.target as Node)) {
        setShowMentionResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    
    // Trouver le dernier @ avant le curseur
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) return;
    
    // Remplacer ce qui se trouve entre @ et le curseur par le nom d'utilisateur
    const newContent = beforeCursor.substring(0, lastAtIndex) + 
                      `@${username} ` + 
                      afterCursor;
    
    setContent(newContent);
    setShowMentionResults(false);
    
    // Mettre le focus sur le textarea et placer le curseur après la mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = lastAtIndex + username.length + 2; // +2 pour @ et espace
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
      }
    }, 0);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type.split('/')[0];
      
      // Vérifier si le fichier est une image ou une vidéo
      if (fileType !== 'image' && fileType !== 'video') {
        alert('Seules les images et les vidéos sont acceptées');
        return;
      }
      
      // Vérifier la taille du fichier (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10 MB)');
        return;
      }
      
      setMediaFile(file);
      setMediaType(fileType as 'image' | 'video');
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!content.trim() && !mediaFile) return;

  console.log("🚀 Tags récupérés avant envoi :", tags);  // ✅ Vérifie si les tags sont bien stockés

  setIsSubmitting(true);
  try {
    await onSubmit(content, mediaFile || undefined, tags);  // ✅ Passe bien les tags ici
    setContent('');
    setTags([]);  // ✅ Reset après l'envoi
    removeMedia();
  } catch (error) {
    console.error('Error submitting tweet:', error);
  } finally {
    setIsSubmitting(false);
  }
};


  // Formater le contenu avec les mentions colorées pour l'affichage
  const getFormattedContent = () => {
    // Cette fonction est utilisée uniquement pour le débogage ou l'affichage
    // Elle n'est pas utilisée dans cette implémentation mais peut être utile
    return content.replace(/@(\w+)/g, '<span class="text-purple-400">@$1</span>');
  };

  return (
<motion.form
    onSubmit={handleSubmit}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm"
>
    <div className="flex">
        <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
        </motion.div>

        <div className="ml-3 flex-grow relative">
            <textarea
                ref={textareaRef}
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none min-h-[80px]"
                placeholder="Quoi de neuf ? Utilisez @ pour mentionner quelqu'un"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={280}
            />

            {/* ✅ Section des tags */}
            <div className="flex flex-wrap items-center space-x-2 mt-3">
                {tags.map((tag, index) => (
                    <div key={index} className="bg-purple-500 text-white px-3 py-1 rounded-full flex items-center">
                        <span>#{tag}</span>
                        <button
                            type="button"
                            className="ml-2 text-white hover:text-red-400"
                            onClick={() => setTags(tags.filter((t) => t !== tag))}
                        >
                            <FiX />
                        </button>
                    </div>
                ))}

                <input
                    type="text"
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="px-3 py-1 rounded-full border border-gray-700 bg-transparent text-white focus:ring focus:ring-purple-500"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                            e.preventDefault();
                            if (!tags.includes(newTag.trim())) {
                                setTags([...tags, newTag.trim()]);
                            }
                            setNewTag('');
                        }
                    }}
                />
            </div>

            {/* ✅ Menu d'autocomplétion des mentions */}
            <AnimatePresence>
                {showMentionResults && mentionResults.length > 0 && (
                    <motion.div
                        ref={mentionMenuRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-64 max-h-64 overflow-y-auto"
                    >
                        <div className="p-2 text-sm text-gray-400 border-b border-gray-700">
                            Utilisateurs trouvés
                        </div>
                        {mentionResults.map(user => (
                            <div
                                key={user.id}
                                className="p-2 hover:bg-purple-500/20 cursor-pointer flex items-center"
                                onClick={() => insertMention(user.username)}
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white mr-2">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user.username}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ Affichage des médias */}
            {mediaPreview && (
                <div className="relative mt-2 mb-3 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                    <button
                        type="button"
                        onClick={removeMedia}
                        className="absolute top-2 right-2 bg-gray-900/80 p-1 rounded-full text-white hover:bg-red-500 z-10"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    {mediaType === 'image' && (
                        <img
                            src={mediaPreview}
                            alt="Preview"
                            className="max-h-80 w-auto mx-auto rounded-xl"
                        />
                    )}

                    {mediaType === 'video' && (
                        <video
                            src={mediaPreview}
                            controls
                            className="max-h-80 w-auto mx-auto rounded-xl"
                        />
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        ref={fileInputRef}
                        className="hidden"
                        id="media-upload"
                    />

                    <motion.label
                        htmlFor="media-upload"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors cursor-pointer"
                    >
                        <FiImage className="w-5 h-5" />
                    </motion.label>

                    <motion.label
                        htmlFor="media-upload"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors cursor-pointer"
                    >
                        <FiVideo className="w-5 h-5" />
                    </motion.label>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors"
                        onClick={() => {
                            if (textareaRef.current) {
                                const start = textareaRef.current.selectionStart;
                                const end = textareaRef.current.selectionEnd;
                                const newContent = content.substring(0, start) + '@' + content.substring(end);
                                setContent(newContent);

                                // Focus le textarea et place le curseur après le @
                                setTimeout(() => {
                                    if (textareaRef.current) {
                                        textareaRef.current.focus();
                                        const newPosition = start + 1;
                                        textareaRef.current.selectionStart = newPosition;
                                        textareaRef.current.selectionEnd = newPosition;
                                    }
                                }, 0);
                            }
                        }}
                    >
                        <FiUser className="w-5 h-5" />
                    </motion.button>

                    <div className="h-8 w-[1px] bg-gray-800 mx-2" />

                    <motion.div
                        className={`flex items-center px-3 py-1 rounded-full ${
                            content.length > 240
                                ? 'bg-red-500/20 text-red-500'
                                : content.length > 200
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : 'bg-purple-500/20 text-purple-400'
                        }`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        {280 - content.length}
                    </motion.div>
                </div>
            </div>
        </div>
    </div>
</motion.form>

  );
};