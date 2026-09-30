'use client';

import React from 'react';
import { AuthenticatedSidebar } from '@/components/navigation/AuthenticatedSidebar';
import { AuthenticatedHeader } from '@/components/navigation/AuthenticatedHeader';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroProvider';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PomodoroProvider>
      <div className="flex min-h-screen bg-cream">
        {/* Sidebar navigation */}
        <AuthenticatedSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AuthenticatedHeader />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </PomodoroProvider>
  );
}
