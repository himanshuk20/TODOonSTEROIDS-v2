'use client';

import React from 'react';
import { CheckCircle2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Monitor your consistency',
      desc: 'Track your daily streak, weekly hours, and task completion percentage over time with zero manual math.',
    },
    {
      num: '02',
      title: 'Analyze subject-wise progress',
      desc: 'See which subjects need more focus, which topics are completed, and where your preparation has gaps.',
    },
    {
      num: '03',
      title: 'Stay accountable',
      desc: 'Turn your effort into real data and exam-ready results with Pomodoro focus sessions and reproducible analytics.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t border-hairline/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Steps (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold mb-2">
                TRACK YOUR PROGRESS
              </p>
              <h2 className="font-editorial text-3xl md:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
                Track Your Progress.{' '}
                <span className="font-editorial italic font-normal text-maroon-800">
                  Lock in, Get it done.
                </span>
              </h2>
              <p className="text-stone-600 text-sm md:text-base mt-3 leading-relaxed">
                See how consistent you've been, which subjects you're focusing on, and where you can improve before exam day.
              </p>
            </div>

            {/* 3 Numbered Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-4 group">
                  <div className="font-mono text-xs font-bold text-maroon-800 bg-maroon-50 border border-maroon-200 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-maroon-800 group-hover:text-cream transition-colors">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-stone-900 group-hover:text-maroon-800 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs md:text-sm text-stone-600 mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95"
              >
                Start Tracking Today <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Full Dashboard-Style HTML/CSS Composition (7 cols, NO CROPPED SCREENSHOT) */}
          <div className="lg:col-span-7">
            <div className="bg-cream-50/95 border border-hairline rounded-3xl p-6 md:p-8 shadow-preview space-y-6">
              {/* Top mini header */}
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-maroon-800 font-bold">
                    ANALYTICS PREVIEW
                  </span>
                  <h4 className="font-editorial text-xl font-bold text-stone-900">
                    Track Your Progress. Lock in, Get it done.
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 bg-cream-200/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-stone-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>

              {/* 4 Stat Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-hairline rounded-xl p-3 shadow-2xs">
                  <span className="block text-[9px] font-bold uppercase text-stone-400">Tasks</span>
                  <span className="block text-xl font-extrabold text-stone-900 mt-0.5">18</span>
                  <span className="block text-[9px] text-stone-400">out of 28 planned</span>
                </div>
                <div className="bg-white border border-hairline rounded-xl p-3 shadow-2xs">
                  <span className="block text-[9px] font-bold uppercase text-stone-400">Rate</span>
                  <span className="block text-xl font-extrabold text-stone-900 mt-0.5">64%</span>
                  <span className="block text-[9px] text-emerald-700 font-medium">+12% vs last week</span>
                </div>
                <div className="bg-white border border-hairline rounded-xl p-3 shadow-2xs">
                  <span className="block text-[9px] font-bold uppercase text-stone-400">Streak</span>
                  <span className="block text-xl font-extrabold text-stone-900 mt-0.5">12</span>
                  <span className="block text-[9px] text-stone-400">days active</span>
                </div>
                <div className="bg-white border border-hairline rounded-xl p-3 shadow-2xs">
                  <span className="block text-[9px] font-bold uppercase text-stone-400">Time</span>
                  <span className="block text-xl font-extrabold text-stone-900 mt-0.5">28.5 hrs</span>
                  <span className="block text-[9px] text-stone-400">this week</span>
                </div>
              </div>

              {/* Consistency Mini Chart */}
              <div className="bg-white border border-hairline rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Study Consistency</span>
                  <span className="font-mono text-[10px] text-stone-400">Weekly rate</span>
                </div>

                <div className="h-28 w-full pt-2">
                  <svg viewBox="0 0 400 90" className="w-full h-full select-none overflow-visible">
                    <defs>
                      <linearGradient id="hw-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B1D24" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8B1D24" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 60 C 50 65, 80 40, 120 45 C 160 50, 190 25, 230 30 C 270 35, 300 20, 340 18 C 360 16, 380 22, 390 20 L 390 85 L 10 85 Z"
                      fill="url(#hw-gradient)"
                    />
                    <path
                      d="M 10 60 C 50 65, 80 40, 120 45 C 160 50, 190 25, 230 30 C 270 35, 300 20, 340 18 C 360 16, 380 22, 390 20"
                      fill="none"
                      stroke="#8B1D24"
                      strokeWidth="2.5"
                    />
                    {[
                      { x: 10, y: 60 },
                      { x: 120, y: 45 },
                      { x: 230, y: 30 },
                      { x: 340, y: 18 },
                      { x: 390, y: 20 },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke="#8B1D24"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Subject Completion Bars */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 bg-white border border-hairline rounded-2xl p-4 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    Subject Completion
                  </span>
                  {[
                    { name: 'Polity', pct: 78 },
                    { name: 'Economy', pct: 64 },
                    { name: 'History', pct: 52 },
                  ].map((s) => (
                    <div key={s.name} className="text-[10px]">
                      <div className="flex justify-between text-stone-700 mb-0.5">
                        <span className="font-medium">{s.name}</span>
                        <span className="font-mono font-bold">{s.pct}%</span>
                      </div>
                      <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-maroon-800 h-full rounded-full"
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 bg-white border border-hairline rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Upcoming Milestones
                  </span>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="p-1.5 bg-cream-100 rounded border border-hairline truncate">
                      <span className="font-semibold text-stone-800">GS Paper 1 Mock</span>
                      <span className="block text-[9px] text-stone-400">25 Sep 2026</span>
                    </div>
                    <div className="p-1.5 bg-cream-100 rounded border border-hairline truncate">
                      <span className="font-semibold text-stone-800">Current Affairs Rev.</span>
                      <span className="block text-[9px] text-stone-400">26 Sep 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
