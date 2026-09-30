import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { importPlanSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // The import page sends { planData, idempotencyKey }; accept that contract
    // while still allowing direct plan payloads for API callers.
    const planPayload = body?.planData ?? body;
    const validation = importPlanSchema.safeParse(planPayload);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid plan data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Use the request key so a deliberate re-import of the same exam can create
    // a fresh plan, while retries of the same request remain idempotent.
    const requestKey = typeof body?.idempotencyKey === 'string' && body.idempotencyKey.trim()
      ? body.idempotencyKey.trim()
      : `${data.examName}::${data.examDate}`;
    const idempotencyKey = `${user.id}::${requestKey}`;
    const { data: existingImport } = await supabase
      .from('plan_imports')
      .select('plan_id')
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingImport) {
      const { data: existingPlan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', existingImport.plan_id)
        .single();
      if (existingPlan) {
        const { error: activateError } = await supabase
          .from('profiles')
          .update({ current_plan_id: existingPlan.id })
          .eq('id', user.id);
        if (activateError) throw activateError;
      }
      return NextResponse.json(
        { plan: existingPlan, currentPlanId: existingPlan?.id ?? null, idempotent: true },
        { status: 200 }
      );
    }

    // Check two-plan limit
    const { data: existingPlans } = await supabase
      .from('plans')
      .select('slot')
      .eq('user_id', user.id);

    const occupiedSlots = new Set((existingPlans || []).map((p: any) => p.slot));
    let targetSlot: 1 | 2;

    if (body.targetSlot && (body.targetSlot === 1 || body.targetSlot === 2)) {
      targetSlot = body.targetSlot;
      // Delete existing plan in that slot if replacing
      if (occupiedSlots.has(targetSlot)) {
        const existingInSlot = (existingPlans || []).find((p: any) => p.slot === targetSlot);
        if (existingInSlot) {
          await supabase.from('plans').delete().eq('user_id', user.id).eq('slot', targetSlot);
        }
      }
    } else {
      if (!occupiedSlots.has(1)) targetSlot = 1;
      else if (!occupiedSlots.has(2)) targetSlot = 2;
      else {
        return NextResponse.json(
          { error: 'Two-plan limit reached. You can own at most 2 study plans.' },
          { status: 409 }
        );
      }
    }

    // Insert plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({ user_id: user.id, slot: targetSlot, name: data.examName, exam_date: data.examDate })
      .select()
      .single();

    if (planError) throw planError;

    // Insert subjects, topics, and tasks in sequence
    for (let sIdx = 0; sIdx < data.subjects.length; sIdx++) {
      const subjInput = data.subjects[sIdx];
      const { data: subject, error: sErr } = await supabase
        .from('subjects')
        .insert({ plan_id: plan.id, user_id: user.id, name: subjInput.name })
        .select()
        .single();
      if (sErr) throw sErr;

      for (let tIdx = 0; tIdx < subjInput.topics.length; tIdx++) {
        const topInput = subjInput.topics[tIdx];
        await supabase.from('topics').insert({
          subject_id: subject.id,
          plan_id: plan.id,
          user_id: user.id,
          name: topInput.name,
          status: topInput.status || 'pending',
        });
      }
    }

    // Fetch subjects map for tasks
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('plan_id', plan.id);

    const subjectMap = new Map((subjectsData || []).map((s: any) => [s.name.toLowerCase().trim(), s.id]));

    // Insert tasks in batch
    if (data.tasks.length > 0) {
      const taskRows = data.tasks.map((taskInput: any) => {
        const subjId = subjectMap.get(taskInput.subjectName.toLowerCase().trim()) ||
          (subjectsData?.[0]?.id ?? null);
        return {
          plan_id: plan.id,
          user_id: user.id,
          subject_id: subjId,
          title: taskInput.title,
          scheduled_date: taskInput.scheduledDate,
          duration: taskInput.durationMinutes,
          status: taskInput.status || 'pending',
          time_slot: taskInput.timeSlot || null,
        };
      });

      const { error: taskErr } = await supabase.from('tasks').insert(taskRows);
      if (taskErr) throw taskErr;
    }

    // Record idempotency key
    await supabase.from('plan_imports').insert({
      user_id: user.id,
      plan_id: plan.id,
      idempotency_key: idempotencyKey,
      version: '1.0',
    });

    // Make the new import active immediately.
    const { error: activateError } = await supabase
      .from('profiles')
      .update({ current_plan_id: plan.id })
      .eq('id', user.id);
    if (activateError) throw activateError;

    // Log activity
    await supabase.from('activity_events').insert({
      user_id: user.id,
      plan_id: plan.id,
      entity_type: 'plan',
      entity_id: plan.id,
      event_type: 'PLAN_IMPORTED',
      metadata: { plan_name: plan.name, slot: targetSlot },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/plans/import]', error);
    return NextResponse.json({ error: error.message || 'Failed to import plan' }, { status: 500 });
  }
}
