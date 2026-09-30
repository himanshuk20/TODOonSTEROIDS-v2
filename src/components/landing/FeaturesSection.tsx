'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileCode,
  Calendar as CalendarIcon,
  BarChart3,
  Sparkles,
  ArrowRight,
  Check,
  Clock,
} from 'lucide-react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 border-t border-hairline/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold">
            EVERYTHING YOU NEED TO STAY ON TRACK
          </p>
          <h2 className="font-editorial text-3xl md:text-5xl font-bold text-stone-900 tracking-tight">
            Built for ambitious exam aspirants.
          </h2>
          <p className="text-stone-600 text-sm md:text-base">
            Turn your extensive study syllabus into an organized daily system with scheduled tasks, deadlines, progress tracking, and zero friction.
          </p>
        </div>

        {/* 3 Distinct Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Plan once. Execute daily. (Plan Import & Structure) */}
          <div className="bg-cream-50/90 border border-hairline rounded-3xl p-6 md:p-8 shadow-card flex flex-col justify-between hover:border-stone-400 transition-all group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-maroon-50 border border-maroon-200 flex items-center justify-center text-maroon-800">
                <FileCode className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-editorial text-2xl font-bold text-stone-900">
                  Plan once. Execute daily.
                </h3>
                <p className="text-stone-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                  Import your study plan from ChatGPT. We validate, store, and turn it into structured daily tasks in seconds.
                </p>
              </div>

              {/* Distinct Visual: Import & JSON prompt module */}
              <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs space-y-3 mt-4">
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono pb-2 border-b border-hairline">
                  <span className="flex items-center gap-1.5 text-maroon-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Import from ChatGPT
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                    Validated JSON
                  </span>
                </div>

                <div className="font-mono text-[10px] text-stone-600 bg-cream-100/70 p-2.5 rounded-lg leading-relaxed">
                  <span className="text-stone-400">"examName":</span> "UPSC CSE 2027",<br />
                  <span className="text-stone-400">"subjects":</span> ["Polity", "Economy", "History"],<br />
                  <span className="text-stone-400">"scheduledTasks":</span> 28
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-200 font-semibold text-stone-700">
                    Polity
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-200 font-semibold text-stone-700">
                    Economy
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-200 font-semibold text-stone-700">
                    History
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Fast JSON Ingestion</span>
              <Link
                href="/get-started"
                className="text-xs font-bold text-maroon-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                Try Import <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: See what is coming. (Calendar Experience) */}
          <div className="bg-cream-50/90 border border-hairline rounded-3xl p-6 md:p-8 shadow-card flex flex-col justify-between hover:border-stone-400 transition-all group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                <CalendarIcon className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-editorial text-2xl font-bold text-stone-900">
                  See what is coming.
                </h3>
                <p className="text-stone-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                  A clean study calendar to track mock tests, chapter deadlines, and daily scheduled tasks in one place.
                </p>
              </div>

              {/* Distinct Visual: Month Calendar Grid module */}
              <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs space-y-2 mt-4">
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-hairline">
                  <span className="font-editorial font-bold text-stone-800">September 2026</span>
                  <span className="text-[10px] font-mono text-stone-400">Month view</span>
                </div>

                {/* Mini Calendar 5x5 grid representation */}
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className="text-stone-400 font-bold py-0.5">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: 14 }).map((_, i) => {
                    const day = i + 15;
                    const hasTask = [16, 18, 20, 22, 26, 28].includes(day);
                    const isToday = day === 28;
                    return (
                      <div
                        key={i}
                        className={`p-1 rounded-sm border ${
                          isToday
                            ? 'bg-maroon-800 text-cream font-bold border-maroon-800'
                            : hasTask
                            ? 'bg-cream-100 border-hairline text-stone-800'
                            : 'bg-white border-transparent text-stone-400'
                        }`}
                      >
                        <span>{day}</span>
                        {hasTask && !isToday && (
                          <div className="w-1 h-1 rounded-full bg-maroon-800 mx-auto mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-[10px] text-stone-500 font-medium flex items-center justify-between border-t border-hairline">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-maroon-800" /> Polity Mock Test
                  </span>
                  <span className="font-mono">8:00 AM</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Day & Week Planning</span>
              <Link
                href="/calendar"
                className="text-xs font-bold text-maroon-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                View Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Know how you're doing. (Analytics & Progress) */}
          <div className="bg-cream-50/90 border border-hairline rounded-3xl p-6 md:p-8 shadow-card flex flex-col justify-between hover:border-stone-400 transition-all group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                <BarChart3 className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-editorial text-2xl font-bold text-stone-900">
                  Know how you're doing.
                </h3>
                <p className="text-stone-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                  Detailed analytics to track completion rates, subject coverage, daily study streaks, and study time.
                </p>
              </div>

              {/* Distinct Visual: Analytics & Progress Bars module */}
              <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs space-y-3 mt-4">
                <div className="flex items-center justify-between pb-2 border-b border-hairline">
                  <div>
                    <span className="block text-[9px] font-mono uppercase text-stone-400">
                      Completion Rate
                    </span>
                    <span className="text-lg font-extrabold text-stone-900">64%</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    +12% vs last week
                  </span>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <div className="flex justify-between text-stone-600 mb-0.5">
                      <span>Polity</span>
                      <span className="font-mono font-bold">78%</span>
                    </div>
                    <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-maroon-800 h-full w-[78%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-600 mb-0.5">
                      <span>Economy</span>
                      <span className="font-mono font-bold">64%</span>
                    </div>
                    <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-maroon-800 h-full w-[64%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-600 mb-0.5">
                      <span>History</span>
                      <span className="font-mono font-bold">52%</span>
                    </div>
                    <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-maroon-800 h-full w-[52%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Live Metric Updates</span>
              <Link
                href="/analytics"
                className="text-xs font-bold text-maroon-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                See Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
