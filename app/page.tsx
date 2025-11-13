// app/page.tsx
'use client';

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import React from 'react'
import { useSidebar } from '../context/SidebarContext';

const Home = () => {
    const { isSidebarOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 relative">
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