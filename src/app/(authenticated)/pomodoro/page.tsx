'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@/lib/types';
import { usePomodoroTimer } from '@/components/pomodoro/PomodoroProvider';

export default function PomodoroPage() {
  const timer = usePomodoroTimer();
  const { mode, timeLeft, isRunning, selectedTaskId } = timer;

  // Query tasks for selector
  const { data: tasksData } = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      return res.json();
    },
  });

  // Query pomodoro history and stats
  const { data: pomodoroData } = useQuery({
    queryKey: ['pomodoro'],
    queryFn: async () => {
      const res = await fetch('/api/pomodoro');
      return res.json();
    },
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const tasks = tasksData?.tasks || [];
  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const handleStart = () => {
    if (currentTask) timer.setSelectedTask(currentTask.id, currentTask.plan_id);
    timer.start();
  };

  const sessionsToday = pomodoroData?.todayCount ?? 0;
  const totalFocusSessions = pomodoroData?.totalFocusCount ?? sessionsToday;
  const todayMinutes = pomodoroData?.todayMinutes ?? 0;
  const totalFocusTime = todayMinutes >= 60
    ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`
    : `${todayMinutes}m`;
  const history = pomodoroData?.historyChart ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 mb-1">
          POMODORO
        </p>
        <h1 className="font-editorial text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
          Focus Now.{' '}
          <span className="font-editorial italic font-normal text-maroon-800">
            Future You Will Thank You.
          </span>
        </h1>
        <p className="text-stone-600 text-sm mt-0.5">
          25 minutes of deep work, 5 minutes to breathe.
        </p>
      </div>

      {/* 3 Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Countdown Timer */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex flex-col items-center justify-between text-center min-h-[300px]">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-maroon-800">
            {mode === 'focus' ? 'FOCUS' : 'BREAK'}
          </span>

          <div className="my-4">
            <div className={`font-mono text-6xl md:text-7xl font-extrabold tracking-tighter ${mode === 'focus' ? 'text-red-700' : 'text-stone-950'}`}>
              {formattedTime}
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-600 bg-cream-200/80 px-3 py-1 rounded-full max-w-[220px] mx-auto truncate">
              <span className="truncate">{currentTask?.title || 'Select a task'}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            {isRunning ? (
              <button
                type="button"
                onClick={timer.pause}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-400 bg-white text-stone-800 text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 transition-all shadow-xs"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                disabled={!timer.ready}
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95"
              >
                <Play className="w-4 h-4 fill-cream" /> Start
              </button>
            )}

            <button
              type="button"
              onClick={timer.reset}
              title="Reset Timer"
              className="p-2.5 rounded-full border border-hairline bg-white text-stone-500 hover:text-stone-800 hover:bg-cream-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Card: Focus Session & Stats */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-cream-200 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => timer.changeMode('focus')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'focus'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-maroon-800" /> Focus Session
              </button>
              <button
                type="button"
                onClick={() => timer.changeMode('break')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'break'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" /> Break
              </button>
            </div>

            {/* Stats list */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-hairline">
                <span className="text-stone-500">Focus Duration</span>
                <span className="font-semibold text-stone-800">25 minutes</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-hairline">
                <span className="text-stone-500">Break Duration</span>
                <span className="font-semibold text-stone-800">5 minutes</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-hairline">
                <span className="text-stone-500">Sessions Today</span>
                <span className="font-semibold text-stone-800">{sessionsToday}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-hairline">
                <span className="text-stone-500">Focus Time Today</span>
                <span className="font-semibold text-stone-800">{totalFocusTime}</span>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Current Task
            </span>
            <select
              value={currentTask?.id || ''}
              onChange={(e) => {
                const selectedTask = tasks.find((task) => task.id === e.target.value);
                timer.setSelectedTask(selectedTask?.id || '', selectedTask?.plan_id || null);
              }}
              className="w-full text-xs font-semibold text-stone-800 bg-white border border-hairline rounded-lg px-2.5 py-1.5 truncate focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon-800"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
              {tasks.length === 0 && <option value="">No tasks available</option>}
            </select>
          </div>
        </div>

        {/* Right Card: Today's Progress */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex flex-col items-center justify-between text-center">
          <div className="w-full text-left">
            <h3 className="font-editorial text-lg font-bold text-stone-900">Today's Progress</h3>
          </div>

          <div className="my-6 translate-y-3">
            <div className="font-mono text-5xl md:text-6xl font-extrabold text-stone-900">
              {sessionsToday}/10
            </div>
            <span className="text-xs text-stone-500 font-mono uppercase tracking-wider mt-1 block">
              pomodoros
            </span>
            <span className="mt-2 block text-xs text-stone-500">
              {totalFocusSessions} completed overall
            </span>
          </div>

          <div className="w-full p-4 rounded-xl bg-maroon-50/60 border border-maroon-100 text-center">
            <p className="font-editorial italic text-maroon-900 font-bold text-sm">
              Small sessions. Big results.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Wide Card: Pomodoro History Bar Chart */}
      <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-editorial text-xl font-bold text-stone-900">Pomodoro History</h3>
            <p className="text-xs text-stone-500">Daily completed focus sessions</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px] h-48 flex items-end justify-between gap-3 px-4 pt-6 pb-2 border-b border-hairline">
            {history.map((item: any, idx: number) => {
              const heightPercent = Math.min(100, (item.count / 10) * 100);
              const tooltipBottomPercent = Math.min(heightPercent, 85);
              const dayNum = item.date.split('-')[2];
              const [year, month, day] = item.date.split('-').map(Number);
              const monthName = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short' });
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="relative w-full flex items-end justify-center h-36">
                    <div
                      className="w-full max-w-[20px] rounded-t-sm bg-maroon-800 transition-all duration-300 group-hover:bg-maroon-900 group-hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span
                      className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-cream px-1.5 py-0.5 text-[10px] font-mono font-bold text-maroon-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ bottom: `calc(${tooltipBottomPercent}% + 0.25rem)` }}
                    >
                      {item.count}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 group-hover:text-stone-700 whitespace-nowrap">
                    {parseInt(dayNum, 10)} {monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
