import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { manualTaskSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    // Resolve planId: use provided or get from profile
    let resolvedPlanId = planId;
    if (!resolvedPlanId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_plan_id')
        .eq('id', user.id)
        .single();
      resolvedPlanId = profile?.current_plan_id;

      if (!resolvedPlanId) {
        const { data: firstPlan } = await supabase
          .from('plans')
          .select('id')
          .eq('user_id', user.id)
          .order('slot')
          .limit(1)
          .single();
        resolvedPlanId = firstPlan?.id;
      }
    }

    if (!resolvedPlanId) {
      return NextResponse.json({ tasks: [] });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subjects (name),
        topics (name)
      `)
      .eq('plan_id', resolvedPlanId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('scheduled_date');

    if (error) throw error;

    // Flatten joins
    const flatTasks = (tasks || []).map((t: any) => ({
      ...t,
      subject_name: t.subjects?.name || 'General',
      topic_name: t.topics?.name || null,
      subjects: undefined,
      topics: undefined,
    }));

    return NextResponse.json({ tasks: flatTasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
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
    const validation = manualTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid task input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, subject_id, topic_id, scheduled_date, duration, time_slot } = validation.data;

    // Verify subject belongs to user
    const { data: subject, error: sErr } = await supabase
      .from('subjects')
      .select('plan_id')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single();

    if (sErr || !subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        plan_id: subject.plan_id,
        user_id: user.id,
        subject_id,
        topic_id: topic_id || null,
        title,
        scheduled_date,
        duration,
        time_slot: time_slot || null,
        status: 'pending',
      })
      .select(`*, subjects(name)`)
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_events').insert({
      user_id: user.id,
      plan_id: subject.plan_id,
      entity_type: 'task',
      entity_id: task.id,
      event_type: 'TASK_CREATED',
      metadata: { title },
    });

    return NextResponse.json(
      { task: { ...task, subject_name: task.subjects?.name || 'General', subjects: undefined } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add task' }, { status: 400 });
  }
}
