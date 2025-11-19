// app/page.tsx
'use client';

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Sidebar from '@/components/Sidebar'
import React,{useState,useEffect} from 'react'
import { useSidebar } from '../context/SidebarContext';

interface User {
    id: string;
    username: string;
    email: string;
}

const Home = () => {
    const { isSidebarOpen,closeSidebar } = useSidebar();
    const [user, setUser] = useState<User | null>(null);

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

export default Home