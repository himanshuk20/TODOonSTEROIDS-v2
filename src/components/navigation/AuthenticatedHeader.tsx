'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, User, Sparkles, Timer, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePomodoroTimer } from '@/components/pomodoro/PomodoroProvider';

export function AuthenticatedHeader() {
  const pomodoro = usePomodoroTimer();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar_url?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          avatar_url: u.user_metadata?.avatar_url || undefined,
        });
      }
    });
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fallbackName = user?.name.trim().split(/\s+/)[0] || 'User';
  const timerMinutes = Math.floor(pomodoro.timeLeft / 60);
  const timerSeconds = pomodoro.timeLeft % 60;

  return (
    <header className="h-16 border-b border-hairline bg-cream/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-8">
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-stone-500 font-mono tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>SYNCED WITH SUPABASE</span>
      </div>

      {/* Running Pomodoro and User Profile */}
      <div className="flex items-center gap-3">
        {pomodoro.ready && pomodoro.isRunning && (
          <Link
            href="/pomodoro"
            aria-label={`${pomodoro.mode === 'focus' ? 'Focus' : 'Break'} timer ${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-bold tabular-nums transition-colors ${
              pomodoro.mode === 'focus'
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-stone-300 bg-stone-900 text-white hover:bg-black'
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>{String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}</span>
          </Link>
        )}

        <a
          href="https://himanshupm.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-maroon-800 transition-colors hover:border-maroon-200 hover:bg-maroon-50"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Contact Support</span>
        </a>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-cream-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shadow-xs"
              />
            ) : (
              <div className="min-w-8 h-8 px-2 rounded-full bg-maroon-800 text-cream font-bold text-xs flex items-center justify-center shadow-xs">
                {fallbackName}
              </div>
            )}
            <span className="text-sm font-semibold text-stone-800">{user?.name || 'Loading…'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 bg-cream border border-hairline rounded-xl shadow-lg py-1.5 text-xs text-stone-700 z-20"
              >
                <div className="px-3 py-2 border-b border-hairline text-stone-500">
                  Signed in as <br />
                  <strong className="text-stone-800 font-medium">{user?.email || '…'}</strong>
                </div>
                <Link
                  href="/get-started"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-cream-200 transition-colors"
                  role="menuitem"
                >
                  <Sparkles className="w-3.5 h-3.5 text-maroon" /> Import New Plan
                </Link>
                <Link
                  href="/home"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-cream-200 transition-colors"
                  role="menuitem"
                >
                  <User className="w-3.5 h-3.5 text-stone-500" /> Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 transition-colors border-t border-hairline mt-1"
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
