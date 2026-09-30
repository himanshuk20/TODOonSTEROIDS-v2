import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function resolveCurrentPlanId(supabase: any, userId: string, requestedPlanId?: string | null) {
  if (requestedPlanId) return requestedPlanId;

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_plan_id')
    .eq('id', userId)
    .single();

  if (profile?.current_plan_id) return profile.current_plan_id;

  const { data: firstPlan } = await supabase
    .from('plans')
    .select('id')
    .eq('user_id', userId)
    .order('slot')
    .limit(1)
    .single();

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
    if (!planId) {
      return NextResponse.json({
        subjects: [],
        stats: { total_subjects: 0, avg_completion: 0, total_topics: 0, completed_topics: 0 },
      });
    }

    // Get subjects with topic counts
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select(`
        *,
        topics (id, name, status),
        tasks (id, status, deleted_at)
      `)
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('created_at');

    if (error) throw error;

    const result = (subjects || []).map((s: any) => {
      const topics = s.topics || [];
      const completedTopics = topics.filter((t: any) => t.status === 'completed').length;
      const tasks = (s.tasks || []).filter((task: any) => !task.deleted_at);
      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      return {
        id: s.id,
        plan_id: s.plan_id,
        name: s.name,
        created_at: s.created_at,
        total_topics: topics.length,
        completed_topics: completedTopics,
        total_tasks: tasks.length,
        completed_tasks: completedTasks,
        percent: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
        topics: topics.map((t: any) => ({ id: t.id, name: t.name, status: t.status })),
      };
    });

    const totalTopics = result.reduce((sum: number, subject: any) => sum + subject.total_topics, 0);
    const completedTopics = result.reduce((sum: number, subject: any) => sum + subject.completed_topics, 0);
    const stats = {
      total_subjects: result.length,
      avg_completion: result.length
        ? Math.round(result.reduce((sum: number, subject: any) => sum + subject.percent, 0) / result.length)
        : 0,
      total_topics: totalTopics,
      completed_topics: completedTopics,
    };

    return NextResponse.json({ subjects: result, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) {
      return NextResponse.json({ error: 'Enter a subject name (up to 100 characters).' }, { status: 400 });
    }

    const planId = await resolveCurrentPlanId(supabase, user.id, body.planId);
    if (!planId) {
      return NextResponse.json({ error: 'Create or select a study plan first.' }, { status: 400 });
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();
    if (planError || !plan) {
      return NextResponse.json({ error: 'Study plan not found.' }, { status: 404 });
    }

    // Reuse an existing subject with the same name in this plan, ignoring case.
    const { data: existingSubjects, error: lookupError } = await supabase
      .from('subjects')
      .select('id, plan_id, user_id, name, created_at')
      .eq('plan_id', planId)
      .eq('user_id', user.id);
    if (lookupError) throw lookupError;

    const existing = (existingSubjects || []).find(
      (subject: any) => subject.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (existing) return NextResponse.json({ subject: existing, created: false });

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({ plan_id: planId, user_id: user.id, name })
      .select('id, plan_id, user_id, name, created_at')
      .single();
    if (error) throw error;

    return NextResponse.json({ subject, created: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create subject' }, { status: 400 });
  }
}
