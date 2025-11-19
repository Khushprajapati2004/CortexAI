// components/Header.tsx
'use client';

import { PanelLeftOpen, Sun, ChevronDown, Star, Menu, MessageSquareText, Moon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
// import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    // Initialize dark mode from localStorage or current DOM state to prevent reset
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedDarkMode = localStorage.getItem('darkMode');
            if (savedDarkMode) {
                try {
                    return JSON.parse(savedDarkMode);
                } catch {
                    // If parsing fails, check current DOM state
                    return document.documentElement.classList.contains('dark');
                }
            }
            // If no saved preference, check current DOM state
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });
    const [isDocumentModeOpen, setIsDocumentModeOpen] = useState(false);
    const [selectedDocumentMode, setSelectedDocumentMode] = useState('Document Mode');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

    // Initialize dark mode from localStorage on component mount and apply to DOM
    useEffect(() => {
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
        isInitialMount.current = false;
    }, []);

    // Apply dark mode class to document when mode changes and save to localStorage
    // Skip saving on initial mount to prevent overwriting
    useEffect(() => {
        if (isInitialMount.current) return;
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDocumentModeOpen(false);
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

                            <button className="px-3 py-2 flex items-center gap-2 text-base font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <Star className='h-4 w-4 fill-black dark:fill-white' /> Favorites <ChevronDown className='w-4 h-5' />
                            </button>
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