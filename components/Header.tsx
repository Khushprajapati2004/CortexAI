// components/Header.tsx
'use client';

import { PanelLeftOpen, Sun, ChevronDown, Star, Menu, MessageSquareText, Moon, Heart, Copy, Check } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
// import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useState, useEffect, useRef } from 'react';
import { ChatStorage } from '@/lib/chatStorage';

const Header = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    // Start with false to match server-side render, update after mount
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isDocumentModeOpen, setIsDocumentModeOpen] = useState(false);
    const [selectedDocumentMode, setSelectedDocumentMode] = useState('Document Mode');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [favoriteChats, setFavoriteChats] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const favoritesRef = useRef<HTMLDivElement>(null);

    // Initialize dark mode from localStorage after component mounts (client-side only)
    useEffect(() => {
        setIsMounted(true);
        const savedDarkMode = localStorage.getItem('darkMode');
        const currentIsDark = document.documentElement.classList.contains('dark');
        
        if (savedDarkMode) {
            try {
                const isDark = JSON.parse(savedDarkMode);
                setIsDarkMode(isDark);
                // Only apply if it differs from current state
                if (isDark !== currentIsDark) {
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            } catch {
                // If parsing fails, use current DOM state
                setIsDarkMode(currentIsDark);
            }
        } else {
            // If no saved preference, use current DOM state and save it
            setIsDarkMode(currentIsDark);
            localStorage.setItem('darkMode', JSON.stringify(currentIsDark));
        }
    }, []);

    // Apply dark mode class to document when mode changes and save to localStorage
    useEffect(() => {
        if (!isMounted) return; // Skip on initial mount
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode, isMounted]);

    // Load favorites on mount and check current chat
    useEffect(() => {
        if (isMounted) {
            loadFavoriteChats();
            
            // Also check if current chat is favorited
            const currentId = localStorage.getItem('currentChatId');
            if (currentId) {
                const chat = ChatStorage.getChat(currentId);
                if (chat) {
                    setActiveChatId(currentId);
                    setIsFavorite(chat.isFavorite || false);
                    console.log('Mount: Loaded chat', currentId, 'isFavorite:', chat.isFavorite);
                }
            }
        }
    }, [isMounted]);

    // Listen for active chat changes
    useEffect(() => {
        const handleActiveChat = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId: string | null }>).detail;
            const chatId = detail?.chatId ?? null;
            setActiveChatId(chatId);
            
            if (chatId) {
                // Small delay to ensure localStorage is updated
                setTimeout(() => {
                    const chat = ChatStorage.getChat(chatId);
                    const favoriteStatus = chat?.isFavorite || false;
                    setIsFavorite(favoriteStatus);
                    console.log('Active chat changed:', chatId, 'isFavorite:', favoriteStatus, 'chat:', chat);
                }, 100);
            } else {
                setIsFavorite(false);
            }
            
            // Reload favorites when chat changes
            setTimeout(() => loadFavoriteChats(), 100);
        };

        const handleChatsRefresh = () => {
            console.log('Chat list refresh triggered');
            
            // Small delay to ensure localStorage is updated
            setTimeout(() => {
                loadFavoriteChats();
                
                // Also update current chat's favorite status
                if (activeChatId) {
                    const chat = ChatStorage.getChat(activeChatId);
                    if (chat) {
                        setIsFavorite(chat.isFavorite || false);
                        console.log('Refresh: Updated favorite status for', activeChatId, 'to', chat.isFavorite);
                    }
                }
            }, 100);
        };

        window.addEventListener('chat:active', handleActiveChat as EventListener);
        window.addEventListener('chat:select', handleActiveChat as EventListener);
        window.addEventListener('chat:list-refresh', handleChatsRefresh);
        window.addEventListener('chat:renamed', handleChatsRefresh);
        window.addEventListener('chat:deleted', handleChatsRefresh);

        // Check for current chat on mount
        if (typeof window !== 'undefined' && isMounted) {
            const currentId = localStorage.getItem('currentChatId');
            if (currentId) {
                setActiveChatId(currentId);
                const chat = ChatStorage.getChat(currentId);
                const favoriteStatus = chat?.isFavorite || false;
                setIsFavorite(favoriteStatus);
                console.log('Initial chat loaded:', currentId, 'isFavorite:', favoriteStatus, 'full chat:', chat);
            }
        }

        return () => {
            window.removeEventListener('chat:active', handleActiveChat as EventListener);
            window.removeEventListener('chat:select', handleActiveChat as EventListener);
            window.removeEventListener('chat:list-refresh', handleChatsRefresh);
            window.removeEventListener('chat:renamed', handleChatsRefresh);
            window.removeEventListener('chat:deleted', handleChatsRefresh);
        };
    }, [activeChatId, isMounted]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDocumentModeOpen(false);
            }
            if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
                setIsFavoritesOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const toggleDocumentMode = () => {
        setIsDocumentModeOpen(!isDocumentModeOpen);
    };

    const handleDocumentModeSelect = (modeName: string) => {
        if (modeName === 'Clear') {
            setSelectedDocumentMode('Document Mode');
        } else {
            setSelectedDocumentMode(modeName);
        }
        setIsDocumentModeOpen(false);
    };

    const documentModes = [
        { name: 'Manuals', active: selectedDocumentMode === 'Manuals' },
        { name: 'FAA SDRS', active: selectedDocumentMode === 'FAA SDRS' },
        { name: 'FAA SB/AD', active: selectedDocumentMode === 'FAA SB/AD' },
        { name: 'Clear', active: false }
    ];

    const loadFavoriteChats = () => {
        const chats = ChatStorage.getChats();
        const favorites = chats.filter(chat => chat.isFavorite);
        setFavoriteChats(favorites);
        console.log('Loaded favorites:', favorites.length, favorites.map(c => ({ id: c.id, title: c.title, isFavorite: c.isFavorite })));
        
        // Also update current chat's favorite status if it exists
        if (activeChatId) {
            const currentChat = chats.find(c => c.id === activeChatId);
            if (currentChat) {
                setIsFavorite(currentChat.isFavorite || false);
                console.log('Updated current chat favorite status:', currentChat.isFavorite);
            }
        }
    };

    const toggleFavoriteChat = async () => {
        if (!activeChatId) return;

        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        
        // Update in ChatStorage
        ChatStorage.updateChat(activeChatId, { isFavorite: newFavoriteState });
        
        // Try to update in database if user is logged in
        try {
            await fetch(`/api/chats/${activeChatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFavorite: newFavoriteState }),
            });
        } catch (error) {
            console.error('Failed to update favorite in database:', error);
        }
        
        // Reload favorites immediately
        loadFavoriteChats();
        
        // Dispatch event to refresh sidebar
        window.dispatchEvent(new CustomEvent('chat:list-refresh'));
    };

    const copyPageLink = async () => {
        if (typeof window === 'undefined') return;
        
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    const handleChatClick = (chatId: string) => {
        // Navigate to chat URL
        window.history.pushState({}, '', `/chat/${chatId}`);
        
        window.dispatchEvent(new CustomEvent('chat:select', { detail: { chatId } }));
        setIsFavoritesOpen(false);
    };

    return (
        <>
            <TooltipProvider>
                <header className="relative z-30 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left side - Logo and brand name */}
                        <div className="flex items-center space-x-3">
                            <div className={`flex items-center justify-center w-8 h-8 transition-all duration-300 ${
                                isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}>
                                <PanelLeftOpen 
                                    className="w-6 h-6 text-black dark:text-white cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" 
                                    onClick={toggleSidebar}
                                />
                            </div>
                            <div className={`flex items-center text-2xl font-semibold space-x-2 ${
                                isSidebarOpen ? '-ml-16' : ''} `}>
                                <h1 className="text-gray-700 dark:text-white">Cortex</h1>
                                <span className='text-gray-800 dark:text-white'>AI</span>
                            </div>
                        </div>

                        {/* Right side - Navigation icons */}
                        <div className="flex items-center space-x-2">
                            {/* Heart Icon - Only show when chat is open */}
                            {activeChatId && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button 
                                            className="p-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            onClick={toggleFavoriteChat}
                                        >
                                            <Heart 
                                                className={`w-5 h-5 transition-all ${
                                                    isFavorite 
                                                        ? 'fill-red-500 text-red-500' 
                                                        : ''
                                                }`} 
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* Copy Icon - Only show when chat is open */}
                            {activeChatId && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button 
                                            className="p-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            onClick={copyPageLink}
                                        >
                                            {isCopied ? (
                                                <Check className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isCopied ? 'Copied!' : 'Copy Link'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        className="p-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        onClick={toggleDarkMode}
                                    >
                                        {isMounted && isDarkMode ? (
                                            <Moon className="w-5 h-5" />
                                        ) : (
                                            <Sun className="w-5 h-5" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="p-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                        <MessageSquareText className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Explore Charts/Table</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* Document Mode Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-md cursor-pointer"
                                    onClick={toggleDocumentMode}
                                >
                                    <Menu className="w-4 h-4" />
                                    <span className="text-sm">{selectedDocumentMode}</span>
                                </button>

                                {/* Dropdown Menu */}
                                {isDocumentModeOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                                        {documentModes.map((mode, index) => (
                                            <button
                                                key={mode.name}
                                                onClick={() => handleDocumentModeSelect(mode.name)}
                                                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                                                    mode.active 
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                                        : mode.name === 'Clear'
                                                            ? 'text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 justify-center'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                } ${
                                                    index === 0 ? 'rounded-t-lg' : ''
                                                } ${
                                                    index === documentModes.length - 1 ? 'rounded-b-lg' : ''
                                                }`}
                                            >
                                                <span>{mode.name}</span>
                                                {mode.active && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Favorites Dropdown */}
                            <div className="relative" ref={favoritesRef}>
                                <button 
                                    className="px-3 py-2 flex items-center gap-2 text-base font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    onClick={() => {
                                        // Reload favorites when opening dropdown
                                        if (!isFavoritesOpen) {
                                            loadFavoriteChats();
                                        }
                                        setIsFavoritesOpen(!isFavoritesOpen);
                                    }}
                                >
                                    <Star className='h-4 w-4 fill-black dark:fill-white' /> Favorites <ChevronDown className='w-4 h-5' />
                                </button>

                                {/* Favorites Dropdown Menu */}
                                {isFavoritesOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                                        {favoriteChats.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                                No favorite chats yet
                                            </div>
                                        ) : (
                                            favoriteChats.map((chat) => (
                                                <button
                                                    key={chat.id}
                                                    onClick={() => handleChatClick(chat.id)}
                                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                        activeChatId === chat.id 
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                                            : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-medium truncate">{chat.title}</span>
                                                        {chat.mode && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {chat.mode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Heart className="w-4 h-4 fill-red-500 text-red-500 ml-2 flex-shrink-0" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            </TooltipProvider>

            {/* Sidebar */}
            {/* <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} /> */}
        </>
    );
};

export default Header;