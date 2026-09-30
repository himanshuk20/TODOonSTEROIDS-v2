import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIndiaDateKey } from '@/lib/date';

async function resolveCurrentPlanId(supabase: any, userId: string, requestedPlanId?: string | null) {
  if (requestedPlanId) return requestedPlanId;
  const { data: profile } = await supabase.from('profiles').select('current_plan_id').eq('id', userId).single();
  if (profile?.current_plan_id) return profile.current_plan_id;
  const { data: firstPlan } = await supabase.from('plans').select('id').eq('user_id', userId).order('slot').limit(1).single();
  return firstPlan?.id || null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'weekly';
    const planId = await resolveCurrentPlanId(supabase, user.id, searchParams.get('planId'));
    if (!planId) {
      return NextResponse.json({
        tasks_completed: 0, tasks_planned: 0, completion_rate: 0,
        completion_rate_change: null,
        study_streak: 0, total_study_hours: 0,
        consistency_series: [], subject_breakdown: [],
        task_breakdown: { completed: 0, pending: 0, skipped: 0, total: 0 },
      });
    }

    // All non-deleted tasks for this plan
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, status, duration, scheduled_date, subject_id, subjects(name)')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('scheduled_date');

    if (error) throw error;

    const allTasks = tasks || [];
    const completed = allTasks.filter((t: any) => t.status === 'completed').length;
    const skipped = allTasks.filter((t: any) => t.status === 'skipped').length;
    const pending = allTasks.filter((t: any) => t.status === 'pending').length;
    const total = allTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalMinutes = allTasks
      .filter((t: any) => t.status === 'completed')
      .reduce((sum: number, t: any) => sum + (t.duration || 45), 0);

    // Compare the current Monday-to-Sunday week with the previous week.
    const today = new Date(`${getIndiaDateKey()}T00:00:00.000Z`);
    const currentWeekStart = new Date(today);
    currentWeekStart.setUTCHours(0, 0, 0, 0);
    currentWeekStart.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
    const dateKey = (date: Date) => date.toISOString().split('T')[0];
    const currentWeekKey = dateKey(currentWeekStart);
    const previousWeekKey = dateKey(previousWeekStart);
    const nextWeekKey = dateKey(nextWeekStart);
    const currentWeekTasks = allTasks.filter((task: any) =>
      task.scheduled_date >= currentWeekKey && task.scheduled_date < nextWeekKey
    );
    const previousWeekTasks = allTasks.filter((task: any) =>
      task.scheduled_date >= previousWeekKey && task.scheduled_date < currentWeekKey
    );
    const rateFor = (items: any[]) => items.length
      ? Math.round((items.filter((task) => task.status === 'completed').length / items.length) * 100)
      : 0;
    const completionRateChange = previousWeekTasks.length
      ? rateFor(currentWeekTasks) - rateFor(previousWeekTasks)
      : null;

    // Weekly shows the last 7 days; Monthly shows the last 12 calendar months.
    const days: { label: string; date: string; completion_rate: number; tasks_done: number; tasks_total: number }[] = [];
    if (range === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
        const monthKey = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;
        const monthTasks = allTasks.filter((task: any) => task.scheduled_date.startsWith(monthKey));
        const monthDone = monthTasks.filter((task: any) => task.status === 'completed').length;
        days.push({
          label: month.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' }),
          date: `${monthKey}-01`,
          completion_rate: monthTasks.length ? Math.round((monthDone / monthTasks.length) * 100) : 0,
          tasks_done: monthDone,
          tasks_total: monthTasks.length,
        });
      }
    } else {
      const dayCount = 7;
      for (let i = dayCount - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - i);
        const dateStr = dateKey(date);
        const dayTasks = allTasks.filter((task: any) => task.scheduled_date === dateStr);
        const dayDone = dayTasks.filter((task: any) => task.status === 'completed').length;
        days.push({
          label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
          date: dateStr,
          completion_rate: dayTasks.length ? Math.round((dayDone / dayTasks.length) * 100) : 0,
          tasks_done: dayDone,
          tasks_total: dayTasks.length,
        });
      }
    }

    // Subject completion is based on the live task states for each subject.
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('plan_id', planId)
      .eq('user_id', user.id);
    if (subjectError) throw subjectError;

    const subjectBreakdown = (subjects || []).map((subject: any) => {
      const subjectTasks = allTasks.filter((task: any) => task.subject_id === subject.id);
      const subjectCompleted = subjectTasks.filter((task: any) => task.status === 'completed').length;
      return {
        name: subject.name,
        percent: subjectTasks.length ? Math.round((subjectCompleted / subjectTasks.length) * 100) : 0,
        completed_tasks: subjectCompleted,
        total_tasks: subjectTasks.length,
      };
    });

    // Study streak
    let streak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      const dayTasks = allTasks.filter((t: any) => t.scheduled_date === ds);
      const hasDone = dayTasks.some((t: any) => t.status === 'completed');
      if (hasDone) { streak++; checkDate.setUTCDate(checkDate.getUTCDate() - 1); }
      else if (i === 0) { checkDate.setUTCDate(checkDate.getUTCDate() - 1); } // today might not have tasks yet
      else break;
    }

    return NextResponse.json({
      tasks_completed: completed,
      tasks_planned: total,
      completion_rate: completionRate,
      completion_rate_change: completionRateChange,
      study_streak: streak,
      total_study_hours: Math.round((totalMinutes / 60) * 10) / 10,
      consistency_series: days,
      subject_breakdown: subjectBreakdown,
      task_breakdown: { completed, pending, skipped, total },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
