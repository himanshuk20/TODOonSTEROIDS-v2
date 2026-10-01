'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Check,
  ChevronDown,
  Trash2,
  X,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardMetrics, Task } from '@/lib/types';
import { formatIndiaDate, getIndiaDateKey, getIndiaGreeting } from '@/lib/date';
import { ConfirmTaskDeletionDialog } from '@/components/tasks/ConfirmTaskDeletionDialog';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [indiaNow, setIndiaNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateIndiaTime = () => setIndiaNow(new Date());
    updateIndiaTime();
    const interval = setInterval(updateIndiaTime, 60_000);
    return () => clearInterval(interval);
  }, []);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('45');
  const [newTaskTimeSlot, setNewTaskTimeSlot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch live dashboard metrics
  const { data: dashboard, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      return res.json();
    },
  });

  // Toggle task status mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries as per Architecture Section 6 & 14
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Delete task (soft-delete) mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setTaskToDelete(null);
      setDeleteError(null);
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Failed to delete task');
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: {
      title: string;
      subject_id: string;
      subject_name?: string;
      duration: number;
      scheduled_date: string;
      time_slot?: string;
    }) => {
      let subjectId = taskData.subject_id;
      if (taskData.subject_name) {
        const subjectRes = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: taskData.subject_name }),
        });
        const subjectPayload = await subjectRes.json();
        if (!subjectRes.ok) throw new Error(subjectPayload.error || 'Failed to create subject');
        subjectId = subjectPayload.subject.id;
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, subject_id: subjectId, subject_name: undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setAddTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskSubject('');
      setNewSubjectName('');
      setNewTaskTimeSlot('');
      setFormError(null);
    },
    onError: (err: any) => {
      // A new subject may already have been saved even if task creation failed.
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setFormError(err.message);
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setFormError('Please enter a task title');
      return;
    }
    const isNewSubject = newTaskSubject === '__other__';
    const subjectId = newTaskSubject || dashboard?.subject_progress[0]?.subject_id;
    if (isNewSubject && !newSubjectName.trim()) {
      setFormError('Please enter a subject name');
      return;
    }
    if (!isNewSubject && !subjectId) {
      setFormError('No subject available');
      return;
    }

    addTaskMutation.mutate({
      title: newTaskTitle.trim(),
      subject_id: isNewSubject ? '' : (subjectId ?? ''),
      subject_name: isNewSubject ? newSubjectName.trim() : undefined,
      duration: parseInt(newTaskDuration, 10) || 45,
      scheduled_date: getIndiaDateKey(),
      time_slot: newTaskTimeSlot.trim() || undefined,
    });
  };

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-800" />
      </div>
    );
  }

  if (!dashboard.plan) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-hairline bg-cream-50/90 p-8 text-center shadow-card">
        <h1 className="font-editorial text-3xl font-bold text-stone-900">Your study plan is ready to start</h1>
        <p className="mt-3 text-stone-600">Import a plan to see your tasks, schedule, and progress here.</p>
        <Link href="/get-started" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-maroon-800 px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-900">
          Import a study plan <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const filteredTasks =
    selectedSubjectFilter === 'all'
      ? dashboard.today_tasks
      : dashboard.today_tasks.filter((t) => t.subject_id === selectedSubjectFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Kicker & Greeting */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-1">
          DAILY / PROGRESS / STAY CONSISTENT / ACHIEVE MORE
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="font-editorial text-3xl md:text-4xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            {indiaNow ? getIndiaGreeting(indiaNow) : 'Welcome'}, Himanshu <span className="text-2xl">👋</span>
          </h1>
          <span className="text-xs font-mono text-stone-500">{indiaNow ? formatIndiaDate(indiaNow) : ''}</span>
        </div>
        <p className="text-stone-600 text-sm mt-0.5">Let's keep the momentum going.</p>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Days Left */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 truncate">
              {dashboard.plan.name}
            </span>
            <Calendar className="w-4 h-4 text-maroon-800 shrink-0" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {dashboard.days_left}
          </div>
          <p className="text-xs text-stone-500 mt-1">days left</p>
        </div>

        {/* Today's Progress */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Today's Progress
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {dashboard.today_tasks_completed}/{dashboard.today_tasks_total}
            </span>
            <span className="text-xs font-semibold text-stone-500">
              {dashboard.today_progress_percent}%
            </span>
          </div>
          <div className="w-full bg-cream-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-maroon-800 h-full rounded-full transition-all duration-300"
              style={{ width: `${dashboard.today_progress_percent}%` }}
            />
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Weekly Goal
            </span>
            <Clock className="w-4 h-4 text-stone-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {dashboard.weekly_hours_completed} / {dashboard.weekly_hours_goal} hrs
            </span>
          </div>
          <div className="w-full bg-cream-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-stone-800 h-full rounded-full transition-all duration-300"
              style={{ width: `${dashboard.weekly_goal_percent}%` }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-cream-50/90 border border-hairline rounded-xl p-5 shadow-card hover:border-stone-400 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Study Streak
            </span>
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {dashboard.study_streak_days}
          </div>
          <p className="text-xs text-stone-500 mt-1">days</p>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2): Today's Tasks & This Week */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Box */}
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-xl font-bold text-stone-900">Today's Tasks</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-stone-700">
                  {dashboard.today_tasks.length} tasks
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Subject Filter */}
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="text-xs border border-hairline bg-cream rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon-800"
                >
                  <option value="all">All Subjects</option>
                  {dashboard.subject_progress.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_name}
                    </option>
                  ))}
                </select>

                {/* Add Task Button */}
                <button
                  type="button"
                  onClick={() => setAddTaskModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-maroon-800 text-cream text-xs font-semibold hover:bg-maroon-900 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            </div>

            {/* Task Items */}
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No tasks scheduled for today in this category.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-cream-100/60 border-hairline text-stone-400'
                          : 'bg-white border-hairline/80 hover:border-stone-400 text-stone-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            toggleTaskMutation.mutate({
                              taskId: task.id,
                              currentStatus: task.status,
                            })
                          }
                          aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isCompleted
                              ? 'bg-stone-800 border-stone-800 text-cream'
                              : 'border-stone-300 hover:border-maroon-800 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCompleted ? 'line-through text-stone-400' : 'text-stone-800'
                            }`}
                          >
                            {task.title}
                          </p>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {task.subject_name} {task.time_slot ? `• ${task.time_slot}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-stone-500">
                          {task.duration} min
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskToDelete(task);
                            setDeleteError(null);
                          }}
                          aria-label="Delete task"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-700 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* This Week Section */}
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-editorial text-lg font-bold text-stone-900">This Week</h3>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Week view</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Days row */}
            <div className="grid grid-cols-7 gap-2">
              {dashboard.week_distribution.map((day) => {
                const isToday = day.date === getIndiaDateKey();
                return (
                  <div
                    key={day.date}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isToday
                        ? 'border-maroon-800 bg-maroon-50/40 font-bold'
                        : 'border-hairline bg-white/70'
                    }`}
                  >
                    <span className="block text-[11px] text-stone-500 uppercase">{day.day_name}</span>
                    <span
                      className={`block text-sm font-bold mt-1 ${
                        isToday ? 'text-maroon-800 font-extrabold' : 'text-stone-800'
                      }`}
                    >
                      {day.day_number}
                    </span>
                    <div className="mt-3 flex justify-center gap-0.5">
                      {Array.from({ length: Math.min(day.tasks_count, 4) }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-3 rounded-xs ${
                            i < day.completed_count ? 'bg-maroon-800' : 'bg-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Subject Progress & Upcoming */}
        <div className="space-y-6">
          {/* Subject Progress Card */}
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-editorial text-lg font-bold text-stone-900">Subject Progress</h3>
              <Link
                href="/subjects"
                className="text-xs font-semibold text-stone-600 hover:text-maroon-800 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {dashboard.subject_progress.map((subj) => (
                <div key={subj.subject_id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-800">{subj.subject_name}</span>
                    <span className="font-mono font-bold text-stone-600">{subj.percent}%</span>
                  </div>
                  <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-maroon-800 h-full rounded-full transition-all duration-300"
                      style={{ width: `${subj.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks Card */}
          <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-editorial text-lg font-bold text-stone-900">Upcoming</h3>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-stone-600 hover:text-maroon-800 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {dashboard.upcoming_tasks.length === 0 ? (
                <p className="text-xs text-stone-400">No upcoming tasks scheduled.</p>
              ) : (
                dashboard.upcoming_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/70 border border-hairline text-xs"
                  >
                    <span className="font-medium text-stone-800 truncate mr-2">{task.title}</span>
                    <span className="font-mono text-[10px] text-stone-500 shrink-0">
                      {task.scheduled_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {addTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-cream border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-editorial text-xl font-bold text-stone-900">Add Study Task</h3>
              <button
                type="button"
                onClick={() => setAddTaskModalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-cream-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polity - Fundamental Duties revision"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Subject
                  </label>
                  <select
                    value={newTaskSubject || dashboard.subject_progress[0]?.subject_id || ''}
                    onChange={(e) => {
                      setNewTaskSubject(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full text-xs border border-hairline rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  >
                    <option value="__other__">＋ Add other subject</option>
                    {dashboard.subject_progress.map((s) => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
              </div>

              {newTaskSubject === '__other__' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Name your subject
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Indian Economy"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Time Slot (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 11:00 AM"
                  value={newTaskTimeSlot}
                  onChange={(e) => setNewTaskTimeSlot(e.target.value)}
                  className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-cream-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTaskMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-maroon-800 text-cream text-xs font-semibold hover:bg-maroon-900 transition-colors shadow-xs disabled:opacity-50"
                >
                  {addTaskMutation.isPending ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmTaskDeletionDialog
        taskTitle={taskToDelete?.title || null}
        isDeleting={deleteTaskMutation.isPending}
        error={deleteError}
        onCancel={() => {
          if (!deleteTaskMutation.isPending) {
            setTaskToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          if (taskToDelete) deleteTaskMutation.mutate(taskToDelete.id);
        }}
      />
    </div>
  );
}
