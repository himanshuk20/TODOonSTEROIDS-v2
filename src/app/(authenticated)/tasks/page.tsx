'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Check,
  Clock,
  Trash2,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus } from '@/lib/types';
import { getIndiaDateKey } from '@/lib/date';
import { ConfirmTaskDeletionDialog } from '@/components/tasks/ConfirmTaskDeletionDialog';
import { NoPlanEmptyState } from '@/components/plans/NoPlanEmptyState';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newDate, setNewDate] = useState(getIndiaDateKey());
  const [newDuration, setNewDuration] = useState('45');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Query the user's plans so an empty account gets a clear import prompt.
  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: Array<{ id: string }> }>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to fetch study plans');
      return res.json();
    },
  });

  // Query tasks
  const { data: tasksData, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  // Query subjects for dropdown
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      return res.json();
    },
  });

  // Toggle status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const nextStatus = status === 'completed' ? 'pending' : 'completed';
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setTaskToDelete(null);
      setDeleteError(null);
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Failed to delete task');
    },
  });

  // Add task
  const addMutation = useMutation({
    mutationFn: async (payload: any) => {
      let subjectId = payload.subject_id;
      if (payload.subject_name) {
        const subjectRes = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: payload.subject_name }),
        });
        const subjectData = await subjectRes.json();
        if (!subjectRes.ok) throw new Error(subjectData.error || 'Failed to create subject');
        subjectId = subjectData.subject.id;
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, subject_id: subjectId, subject_name: undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewSubjectId('');
      setNewSubjectName('');
      setNewTimeSlot('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setErrorMsg(err.message);
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Please enter a task title');
      return;
    }
    const isNewSubject = newSubjectId === '__other__';
    const subjId = newSubjectId || subjectsData?.subjects[0]?.id;
    if (isNewSubject && !newSubjectName.trim()) {
      setErrorMsg('Please enter a subject name');
      return;
    }
    if (!isNewSubject && !subjId) {
      setErrorMsg('Please select a subject');
      return;
    }

    addMutation.mutate({
      title: newTitle.trim(),
      subject_id: isNewSubject ? '' : subjId,
      subject_name: isNewSubject ? newSubjectName.trim() : undefined,
      scheduled_date: newDate,
      duration: parseInt(newDuration, 10) || 45,
      time_slot: newTimeSlot.trim() || undefined,
    });
  };

  const tasks = tasksData?.tasks || [];

  if (plansLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-maroon-800" />
      </div>
    );
  }

  if (plansData && plansData.plans.length === 0) {
    return <NoPlanEmptyState />;
  }

  const filteredTasks = tasks.filter((t) => {
    // Search
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Subject
    if (subjectFilter !== 'all' && t.subject_id !== subjectFilter) {
      return false;
    }
    // Status
    if (statusFilter === 'today' && t.scheduled_date !== getIndiaDateKey()) {
      return false;
    }
    if (statusFilter === 'pending' && t.status !== 'pending') {
      return false;
    }
    if (statusFilter === 'completed' && t.status !== 'completed') {
      return false;
    }
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 mb-1">
            TASK MANAGEMENT & EXECUTION
          </p>
          <h1 className="font-editorial text-3xl font-bold text-stone-900 tracking-tight">
            Study Tasks
          </h1>
          <p className="text-stone-600 text-sm mt-0.5">
            Execute your syllabus daily. Filter, track and complete.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-cream-50/90 border border-hairline rounded-2xl p-4 shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-cream-200/70 rounded-xl w-full md:w-auto">
          {(
            [
              { key: 'all', label: `All (${tasks.length})` },
              { key: 'today', label: 'Today' },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'completed', label: `Completed (${completedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Subject Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-hairline rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon-800"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs bg-white border border-hairline rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon-800"
          >
            <option value="all">All Subjects</option>
            {subjectsData?.subjects?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            No tasks found matching your filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-cream-100/50 border-hairline text-stone-400'
                    : 'bg-white border-hairline/80 hover:border-stone-400 text-stone-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: task.id,
                        status: task.status,
                      })
                    }
                    aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
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
                      className={`text-sm font-semibold truncate ${
                        isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                      <span className="px-2 py-0.5 bg-cream-200 rounded text-stone-700">
                        {task.subject_name || 'General'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" /> {task.scheduled_date}
                      </span>
                      {task.time_slot && (
                        <>
                          <span>•</span>
                          <span>{task.time_slot}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-stone-500 bg-cream-200/50 px-2 py-1 rounded">
                    {task.duration} min
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToDelete(task);
                      setDeleteError(null);
                    }}
                    aria-label="Delete task"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-cream border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-editorial text-xl font-bold text-stone-900">Add Task</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-cream-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Economy - Monetary Policy Revision"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId || subjectsData?.subjects?.[0]?.id || ''}
                    onChange={(e) => {
                      setNewSubjectId(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full text-xs border border-hairline rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  >
                    <option value="__other__">＋ Add other subject</option>
                    {subjectsData?.subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
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
                    max="480"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
              </div>

              {newSubjectId === '__other__' && (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 02:00 PM - 03:00 PM"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full text-xs border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-cream-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-maroon-800 text-cream text-xs font-semibold hover:bg-maroon-900 transition-colors shadow-xs disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmTaskDeletionDialog
        taskTitle={taskToDelete?.title || null}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setTaskToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          if (taskToDelete) deleteMutation.mutate(taskToDelete.id);
        }}
      />
    </div>
  );
}
