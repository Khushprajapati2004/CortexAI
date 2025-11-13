// components/Header.tsx
'use client';

import { PanelLeftOpen, Sun, ChevronDown, Star, Menu, MessageSquareText, Moon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useState, useEffect } from 'react';

const Header = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Apply dark mode class to document when mode changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
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
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        className="p-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        onClick={toggleDarkMode}
                                    >
                                        {isDarkMode ? (
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

                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-md cursor-pointer">
                                <Menu className="w-4 h-4" />
                                <span className="text-sm">Document Mode</span>
                            </button>

                            <button className="px-3 py-2 flex items-center gap-2 text-base font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <Star className='h-4 w-4 fill-black dark:fill-white' /> Favorites <ChevronDown className='w-4 h-5' />
                            </button>
                        </div>
                    </div>
                </header>
            </TooltipProvider>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        </>
    );
};

export default Header;