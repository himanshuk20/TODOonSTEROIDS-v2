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
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const planId = await resolveCurrentPlanId(supabase, user.id, searchParams.get('planId'));

    if (!planId) {
      return NextResponse.json({
        plan: null,
        days_left: 0,
        today_tasks_completed: 0,
        today_tasks_total: 0,
        today_progress_percent: 0,
        weekly_hours_completed: 0,
        weekly_hours_goal: 24,
        weekly_goal_percent: 0,
        study_streak_days: 0,
        today_tasks: [],
        subject_progress: [],
        upcoming_tasks: [],
        week_distribution: [],
      });
    }

    // Fetch plan
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const todayStr = getIndiaDateKey();

    // Fetch all non-deleted tasks
    const { data: allTasksRaw } = await supabase
      .from('tasks')
      .select('id, title, scheduled_date, status, duration, time_slot, subject_id, topic_id, subjects(name), topics(name)')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('scheduled_date');

    const allTasks = (allTasksRaw || []).map((t: any) => ({
      ...t,
      subject_name: t.subjects?.name || 'General',
      topic_name: t.topics?.name || null,
      subjects: undefined,
      topics: undefined,
    }));

    // Today's tasks
    const todayTasks = allTasks.filter((t: any) => t.scheduled_date === todayStr);
    const today_tasks_completed = todayTasks.filter((t: any) => t.status === 'completed').length;
    const today_tasks_total = todayTasks.length;
    const today_progress_percent = today_tasks_total > 0
      ? Math.round((today_tasks_completed / today_tasks_total) * 100) : 0;

    // Days left
    const examDate = new Date(`${plan.exam_date}T00:00:00.000Z`);
    const today = new Date(`${todayStr}T00:00:00.000Z`);
    const diffMs = examDate.getTime() - today.getTime();
    const days_left = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    // Weekly hours (Monday–Sunday in the India calendar)
    const dayOfWeek = today.getUTCDay();
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const weekTasks = allTasks.filter((t: any) => {
      return t.scheduled_date >= monday.toISOString().split('T')[0] &&
             t.scheduled_date <= sunday.toISOString().split('T')[0];
    });
    const completedMinutes = weekTasks
      .filter((t: any) => t.status === 'completed')
      .reduce((sum: number, t: any) => sum + (t.duration || 45), 0);
    const weekly_hours_completed = Math.round((completedMinutes / 60) * 10) / 10;
    const weekly_hours_goal = 24;
    const weekly_goal_percent = Math.min(100, Math.round((weekly_hours_completed / weekly_hours_goal) * 100));

    // Subject progress follows live task completion, including subjects with no tasks yet.
    const { data: subjectsRaw } = await supabase
      .from('subjects')
      .select('id, name, topics(id, status)')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('created_at');

    const subject_progress = (subjectsRaw || []).map((s: any) => {
      const subjectTasks = allTasks.filter((task: any) => task.subject_id === s.id);
      const completedTasks = subjectTasks.filter((task: any) => task.status === 'completed').length;
      return {
        subject_id: s.id,
        subject_name: s.name,
        completed_topics: completedTasks,
        total_topics: subjectTasks.length,
        percent: subjectTasks.length > 0 ? Math.round((completedTasks / subjectTasks.length) * 100) : 0,
      };
    });

    // Upcoming tasks (next 5 non-completed after today)
    const upcoming_tasks = allTasks
      .filter((t: any) => t.scheduled_date > todayStr && t.status !== 'completed')
      .slice(0, 5);

    // Week distribution (Mon–Sun of current week)
    const week_distribution = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const ds = d.toISOString().split('T')[0];
      const dayTasks = allTasks.filter((t: any) => t.scheduled_date === ds);
      week_distribution.push({
        day_name: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
        day_number: d.getUTCDate(),
        date: ds,
        tasks_count: dayTasks.length,
        completed_count: dayTasks.filter((t: any) => t.status === 'completed').length,
      });
    }

    // Study streak
    let study_streak_days = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      const dayDone = allTasks.filter((t: any) => t.scheduled_date === ds && t.status === 'completed').length;
      if (dayDone > 0) {
        study_streak_days++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else if (i === 0) {
        checkDate.setUTCDate(checkDate.getUTCDate() - 1); // skip today if no tasks yet
      } else {
        break;
      }
    }

    return NextResponse.json({
      plan,
      days_left,
      today_tasks_completed,
      today_tasks_total,
      today_progress_percent,
      weekly_hours_completed,
      weekly_hours_goal,
      weekly_goal_percent,
      study_streak_days,
      today_tasks: todayTasks,
      subject_progress,
      upcoming_tasks,
      week_distribution,
    });
  } catch (error: any) {
    console.error('[GET /api/dashboard]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard' }, { status: 500 });
  }
}
