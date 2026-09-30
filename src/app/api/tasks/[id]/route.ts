import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'completed', 'skipped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Log activity
    const eventType = status === 'completed' ? 'TASK_COMPLETED'
      : status === 'skipped' ? 'TASK_SKIPPED'
      : 'TASK_UPDATED';

    await supabase.from('activity_events').insert({
      user_id: user.id,
      plan_id: task.plan_id,
      entity_type: 'task',
      entity_id: id,
      event_type: eventType,
      metadata: { status },
    });

    return NextResponse.json({ task, message: `Task status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Task not found' }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: task, error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await supabase.from('activity_events').insert({
      user_id: user.id,
      plan_id: task.plan_id,
      entity_type: 'task',
      entity_id: id,
      event_type: 'TASK_DELETED',
    });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
