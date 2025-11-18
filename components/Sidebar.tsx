// components/Sidebar.tsx
'use client';

import { CirclePlus, Ellipsis, PanelRightOpen, PencilLine, Pin, Search, SquarePen, Trash, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import UserProfile from './UserProfile';

interface Chat {
  id: string;
  title: string;
  mode: string | null;
  messages: Array<{
    content: string;
  }>;
  createdAt: string;
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
    const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch chats when sidebar opens or user changes
    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {
                const response = await fetch('/api/chats');
                if (response.ok) {
                    const data = await response.json();
                    setChats(data.chats || []);
                }
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && user) {
            fetchChats();
        }
    }, [isOpen, user]);

    // Close menu when clicking outside
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

    // Focus search input when search opens
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleEllipsisClick = (chatId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenMenuId(openMenuId === chatId ? null : chatId);
    };

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

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

    const handleNewChat = () => {
        // Reset the main chat interface
        window.location.href = '/'; // Or use your state management to reset the chat
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove chat from local state
                setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
                setOpenMenuId(null);
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const handleRenameChat = async (chatId: string, newTitle: string) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (response.ok) {
                // Update chat in local state
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.id === chatId ? { ...chat, title: newTitle } : chat
                    )
                );
                setOpenMenuId(null);
            }
        } catch (error) {
            console.error('Failed to rename chat:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
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
        const grouped: { [key: string]: Chat[] } = {};
        
        chats.forEach(chat => {
            const dateKey = formatDate(chat.createdAt);
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
            <div className={`fixed left-0 top-0 h-full w-76 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
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
                <div className="flex-1 overflow-y-auto pb-20">
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
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer group relative"
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
                                                        <button className="w-full px-4 cursor-pointer flex items-center gap-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                                            <Pin className='h-4 w-4 rotate-45' /> Pin
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