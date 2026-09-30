import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIndiaDateKey } from '@/lib/date';
import { z } from 'zod';

const pomodoroActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    type: z.enum(['focus', 'break']),
    planId: z.string().uuid().optional(),
    task_id: z.string().uuid().optional(),
  }).strict(),
  z.object({ action: z.literal('complete'), sessionId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('cancel'), sessionId: z.string().uuid() }).strict(),
]);

async function resolveCurrentPlanId(supabase: any, userId: string) {
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
    const planId = searchParams.get('planId') || await resolveCurrentPlanId(supabase, user.id);
    if (!planId) return NextResponse.json({ sessions: [], todayCount: 0, todayMinutes: 0 });

    const todayStr = getIndiaDateKey();
    const historyStartDate = new Date(`${todayStr}T00:00:00.000Z`);
    historyStartDate.setUTCDate(historyStartDate.getUTCDate() - 13);
    const historyStartStr = historyStartDate.toISOString().split('T')[0];
    const historyStartIso = new Date(`${historyStartStr}T00:00:00+05:30`).toISOString();

    const [sessionsResult, totalSessionsResult] = await Promise.all([
      supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .gte('started_at', historyStartIso)
        .order('started_at', { ascending: false }),
      supabase
        .from('pomodoro_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .eq('type', 'focus')
        .eq('status', 'completed'),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (totalSessionsResult.error) throw totalSessionsResult.error;
    const sessions = sessionsResult.data || [];

    const completedFocusSessions = sessions.filter((s: any) =>
      s.type === 'focus' && s.status === 'completed'
    );
    const todaySessions = completedFocusSessions.filter((s: any) =>
      s.started_at && getIndiaDateKey(new Date(s.started_at)) === todayStr
    );

    // Group sessions by date for the history chart (last 14 days)
    const historyByDate: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(`${todayStr}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - i);
      historyByDate[d.toISOString().split('T')[0]] = 0;
    }

    completedFocusSessions.forEach((s: any) => {
      const date = s.started_at ? getIndiaDateKey(new Date(s.started_at)) : null;
      if (date && historyByDate[date] !== undefined) {
        historyByDate[date]++;
      }
    });

    const historyChart = Object.entries(historyByDate).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      sessions,
      todayCount: todaySessions.length,
      todayMinutes: todaySessions.reduce((sum: number, s: any) => sum + (s.duration || 25), 0),
      totalFocusCount: totalSessionsResult.count || 0,
      historyChart,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch pomodoro data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const parsed = pomodoroActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid Pomodoro request' }, { status: 400 });

    if (parsed.data.action === 'start') {
      const planId = parsed.data.planId || await resolveCurrentPlanId(supabase, user.id);
      if (!planId) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

      const { data: sessionId, error } = await supabase.rpc('start_pomodoro_session', {
        p_plan_id: planId,
        p_task_id: parsed.data.task_id || null,
        p_type: parsed.data.type,
      });
      if (error) {
        console.error('[POST /api/pomodoro] Start rejected', error);
        return NextResponse.json({ error: 'Could not start this Pomodoro session' }, { status: 400 });
      }
      return NextResponse.json({ sessionId }, { status: 201 });
    }

    if (parsed.data.action === 'cancel') {
      const { data: cancelled, error } = await supabase.rpc('cancel_pomodoro_session', {
        p_session_id: parsed.data.sessionId,
      });
      if (error) {
        console.error('[POST /api/pomodoro] Cancel rejected', error);
        return NextResponse.json({ error: 'Could not cancel this Pomodoro session' }, { status: 400 });
      }
      return NextResponse.json({ cancelled: Boolean(cancelled) });
    }

    const { data: rows, error } = await supabase.rpc('complete_pomodoro_session', {
      p_session_id: parsed.data.sessionId,
    });
    if (error) {
      console.error('[POST /api/pomodoro] Completion rejected', error);
      return NextResponse.json({ error: 'Pomodoro session is not eligible for completion' }, { status: 400 });
    }
    const session = Array.isArray(rows) ? rows[0] : rows;
    if (!session) return NextResponse.json({ error: 'Pomodoro session not found' }, { status: 404 });

    if (session.session_type === 'focus' && session.completed_now) {
      const { error: activityError } = await supabase.from('activity_events').insert({
        user_id: user.id,
        plan_id: session.session_plan_id,
        entity_type: 'pomodoro',
        entity_id: session.session_id,
        event_type: 'POMODORO_COMPLETED',
        metadata: { duration: session.session_duration },
      });
      if (activityError) console.error('[POST /api/pomodoro] Activity log failed', activityError);
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error: any) {
    console.error('[POST /api/pomodoro] Request failed', error);
    return NextResponse.json({ error: 'Failed to process Pomodoro session' }, { status: 500 });
  }
}
