'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type PomodoroMode = 'focus' | 'break';

type CompletionPrompt = PomodoroMode | null;

type PomodoroState = {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  endsAt: number | null;
  selectedTaskId: string;
  selectedPlanId: string | null;
  sessionId: string | null;
  completionPrompt: CompletionPrompt;
};

type PomodoroContextValue = PomodoroState & {
  ready: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  changeMode: (mode: PomodoroMode) => void;
  startMode: (mode: PomodoroMode) => void;
  setSelectedTask: (taskId: string, planId: string | null) => void;
  dismissCompletion: () => void;
};

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_PREFIX = 'todoonsteroids:pomodoro:';

const initialState: PomodoroState = {
  mode: 'focus',
  timeLeft: FOCUS_SECONDS,
  isRunning: false,
  endsAt: null,
  selectedTaskId: '',
  selectedPlanId: null,
  sessionId: null,
  completionPrompt: null,
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function durationFor(mode: PomodoroMode) {
  return mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
}

function claimCompletion(key: string) {
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, '1');
  } catch {
    // If browser storage is unavailable, still record the session in this tab.
  }
  return true;
}

function cancelPomodoroSession(sessionId: string | null) {
  if (!sessionId) return;
  void fetch('/api/pomodoro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel', sessionId }),
  }).catch((error) => console.error('[Pomodoro] Failed to cancel session', error));
}

export function usePomodoroTimer() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error('usePomodoroTimer must be used inside PomodoroProvider');
  return context;
}

