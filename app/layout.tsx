// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '../context/SidebarContext';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cortex AI',
  description: 'Your AI Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          <div className="min-h-screen bg-white">
            <Providers>
              {children}
            </Providers>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}