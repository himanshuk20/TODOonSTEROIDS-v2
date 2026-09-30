'use client';

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Check,
  ChevronDown,
} from 'lucide-react';

export function DashboardPreview() {
  return (
    <div className="bg-cream-50/95 border border-hairline rounded-2xl p-5 md:p-6 shadow-preview text-stone-800 text-xs select-none max-w-full overflow-hidden">
      {/* Mini top bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-hairline text-stone-500">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-tight text-xs text-stone-900">
            TODO<span className="font-editorial italic font-normal text-maroon-800">on</span>STEROIDS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono">Mon, 28 Sep 2026</span>
          <div className="w-5 h-5 rounded-full bg-maroon-800 text-cream font-bold text-[9px] flex items-center justify-center">
            H
          </div>
        </div>
      </div>

      {/* Mini Greeting & KPI Row */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-editorial text-base font-bold text-stone-900">
              Good evening, Himanshu 👋
            </h4>
            <span className="text-[10px] text-stone-500">Let's keep the momentum going.</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-white border border-hairline">
            <span className="block text-[8px] font-bold uppercase text-stone-500">UPSC CSE 2027</span>
            <span className="block text-sm font-extrabold text-stone-900 mt-0.5">183</span>
            <span className="block text-[8px] text-stone-400">days left</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-hairline">
            <span className="block text-[8px] font-bold uppercase text-stone-500">Today's Progress</span>
            <span className="block text-sm font-extrabold text-stone-900 mt-0.5">3/5</span>
            <span className="block text-[8px] text-stone-400">60%</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-hairline">
            <span className="block text-[8px] font-bold uppercase text-stone-500">Weekly Goal</span>
            <span className="block text-sm font-extrabold text-stone-900 mt-0.5">18/24h</span>
            <span className="block text-[8px] text-stone-400">75%</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-hairline">
            <span className="block text-[8px] font-bold uppercase text-stone-500">Study Streak</span>
            <span className="block text-sm font-extrabold text-stone-900 mt-0.5">12</span>
            <span className="block text-[8px] text-stone-400">days</span>
          </div>
        </div>
      </div>

      {/* Mini Grid: Tasks & Subject Progress */}
      <div className="grid grid-cols-5 gap-3">
        {/* Left: Today's Tasks */}
        <div className="col-span-3 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-semibold text-stone-700">
            <span>Today's Tasks</span>
            <span className="text-[9px] text-stone-400">5 tasks</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between p-1.5 rounded bg-cream-100/60 border border-hairline text-[10px] text-stone-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-3.5 h-3.5 rounded bg-stone-800 text-cream flex items-center justify-center shrink-0 text-[8px]">
                  ✓
                </span>
                <span className="line-through truncate">Polity - Fundamental Rights</span>
              </div>
              <span className="font-mono text-[9px] shrink-0">45m</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-cream-100/60 border border-hairline text-[10px] text-stone-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-3.5 h-3.5 rounded bg-stone-800 text-cream flex items-center justify-center shrink-0 text-[8px]">
                  ✓
                </span>
                <span className="line-through truncate">Economy - Inflation</span>
              </div>
              <span className="font-mono text-[9px] shrink-0">60m</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-white border border-hairline text-[10px] text-stone-800">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-3.5 h-3.5 rounded border border-stone-300 shrink-0" />
                <span className="truncate">Current Affairs - The Hindu</span>
              </div>
              <span className="font-mono text-[9px] text-stone-500 shrink-0">30m</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-white border border-hairline text-[10px] text-stone-800">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-3.5 h-3.5 rounded border border-stone-300 shrink-0" />
                <span className="truncate">Mock Test - GS Paper 1</span>
              </div>
              <span className="font-mono text-[9px] text-stone-500 shrink-0">90m</span>
            </div>
          </div>
        </div>

        {/* Right: Subject Progress */}
        <div className="col-span-2 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-semibold text-stone-700">
            <span>Subject Progress</span>
          </div>

          <div className="space-y-1.5 text-[9px]">
            <div>
              <div className="flex justify-between text-stone-600 mb-0.5">
                <span>Polity</span>
                <span className="font-mono font-bold">78%</span>
              </div>
              <div className="w-full bg-cream-200 h-1 rounded-full overflow-hidden">
                <div className="bg-maroon-800 h-full w-[78%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-600 mb-0.5">
                <span>Economy</span>
                <span className="font-mono font-bold">64%</span>
              </div>
              <div className="w-full bg-cream-200 h-1 rounded-full overflow-hidden">
                <div className="bg-maroon-800 h-full w-[64%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-600 mb-0.5">
                <span>History</span>
                <span className="font-mono font-bold">52%</span>
              </div>
              <div className="w-full bg-cream-200 h-1 rounded-full overflow-hidden">
                <div className="bg-maroon-800 h-full w-[52%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
