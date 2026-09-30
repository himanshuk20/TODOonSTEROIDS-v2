'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Calendar as CalendarIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/lib/types';
import { getIndiaDateKey } from '@/lib/date';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const todayDateKey = getIndiaDateKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayDateKey);
  const [currentYear, setCurrentYear] = useState(() => Number(todayDateKey.slice(0, 4)));
  const [currentMonth, setCurrentMonth] = useState(() => Number(todayDateKey.slice(5, 7)) - 1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTimeSlot, setNewTaskTimeSlot] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('60');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch calendar tasks
  const { data: calendarData, isLoading } = useQuery<{
    tasks: Task[];
    tasksByDate: Record<string, Task[]>;
  }>({
    queryKey: ['calendar'],
    queryFn: async () => {
      const res = await fetch('/api/calendar');
      if (!res.ok) throw new Error('Failed to load calendar');
      return res.json();
    },
  });

  // Fetch subjects for task creation
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });

  // Toggle task status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const nextStatus = status === 'completed' ? 'pending' : 'completed';
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  // Add task to selected date
  const addTaskMutation = useMutation({
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
      setNewTaskTitle('');
      setNewTaskSubjectId('');
      setNewSubjectName('');
      setNewTaskTimeSlot('');
      setFormError(null);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setFormError(err.message);
    },
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar days generation
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedDateTasks = calendarData?.tasksByDate?.[selectedDate] || [];

  // Format selected date for header: "Sat, 5 Sep 2026"
  const formattedSelectedDate = (() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(`${selectedDate}T00:00:00.000Z`);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }
    return selectedDate;
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 mb-1">
          CALENDAR
        </p>
        <h1 className="font-editorial text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
          Every Deadline. Every Test. One Place.
        </h1>
        <p className="text-stone-600 text-sm mt-0.5">No surprises — know what's coming.</p>
      </div>

      {/* Main Grid: Calendar on Left (2 cols), Selected Day Panel on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Month Calendar */}
        <div className="lg:col-span-2 bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-hairline">
            <button
              type="button"
              onClick={() => {
                const today = getIndiaDateKey();
                setCurrentYear(Number(today.slice(0, 4)));
                setCurrentMonth(Number(today.slice(5, 7)) - 1);
                setSelectedDate(today);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-hairline bg-white hover:bg-cream-200 transition-colors"
            >
              • Today
            </button>

            <h2 className="font-editorial text-xl font-bold text-stone-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-cream-200 border border-hairline text-stone-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-cream-200 border border-hairline text-stone-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-xs font-semibold uppercase tracking-wider text-stone-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[75px] rounded-xl bg-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const dayTasks = calendarData?.tasksByDate?.[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayDateKey;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[80px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-maroon-800 bg-maroon-50/50 shadow-xs'
                      : isToday
                      ? 'border-stone-400 bg-white font-semibold'
                      : 'border-hairline bg-white/70 hover:bg-cream-100 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-maroon-900 font-extrabold' : 'text-stone-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-maroon-800" title="Today" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-cream-200/70 text-stone-700 flex items-center gap-1 font-mono"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-maroon-800 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-stone-400 block pl-1">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Day Details */}
        <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <div className="border-b border-hairline pb-3">
              <h3 className="font-editorial text-xl font-bold text-stone-900">
                {formattedSelectedDate}
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'} scheduled
              </p>
            </div>

            {/* Task list for selected date */}
            <div className="space-y-2.5">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  No tasks scheduled for this day. Click below to add one.
                </div>
              ) : (
                selectedDateTasks.map((t) => {
                  const isCompleted = t.status === 'completed';
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-cream-100/50 border-hairline text-stone-400'
                          : 'bg-white border-hairline shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate({ id: t.id, status: t.status })}
                          className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all ${
                            isCompleted
                              ? 'bg-stone-800 border-stone-800 text-cream'
                              : 'border-stone-300 hover:border-maroon-800 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold ${
                              isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.time_slot && (
                            <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                              {t.time_slot}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Task Button */}
          <div className="pt-6 border-t border-hairline mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
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
              <h3 className="font-editorial text-xl font-bold text-stone-900">
                Add Task for {formattedSelectedDate}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTaskTitle.trim()) {
                  setFormError('Please enter a task title');
                  return;
                }
                const isNewSubject = newTaskSubjectId === '__other__';
                const subjId = newTaskSubjectId || subjectsData?.subjects[0]?.id;
                if (isNewSubject && !newSubjectName.trim()) {
                  setFormError('Please enter a subject name');
                  return;
                }
                if (!isNewSubject && !subjId) {
                  setFormError('Please select a subject');
                  return;
                }
                addTaskMutation.mutate({
                  title: newTaskTitle.trim(),
                  subject_id: isNewSubject ? '' : subjId,
                  subject_name: isNewSubject ? newSubjectName.trim() : undefined,
                  duration: parseInt(newTaskDuration, 10) || 60,
                  scheduled_date: selectedDate,
                  time_slot: newTaskTimeSlot.trim() || undefined,
                });
              }}
              className="space-y-3"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polity Mock Test"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Subject
                  </label>
                  <select
                    value={newTaskSubjectId || subjectsData?.subjects?.[0]?.id || ''}
                    onChange={(e) => {
                      setNewTaskSubjectId(e.target.value);
                      setFormError(null);
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
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8:00 AM - 11:00 AM"
                    value={newTaskTimeSlot}
                    onChange={(e) => setNewTaskTimeSlot(e.target.value)}
                    className="w-full text-sm border border-hairline rounded-lg px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800"
                  />
                </div>
              </div>

              {newTaskSubjectId === '__other__' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
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
                  disabled={addTaskMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-maroon-800 text-cream text-xs font-semibold hover:bg-maroon-900 transition-colors shadow-xs"
                >
                  {addTaskMutation.isPending ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
