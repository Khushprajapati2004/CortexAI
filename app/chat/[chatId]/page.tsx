// app/chat/[chatId]/page.tsx
'use client';

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Sidebar from '@/components/Sidebar'
import React, { useState, useEffect } from 'react'
import { useSidebar } from '../../../context/SidebarContext';
import { useParams } from 'next/navigation';

interface User {
    id: string;
    username: string;
    email: string;
}

const ChatPage = () => {
    const { isSidebarOpen, closeSidebar } = useSidebar();
    const [user, setUser] = useState<User | null>(null);
    const params = useParams();
    const chatId = params.chatId as string;

    useEffect(() => {
        // Fetch user data on component mount
        const fetchUser = async () => {
            try {
                // Try legacy auth token endpoint first
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.user) {
                        setUser(userData.user);
                        return;
                    }
                }

                // Fallback to NextAuth session (handles Google/OAuth logins)
                const sessionResponse = await fetch('/api/auth/session');
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    if (sessionData?.user) {
                        setUser({
                            id: sessionData.user.id || sessionData.user.email || 'session-user',
                            username: sessionData.user.name || sessionData.user.email || 'User',
                            email: sessionData.user.email || '',
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };

        fetchUser();
    }, []);

    // Dispatch event to load the chat when component mounts
    useEffect(() => {
        if (chatId) {
            // Small delay to ensure Hero component is mounted
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('chat:select', { detail: { chatId } }));
            }, 100);
        }
    }, [chatId]);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 relative">
            {/* Sidebar with user prop */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={user} />
            
            {/* Main content - stays in place when sidebar opens */}
            <div className={`transition-all duration-300 ${
                isSidebarOpen ? 'lg:ml-80' : 'ml-0'
            }`}>
                <Header />
                <Hero />
            </div>
        </div>
    )
}

export default ChatPage
