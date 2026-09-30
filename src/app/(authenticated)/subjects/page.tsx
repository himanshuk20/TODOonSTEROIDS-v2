'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle,
  BookOpen,
  ChevronRight,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { NoPlanEmptyState } from '@/components/plans/NoPlanEmptyState';

export default function SubjectsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading, isFetching: plansFetching } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to load study plans');
      return res.json() as Promise<{ plans: Array<{ id: string }>; currentPlanId: string | null }>;
    },
  });
  const activePlanId = plansData?.currentPlanId;

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', activePlanId || 'no-active-plan'],
    enabled: !plansLoading && !plansFetching,
    queryFn: async () => {
      const url = activePlanId
        ? `/api/subjects?planId=${encodeURIComponent(activePlanId)}`
        : '/api/subjects';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load subjects');
      return res.json();
    },
  });

  if (plansData && plansData.plans.length === 0) {
    return <NoPlanEmptyState />;
  }

  if (plansLoading || plansFetching || subjectsLoading || !subjectsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-800" />
      </div>
    );
  }

  const { subjects, stats } = subjectsData;
  const activeSubject = subjects.find((s: any) => s.id === selectedSubjectId) || subjects[0];

  const upcomingTopics = subjects.flatMap((subject: any) =>
    (subject.topics || [])
      .filter((topic: any) => topic.status !== 'completed')
      .map((topic: any) => ({
        title: topic.name,
        tag: topic.status === 'in_progress' ? 'In progress' : 'Upcoming',
        subject: subject.name,
      }))
  ).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 mb-1">
          SUBJECTS
        </p>
        <h1 className="font-editorial text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
          Master Every Subject.{' '}
          <span className="font-editorial italic font-normal text-maroon-800">
            I'll do it later — Crap, do it now.
          </span>
        </h1>
        <p className="text-stone-600 text-sm mt-0.5">
          Track progress, manage your topics, and stay consistent across all subjects.
        </p>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subjects */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Total Subjects
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {stats.total_subjects}
          </div>
          <p className="text-xs text-stone-500 mt-1">Active subjects</p>
        </div>

        {/* Avg Completion */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Avg. Task Completion
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {stats.avg_completion}%
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            Based on this plan’s task statuses
          </p>
        </div>

        {/* Total Topics */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Total Topics
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {stats.total_topics}
          </div>
          <p className="text-xs text-stone-500 mt-1">Across all subjects</p>
        </div>

        {/* Completed Topics */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Completed Topics
          </span>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {stats.completed_topics}
          </div>
          <p className="text-xs text-stone-500 mt-1">out of {stats.total_topics}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2): Your Subjects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
            <h2 className="font-editorial text-xl font-bold text-stone-900 mb-6">
              Your Subjects
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj: any) => {
                const isSelected = activeSubject?.id === subj.id;
                return (
                  <div
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-maroon-800 bg-maroon-50/40 shadow-xs'
                        : 'border-hairline bg-white/70 hover:bg-cream-100 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-stone-900 text-sm">{subj.name}</h3>
                      <span className="text-xs font-mono font-bold text-maroon-800">
                        {subj.percent}%
                      </span>
                    </div>

                    <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-maroon-800 h-full rounded-full transition-all duration-300"
                        style={{ width: `${subj.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>
                        {subj.completed_tasks}/{subj.total_tasks} tasks
                      </span>
                      <span className="flex items-center gap-0.5 text-stone-600 font-medium">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subject Topic Drill-down */}
            {activeSubject && (
              <div className="mt-8 pt-6 border-t border-hairline">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>{activeSubject.name} Topics</span>
                    <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-cream-200 text-stone-700">
                      {activeSubject.topics?.length || 0}
                    </span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {activeSubject.topics?.map((topic: any) => {
                    const isDone = topic.status === 'completed';
                    const isInProgress = topic.status === 'in_progress';
                    return (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-hairline text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDone
                                ? 'bg-emerald-600'
                                : isInProgress
                                ? 'bg-amber-500'
                                : 'bg-stone-300'
                            }`}
                          />
                          <span className={`font-medium ${isDone ? 'text-stone-800' : 'text-stone-700'}`}>
                            {topic.name}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isInProgress
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {topic.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Subject Topics */}
        <div>
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-editorial text-lg font-bold text-stone-900">
              Upcoming Subject Topics
            </h3>

            <div className="space-y-3">
              {upcomingTopics.length === 0 ? (
                <p className="rounded-xl border border-hairline bg-white/80 p-4 text-xs text-stone-500">
                  No upcoming topics in this study plan.
                </p>
              ) : upcomingTopics.map((topic: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-hairline text-xs"
                >
                  <div>
                    <p className="font-semibold text-stone-800">{topic.title}</p>
                    <span className="text-[10px] text-stone-500 font-mono">{topic.subject}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-cream-200 text-stone-700 text-[10px] font-bold">
                    {topic.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
