// components/Sidebar.tsx
'use client';

import { CirclePlus, Ellipsis, PanelRightOpen, PencilLine, Search, SquarePen, Trash, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import UserProfile from './UserProfile';
import { ChatStorage, StoredChat } from '@/lib/chatStorage';

interface Chat {
  id: string;
  title: string;
  mode: string | null;
  messages: Array<{
    content: string;
    role?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user?: {
        id: string;
        username: string;
        email: string;
    } | null;
}

const Sidebar = ({ isOpen, onClose, user }: SidebarProps) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const searchInputRef = useRef<HTMLInputElement>(null);

    const mapStoredChats = (storedChats: StoredChat[]): Chat[] =>
        storedChats.map((chat) => ({
            id: chat.id,
            title: chat.title,
            mode: chat.mode,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            isFavorite: chat.isFavorite,
            messages: (chat.messages || []).slice(-1).map((message) => ({
                content: message.content,
                role: message.role,
            })),
        }));

    const fetchChats = useCallback(async (showLoader = false) => {
        if (showLoader) {
            setIsLoading(true);
        }

        try {
            if (user) {
                const response = await fetch('/api/chats');
                if (response.ok) {
                    const data = await response.json();
                    if ((data.chats || []).length === 0) {
                        setChats(mapStoredChats(ChatStorage.getChats()));
                    } else {
                        // Merge database chats with localStorage to preserve isFavorite
                        const localChats = ChatStorage.getChats();
                        const mergedChats = (data.chats || []).map((dbChat: Chat) => {
                            const localChat = localChats.find(lc => lc.id === dbChat.id);
                            return {
                                ...dbChat,
                                isFavorite: dbChat.isFavorite ?? localChat?.isFavorite ?? false
                            };
                        });
                        setChats(mergedChats);
                        
                        // Sync back to localStorage
                        mergedChats.forEach((chat: Chat) => {
                            const localChat = localChats.find(lc => lc.id === chat.id);
                            if (localChat && localChat.isFavorite !== chat.isFavorite) {
                                ChatStorage.updateChat(chat.id, { isFavorite: chat.isFavorite });
                            }
                        });
                    }
                } else {
                    setChats(mapStoredChats(ChatStorage.getChats()));
                }
            } else {
                setChats(mapStoredChats(ChatStorage.getChats()));
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
            setChats(mapStoredChats(ChatStorage.getChats()));
        } finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            fetchChats(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const currentId = localStorage.getItem('currentChatId');
        if (currentId) {
            setActiveChatId(currentId);
        }
    }, []);

    // after refresh the page show the chat 
    useEffect(() => {
        const handleActiveChat = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId: string | null }>).detail;
            setActiveChatId(detail?.chatId ?? null);
        };

        const handleChatsRefresh = () => {
            fetchChats(false);
        };

        window.addEventListener('chat:active', handleActiveChat as EventListener);
        window.addEventListener('chat:list-refresh', handleChatsRefresh);

        return () => {
            window.removeEventListener('chat:active', handleActiveChat as EventListener);
            window.removeEventListener('chat:list-refresh', handleChatsRefresh);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId !== null) {
                const menuElement = menuRefs.current.get(openMenuId);
                if (menuElement && !menuElement.contains(event.target as Node)) {
                    setOpenMenuId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // focus search input when search opens
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // when i click on the ellipse than open the rename and delete option model
    const handleEllipsisClick = (chatId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenMenuId(openMenuId === chatId ? null : chatId);
    };

    // search open handler
    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    //search close handler
    const handleSearchClose = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const setMenuRef = useCallback((chatId: string, element: HTMLDivElement | null) => {
        if (element) {
            menuRefs.current.set(chatId, element);
        } else {
            menuRefs.current.delete(chatId);
        }
    }, []);

    const closeIfMobile = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onClose();
        }
    };

    // new chat open handler
    const handleNewChat = () => {
        // navigate to home page
        window.history.pushState({}, '', '/');
        
        window.dispatchEvent(new CustomEvent('chat:select', { detail: { chatId: null } }));
        setActiveChatId(null);
        closeIfMobile();
    };

    // when i click on the chat than open chat
    const handleChatClick = (chatId: string) => {
        setActiveChatId(chatId);
        setOpenMenuId(null);
        
        // Navigate to chat URL
        window.history.pushState({}, '', `/chat/${chatId}`);
        
        window.dispatchEvent(new CustomEvent('chat:select', { detail: { chatId } }));
        closeIfMobile();
    };

    // chat delete handler
    const handleDeleteChat = async (chatId: string) => {
        try {
            if (user) {
                await fetch(`/api/chats/${chatId}`, {
                    method: 'DELETE',
                });
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        } finally {
            ChatStorage.deleteChat(chatId);
            setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
            if (activeChatId === chatId) {
                setActiveChatId(null);
            }
            setOpenMenuId(null);
            window.dispatchEvent(new CustomEvent('chat:deleted', { detail: { chatId } }));
            window.dispatchEvent(new CustomEvent('chat:list-refresh'));
        }
    };

    // rename chat handler
    const handleRenameChat = async (chatId: string, newTitle: string) => {
        try {
            if (user) {
                await fetch(`/api/chats/${chatId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTitle }),
                });
            }
            setChats(prevChats => 
                prevChats.map(chat => 
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                )
            );
            ChatStorage.updateChat(chatId, { title: newTitle });
            setOpenMenuId(null);
            window.dispatchEvent(new CustomEvent('chat:renamed', { detail: { chatId, title: newTitle } }));
            window.dispatchEvent(new CustomEvent('chat:list-refresh'));
        } catch (error) {
            console.error('Failed to rename chat:', error);
        }
    };

    // date formate
    const formatDate = (dateString: string, fallback?: string) => {
        const date = new Date(dateString || fallback || new Date().toISOString());
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const groupChatsByDate = () => {
        const favorites = chats.filter(chat => chat.isFavorite);
        const nonFavorites = chats.filter(chat => !chat.isFavorite);

        const grouped: { [key: string]: Chat[] } = {};

        if (favorites.length > 0) {
            grouped['Favorites'] = favorites;
        }

        nonFavorites.forEach(chat => {
            const dateKey = formatDate(chat.updatedAt || chat.createdAt, chat.createdAt);
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(chat);
        });

        return grouped;
    };

    const filteredChats = chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.mode && chat.mode.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const groupedChats = groupChatsByDate();

    return (
        <>
            {/* Backdrop - only visible on mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 bottom-0 h-screen w-76 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-2">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors cursor-pointer"
                    >
                        <PanelRightOpen className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer" />
                    </button>

                    <div className='flex items-center gap-3'>
                        {/* Search Container */}
                        <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-48' : 'w-auto'}`}>
                            {isSearchOpen ? (
                                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                    <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search chats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                    <button
                                        onClick={handleSearchClose}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors ml-2 flex shrink-0"
                                    >
                                        <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSearchClick}
                                    className="p-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer" />
                                </button>
                            )}
                        </div>

                        <SquarePen className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer" />
                    </div>
                </div>

                {/* New Chat Button */}
                <div className='flex justify-center mx-3 rounded-full py-2 my-2 bg-gray-500 dark:bg-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 text-white'>
                    <button 
                        onClick={handleNewChat}
                        className='flex items-center justify-center gap-2 text-base font-semibold cursor-pointer'
                    >
                        <CirclePlus className='w-4 h-4' /> New chat
                    </button>
                </div>

                {/* Chats List */}
            <div className="flex-1 overflow-y-auto h-full pb-20 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                        </div>
                    ) : filteredChats.length === 0 && !searchQuery ? (
                        <div className="text-center py-8 px-4">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                                <SquarePen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user ? 'No chats yet. Start a new conversation!' : 'Sign in to save your chat history'}
                            </p>
                        </div>
                    ) : filteredChats.length === 0 && searchQuery ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                `No chats found matching {searchQuery}`
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedChats)
                            .filter(([, dateChats]) => 
                                dateChats.some(chat => 
                                    filteredChats.some(filteredChat => filteredChat.id === chat.id)
                                )
                            )
                            .map(([date, dateChats]) => (
                                <div key={date} className="p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        {date}
                                    </h3>
                                    <div className="space-y-1">
                                        {dateChats
                                            .filter(chat => filteredChats.some(filteredChat => filteredChat.id === chat.id))
                                            .map((chat) => (
                                                <div
                                                    key={chat.id}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group relative ${
                                                        activeChatId === chat.id
                                                            ? 'bg-gray-100 dark:bg-gray-800'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                                    onClick={() => handleChatClick(chat.id)}
                                                >
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                                {chat.title}
                                                            </span>
                                                            {chat.mode && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    {chat.mode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`transition-all duration-200 ${
                                                            openMenuId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Ellipsis
                                                            className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                                            onClick={(e) => handleEllipsisClick(chat.id, e)}
                                                        />
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    <div
                                                        ref={el => setMenuRef(chat.id, el)}
                                                        className={`absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 transform origin-top-right ${
                                                            openMenuId === chat.id
                                                                ? 'opacity-100 scale-100 translate-y-0'
                                                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                                        }`}
                                                    >
                                                        <button 
                                                            className="w-full flex items-center cursor-pointer gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                                                            onClick={() => {
                                                                const newTitle = prompt('Enter new title:', chat.title);
                                                                if (newTitle && newTitle.trim()) {
                                                                    handleRenameChat(chat.id, newTitle.trim());
                                                                }
                                                            }}
                                                        >
                                                            <PencilLine className='w-4 h-4' /> Rename
                                                        </button>
                                                        <button 
                                                            className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-red-700 dark:text-red-500 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                                                            onClick={() => handleDeleteChat(chat.id)}
                                                        >
                                                            <Trash className='w-4 h-4' /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Updated Footer Section */}
                <div className='absolute bottom-4 left-0 right-0 px-4'>
                    {user ? (
                        // Show user profile when logged in
                        <div className="flex justify-center">
                            <UserProfile user={user} />
                        </div>
                    ) : (
                        // Show login/signup buttons when not logged in
                        <div className='flex items-center justify-center gap-3'>
                            <Link href="/login">
                                <button className='bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-8 py-2 rounded-full cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors'>
                                    Log in
                                </button>
                            </Link>
                            <Link href="/signup">
                                <button className='bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-8 py-2 rounded-full cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors'>
                                    Sign up
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;