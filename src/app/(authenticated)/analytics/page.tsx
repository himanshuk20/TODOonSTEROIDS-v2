'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Flame,
  BarChart2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsData } from '@/lib/types';

export default function AnalyticsPage() {
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error('Failed to load analytics');
      return res.json();
    },
  });

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-800" />
      </div>
    );
  }

  // Calculate SVG line points for the consistency chart
  const series = analytics.consistency_series;
  const svgWidth = 700;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  const points = series.map((pt, idx) => {
    const x = series.length === 1
      ? svgWidth / 2
      : paddingX + (idx / (series.length - 1)) * (svgWidth - paddingX * 2);
    // Rate 0 to 100
    const y = svgHeight - paddingY - (pt.completion_rate / 100) * (svgHeight - paddingY * 2);
    return { x, y, label: pt.label, rate: pt.completion_rate };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    // Smooth bezier curve
    const prev = points[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Donut chart calculation
  const totalTasks = analytics.task_breakdown.total;
  const taskPercent = (count: number) => totalTasks ? Math.round((count / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 mb-1">
          ANALYTICS
        </p>
        <h1 className="font-editorial text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
          Track Your Progress.{' '}
          <span className="font-editorial italic font-normal text-maroon-800">
            Lock in, Get it done.
          </span>
        </h1>
        <p className="text-stone-600 text-sm mt-0.5">
          See how consistent you've been, which subjects you're focusing on, and where you can improve.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Completed */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Tasks Completed
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {analytics.tasks_completed}
          </div>
          <p className="text-xs text-stone-500 mt-1">out of {analytics.tasks_planned} planned</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Completion Rate
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {analytics.completion_rate}%
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1">
            {analytics.completion_rate_change === null
              ? 'No previous-week baseline'
              : `${analytics.completion_rate_change > 0 ? '+' : ''}${analytics.completion_rate_change}% vs previous week`}
          </p>
        </div>

        {/* Study Streak */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Study Streak
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {analytics.study_streak}
          </div>
          <p className="text-xs text-stone-500 mt-1">days</p>
        </div>

        {/* Total Study Time */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Completed Task Time
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {analytics.total_study_hours} hrs
          </div>
          <p className="text-xs text-stone-500 mt-1">From completed tasks</p>
        </div>
      </div>

      {/* Study Consistency Chart Card */}
      <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-editorial text-xl font-bold text-stone-900">Study Consistency</h2>
            <p className="text-xs text-stone-500">Your task completion rate over time</p>
          </div>

          {/* Range toggles */}
          <div className="flex items-center gap-1 bg-cream-200/70 p-1 rounded-xl self-start sm:self-auto">
            {(['weekly', 'monthly'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  range === r
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Chart */}
        {points.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-white/40 px-6 text-center">
            <p className="font-editorial text-lg font-semibold text-stone-800">No study plan yet</p>
            <p className="mt-1 text-sm text-stone-500">Import a plan to see your study progress and analytics here.</p>
            <Link href="/get-started" className="mt-4 rounded-lg bg-maroon-800 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-900">
              Add a plan
            </Link>
          </div>
        ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B1D24" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8B1D24" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#EAE4D8"
                strokeDasharray="4 4"
              />
              <line
                x1={paddingX}
                y1={svgHeight / 2}
                x2={svgWidth - paddingX}
                y2={svgHeight / 2}
                stroke="#EAE4D8"
                strokeDasharray="4 4"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#D9CFBF"
              />

              {/* Area fill */}
              <path d={areaD} fill="url(#gradient-area)" />

              {/* Smooth curve line */}
              <path
                d={pathD}
                fill="none"
                stroke="#8B1D24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, idx) => (
                <g key={idx} className="group cursor-pointer">
                  {/* Larger invisible hit target keeps hover reliable without moving the plotted point. */}
                  <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#8B1D24"
                    strokeWidth="2"
                    className="transition-colors group-hover:fill-maroon-100"
                  />
                  {/* Tooltip on hover */}
                  <text
                    x={pt.x}
                    y={Math.max(paddingY - 4, pt.y - 12)}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-stone-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {pt.rate}%
                  </text>
                  {/* Bottom date label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-stone-400 font-mono"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        )}
      </div>

      {/* Bottom 2 Columns: Subject-wise Completion & Task Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Subject-wise Completion */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
          <h2 className="font-editorial text-xl font-bold text-stone-900 mb-6">
            Subject-wise Completion
          </h2>

          <div className="space-y-4">
            {analytics.subject_breakdown.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-stone-800">{item.name}</span>
                  <span className="font-mono font-bold text-stone-700">{item.percent}%</span>
                </div>
                <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-maroon-800 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Task Completion Breakdown */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <h2 className="font-editorial text-xl font-bold text-stone-900 mb-4">
            Task Completion Breakdown
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* Donut Chart representation */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#E8E2D8"
                  strokeWidth="3.5"
                />
                {/* Completed slice */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#8B1D24"
                  strokeWidth="3.5"
                  strokeDasharray={`${taskPercent(analytics.task_breakdown.completed)} 100`}
                  strokeDashoffset="0"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-stone-900">
                  {analytics.task_breakdown.completed}/{totalTasks}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                  TASKS
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-xs w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-maroon-800" />
                  <span className="text-stone-700">Completed</span>
                </div>
                <span className="font-mono font-bold text-stone-900">
                  {analytics.task_breakdown.completed}{' '}
                  <span className="text-stone-400 font-normal">
                    ({taskPercent(analytics.task_breakdown.completed)}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-stone-400" />
                  <span className="text-stone-700">Pending</span>
                </div>
                <span className="font-mono font-bold text-stone-900">
                  {analytics.task_breakdown.pending}{' '}
                  <span className="text-stone-400 font-normal">
                    ({taskPercent(analytics.task_breakdown.pending)}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-stone-700">Skipped</span>
                </div>
                <span className="font-mono font-bold text-stone-900">
                  {analytics.task_breakdown.skipped}{' '}
                  <span className="text-stone-400 font-normal">
                    ({taskPercent(analytics.task_breakdown.skipped)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-3 text-[11px] text-stone-500 text-center font-mono">
            Derived from this plan’s current task statuses
          </div>
        </div>
      </div>
    </div>
  );
}
