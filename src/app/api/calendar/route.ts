import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const planId = await resolveCurrentPlanId(supabase, user.id, searchParams.get('planId'));
    if (!planId) return NextResponse.json({ tasksByDate: {} });

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, scheduled_date, status, duration, time_slot, subject_id, subjects(name)')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('scheduled_date');

    if (error) throw error;

    // Group by date
    const tasksByDate: Record<string, any[]> = {};
    (tasks || []).forEach((t: any) => {
      const date = t.scheduled_date;
      if (!tasksByDate[date]) tasksByDate[date] = [];
      tasksByDate[date].push({
        ...t,
        subject_name: t.subjects?.name || 'General',
        subjects: undefined,
      });
    });

    return NextResponse.json({ tasksByDate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch calendar' }, { status: 500 });
  }
}