function CompletionDialog() {
  const { completionPrompt, startMode, dismissCompletion } = usePomodoroTimer();
  if (!completionPrompt) return null;

  const focusFinished = completionPrompt === 'focus';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-complete-title"
      className="fixed inset-0 z-[80] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-cream p-6 shadow-2xl">
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-maroon-800">
          {focusFinished ? 'Focus session complete' : 'Break complete'}
        </p>
        <h2 id="pomodoro-complete-title" className="mt-2 font-editorial text-2xl font-bold text-stone-900">
          {focusFinished ? 'Well done. Take a breather?' : 'Ready to focus again?'}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {focusFinished
            ? 'Start a 5-minute break or begin another 25-minute focus session.'
            : 'Start another 25-minute focus session whenever you’re ready.'}
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={dismissCompletion}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-cream-200"
          >
            {focusFinished ? 'Not now' : 'Close'}
          </button>
          {focusFinished && (
            <button
              type="button"
              onClick={() => startMode('focus')}
              className="rounded-lg border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-cream-100"
            >
              Start another focus
            </button>
          )}
          <button
            type="button"
            onClick={() => startMode(focusFinished ? 'break' : 'focus')}
            className="rounded-lg bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-maroon-900"
          >
            {focusFinished ? 'Start break' : 'Start focus session'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [timer, setTimer] = useState<PomodoroState>(initialState);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const handledEndAt = useRef<number | null>(null);
  const startingSessionForEndAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTimer = async () => {
      let userId: string | undefined;
      try {
        const { data: { user } } = await createClient().auth.getUser();
        userId = user?.id;
      } catch {
        // Keep the timer usable if auth refresh is temporarily unavailable.
      }
      if (cancelled) return;

      const key = `${STORAGE_PREFIX}${userId || 'guest'}`;
      setStorageKey(key);
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved) as PomodoroState;
          if (parsed && (parsed.mode === 'focus' || parsed.mode === 'break')) {
            if (parsed.isRunning && parsed.endsAt) {
              const remaining = Math.max(0, Math.ceil((parsed.endsAt - Date.now()) / 1000));
              if (remaining === 0) {
                handledEndAt.current = parsed.endsAt;
                setTimer({
                  ...parsed,
                  sessionId: null,
                  timeLeft: 0,
                  isRunning: false,
                  endsAt: null,
                  completionPrompt: parsed.mode,
                });
                const completionKey = `${key}:completed:${parsed.endsAt}`;
                if (parsed.sessionId && claimCompletion(completionKey)) void fetch('/api/pomodoro', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete', sessionId: parsed.sessionId }),
                })
                  .then((response) => {
                    if (!response.ok) throw new Error('Could not save completed Pomodoro session');
                    queryClient.invalidateQueries({ queryKey: ['pomodoro'] });
                    queryClient.invalidateQueries({ queryKey: ['analytics'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  })
                  .catch((error) => console.error('[Pomodoro] Failed to save completed session', error));
              } else {
                setTimer({
                  ...parsed,
                  sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
                  timeLeft: remaining,
                });
              }
            } else {
              setTimer({
                ...initialState,
                ...parsed,
                sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
              });
            }
          }
        }
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore unavailable browser storage.
        }
      }
      setReady(true);
    };
    void loadTimer();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  // Keep a second open tab on the same timer without restarting its countdown.
  useEffect(() => {
    if (!ready || !storageKey) return;
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as PomodoroState;
        if (!parsed || (parsed.mode !== 'focus' && parsed.mode !== 'break')) return;
        const remaining = parsed.isRunning && parsed.endsAt
          ? Math.max(0, Math.ceil((parsed.endsAt - Date.now()) / 1000))
          : parsed.timeLeft;
        const synced: PomodoroState = parsed.isRunning && parsed.endsAt && remaining === 0
          ? { ...parsed, timeLeft: 0, isRunning: false, endsAt: null, completionPrompt: parsed.mode }
          : { ...parsed, timeLeft: remaining };

        setTimer((current) => {
          if (
            current.endsAt === synced.endsAt &&
            current.isRunning === synced.isRunning &&
            current.mode === synced.mode &&
            current.completionPrompt === synced.completionPrompt &&
            current.selectedTaskId === synced.selectedTaskId &&
            current.selectedPlanId === synced.selectedPlanId &&
            current.sessionId === synced.sessionId &&
            (synced.isRunning || current.timeLeft === synced.timeLeft)
          ) return current;
          return synced;
        });
      } catch {
        // Ignore incomplete or invalid cross-tab state.
      }
    };
    window.addEventListener('storage', syncFromOtherTab);
    return () => window.removeEventListener('storage', syncFromOtherTab);
  }, [ready, storageKey]);

  useEffect(() => {
    if (!ready || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(timer));
    } catch {
      // The in-memory timer still works if browser storage is unavailable.
    }
  }, [ready, storageKey, timer]);

  // Establish the session with server time before accepting a completion.
  useEffect(() => {
    if (!ready || !timer.isRunning || !timer.endsAt || timer.sessionId) {
      if (!timer.isRunning) startingSessionForEndAt.current = null;
      return;
    }

    const activeEndAt = timer.endsAt;
    if (startingSessionForEndAt.current === activeEndAt) return;
    startingSessionForEndAt.current = activeEndAt;

    void fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        type: timer.mode,
        task_id: timer.selectedTaskId || undefined,
        planId: timer.selectedPlanId || undefined,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || typeof data.sessionId !== 'string') {
          throw new Error(data.error || 'Could not start Pomodoro session');
        }
        setTimer((current) => current.endsAt === activeEndAt && current.isRunning
          ? { ...current, sessionId: data.sessionId }
          : current);
      })
      .catch((error) => console.error('[Pomodoro] Failed to start session', error));
  }, [ready, timer.isRunning, timer.endsAt, timer.sessionId, timer.mode, timer.selectedTaskId, timer.selectedPlanId]);

  useEffect(() => {
    if (!timer.isRunning || !timer.endsAt) return;
    const activeEndAt = timer.endsAt;
    const activeMode = timer.mode;
    const activeSessionId = timer.sessionId;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((activeEndAt - Date.now()) / 1000));
      setTimer((current) => {
        if (current.endsAt !== activeEndAt) return current;
        return remaining > 0
          ? { ...current, timeLeft: remaining }
          : {
              ...current,
              timeLeft: 0,
              isRunning: false,
              endsAt: null,
              sessionId: null,
              completionPrompt: activeMode,
            };
      });

      if (remaining === 0 && handledEndAt.current !== activeEndAt) {
        handledEndAt.current = activeEndAt;
        const completionKey = storageKey ? `${storageKey}:completed:${activeEndAt}` : null;
        if (activeSessionId && (!completionKey || claimCompletion(completionKey))) void fetch('/api/pomodoro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete', sessionId: activeSessionId }),
        })
          .then((response) => {
            if (!response.ok) throw new Error('Could not save completed Pomodoro session');
            queryClient.invalidateQueries({ queryKey: ['pomodoro'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          })
          .catch((error) => console.error('[Pomodoro] Failed to save completed session', error));
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [timer.isRunning, timer.endsAt, timer.mode, timer.sessionId, queryClient, storageKey]);

  const value = useMemo<PomodoroContextValue>(() => ({
    ...timer,
    ready,
    start: () => setTimer((current) => {
      if (current.isRunning) return current;
      const seconds = current.timeLeft > 0 ? current.timeLeft : durationFor(current.mode);
      const endsAt = Date.now() + seconds * 1000;
      handledEndAt.current = null;
      return { ...current, timeLeft: seconds, isRunning: true, endsAt, completionPrompt: null };
    }),
    pause: () => setTimer((current) => {
      if (!current.isRunning || !current.endsAt) return current;
      const timeLeft = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000));
      return { ...current, timeLeft, isRunning: false, endsAt: null };
    }),
    reset: () => {
      cancelPomodoroSession(timer.sessionId);
      setTimer((current) => ({
        ...current,
        timeLeft: durationFor(current.mode),
        isRunning: false,
        endsAt: null,
        sessionId: null,
        completionPrompt: null,
      }));
    },
    changeMode: (mode) => {
      cancelPomodoroSession(timer.sessionId);
      setTimer((current) => ({
        ...current,
        mode,
        timeLeft: durationFor(mode),
        isRunning: false,
        endsAt: null,
        sessionId: null,
        completionPrompt: null,
      }));
    },
    startMode: (mode) => {
      const seconds = durationFor(mode);
      handledEndAt.current = null;
      cancelPomodoroSession(timer.sessionId);
      setTimer((current) => ({
        ...current,
        mode,
        timeLeft: seconds,
        isRunning: true,
        endsAt: Date.now() + seconds * 1000,
        sessionId: null,
        completionPrompt: null,
      }));
    },
    setSelectedTask: (selectedTaskId, selectedPlanId) => setTimer((current) => ({
      ...current,
      selectedTaskId,
      selectedPlanId,
    })),
    dismissCompletion: () => setTimer((current) => ({ ...current, completionPrompt: null })),
  }), [timer, ready]);

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      <CompletionDialog />
    </PomodoroContext.Provider>
  );
}
