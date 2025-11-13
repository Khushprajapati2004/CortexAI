// components/Sidebar.tsx
'use client';

import { CirclePlus, Ellipsis, PanelRightOpen, PencilLine, Pin, Search, SquarePen, Trash, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const handleEllipsisClick = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenMenuId(openMenuId === index ? null : index);
    };

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    const handleSearchClose = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const setMenuRef = useCallback((index: number, element: HTMLDivElement | null) => {
        if (element) {
            menuRefs.current.set(index, element);
        } else {
            menuRefs.current.delete(index);
        }
    }, []);

    const menuItems = [
        { id: 1, title: "Aerospace Market Trends An" },
        { id: 2, title: "Today's Daily Brief Request" },
        { id: 3, title: "Aviation & MRO Assistance" },
    ];

    return (
        <>
            {/* Backdrop - only visible on mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full w-74 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'
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

                <div className='flex justify-center mx-3 rounded-full py-2 my-2 bg-gray-500 dark:bg-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 text-white'>
                    <button className='flex items-center justify-center gap-2 text-base font-semibold cursor-pointer'>
                        <CirclePlus className='w-4 h-4' /> New chat
                    </button>
                </div>

                <div className="p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Today</h3>
                    <div className="space-y-1">
                        {menuItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer group relative"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.title}</span>
                                </div>
                                <div
                                    className={`transition-all duration-200 ${openMenuId === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <Ellipsis
                                        className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                        onClick={(e) => handleEllipsisClick(index, e)}
                                    />
                                </div>

                                {/* Dropdown Menu */}
                                <div
                                    ref={el => setMenuRef(index, el)}
                                    className={`absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 transform origin-top-right ${openMenuId === index
                                            ? 'opacity-100 scale-100 translate-y-0'
                                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                        }`}
                                >
                                    <button className="w-full flex items-center cursor-pointer gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                        <PencilLine className='w-4 h-4' /> Rename
                                    </button>
                                    <button className="w-full px-4 cursor-pointer flex items-center gap-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                        <Pin className='h-4 w-4 rotate-45' /> Pin
                                    </button>
                                    <button className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-red-700 dark:text-red-500 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                        <Trash className='w-4 h-4' /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Yesterday</h3>
                    <div className="space-y-1">
                        {menuItems.map((item, index) => {
                            const yesterdayIndex = index + menuItems.length;
                            return (
                                <div
                                    key={`yesterday-${item.id}`}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer group relative"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.title}</span>
                                    </div>
                                    <div
                                        className={`transition-all duration-200 ${openMenuId === yesterdayIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Ellipsis
                                            className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                            onClick={(e) => handleEllipsisClick(yesterdayIndex, e)}
                                        />
                                    </div>

                                    {/* Dropdown Menu */}
                                    <div
                                        ref={el => setMenuRef(yesterdayIndex, el)}
                                        className={`absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 transform origin-top-right ${openMenuId === yesterdayIndex
                                                ? 'opacity-100 scale-100 translate-y-0'
                                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                            }`}
                                    >
                                        <button className="w-full flex items-center cursor-pointer gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                            <PencilLine className='w-4 h-4' /> Rename
                                        </button>
                                        <button className="w-full px-4 cursor-pointer flex items-center gap-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                            <Pin className='h-4 w-4 rotate-45' /> Pin
                                        </button>
                                        <button className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-red-700 dark:text-red-500 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                                            <Trash className='w-4 h-4' /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className='flex items-center justify-center gap-3 absolute left-2 bottom-4'>
                    <Link href="/login">
                        <button className='bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-10 py-2 rounded-full cursor-pointer'>
                            Log in
                        </button>
                    </Link>
                    <Link href="/signup">
                        <button className='bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-10 py-2 rounded-full cursor-pointer'>
                            Sign up
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar;