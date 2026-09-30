'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CheckSquare,
  Calendar,
  Layers,
  BarChart3,
  Timer,
  ChevronRight,
  Layers3,
  Plus,
  Check,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plan } from '@/lib/types';

export function AuthenticatedSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch plans and current plan
  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json() as Promise<{
        plans: Plan[];
        currentPlanId: string;
        canCreate: boolean;
      }>;
    },
  });

  const currentPlan = plansData?.plans.find((p) => p.id === plansData.currentPlanId) || plansData?.plans[0];

  // Mutation to switch active plan
  const switchMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/api/plans/${planId}/switch`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to switch plan');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate ALL plan-scoped queries as per Architecture Section 5 & 14
      queryClient.invalidateQueries();
      refetchPlans();
      setSwitcherOpen(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to delete study plan');
      return body;
    },
    onSuccess: async () => {
      setDeleteError(null);
      setPlanToDelete(null);
      await queryClient.invalidateQueries();
      await refetchPlans();
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Subjects', href: '/subjects', icon: Layers },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Pomodoro', href: '/pomodoro', icon: Timer },
  ];

  return (
    <aside className="w-64 bg-cream border-r border-hairline flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="p-6">
        {/* Authenticated logo always returns to the home dashboard */}
        <Link
          href="/home"
          className="group block mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 rounded"
        >
          <span className="font-extrabold tracking-tight text-xl text-stone-900 group-hover:text-stone-700 transition-colors">
            TODO<span className="font-editorial italic font-normal text-maroon-800 text-2xl">on</span>STEROIDS
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-maroon-50 text-maroon-900 font-semibold border-l-4 border-maroon-800 shadow-sm pl-2.5'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-cream-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-maroon-800' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Plan Selector at the bottom */}
      <div className="p-4 border-t border-hairline bg-cream-50/50">
        <button
          type="button"
          onClick={() => {
            if (plansData && plansData.plans.length === 0) {
              router.push('/get-started');
              return;
            }
            setSwitcherOpen(true);
          }}
          className="w-full text-left p-2.5 rounded-lg hover:bg-cream-200 transition-colors flex items-center justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
        >
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {plansData && plansData.plans.length === 0 ? 'No plan yet' : 'Current Plan'}
            </span>
            <span className="block text-xs font-bold text-stone-800 group-hover:text-maroon-800 transition-colors truncate max-w-[150px]">
              {plansData ? currentPlan?.name || 'Add a plan' : 'Loading plans…'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-maroon-800 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Two-Plan Switcher Modal */}
      {switcherOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-cream border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="font-editorial text-lg font-bold text-stone-900">Switch Study Plan</h3>
                <p className="text-xs text-stone-500">
                  You can own at most 2 study plans at a time (Two-Plan Rule).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwitcherOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-cream-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              {plansData?.plans.map((p) => {
                const isSelected = p.id === currentPlan?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isSelected) {
                        switchMutation.mutate(p.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-maroon-800 bg-maroon-50/60 shadow-sm'
                        : 'border-hairline bg-cream-50 hover:bg-cream-200/70 hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-maroon-800">
                          Slot {p.slot}
                        </span>
                        <span className="text-sm font-semibold text-stone-900">{p.name}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteError(null);
                            setPlanToDelete(p);
                          }}
                          aria-label={`Delete ${p.name}`}
                          title="Delete plan"
                          className="ml-1 rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Exam Target: {p.exam_date}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-maroon-800 bg-maroon-100 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-medium text-stone-600 hover:text-maroon-800 underline"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-hairline flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Plans used: {plansData?.plans.length || 0} / 2
              </span>
              <button
                type="button"
                onClick={() => {
                  setSwitcherOpen(false);
                  router.push('/get-started');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-cream text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Import New Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {planToDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-plan-title"
          aria-describedby="delete-plan-description"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-cream p-6 shadow-2xl">
            <h3 id="delete-plan-title" className="font-editorial text-xl font-bold text-stone-900">
              Delete {planToDelete.name}?
            </h3>
            <p id="delete-plan-description" className="mt-2 text-sm leading-6 text-stone-600">
              Are you sure you want to delete this plan? All progress and data for this plan will be lost.
            </p>
            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {deleteError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteMutation.isPending) return;
                  setPlanToDelete(null);
                  setDeleteError(null);
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-cream-200 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(planToDelete.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
