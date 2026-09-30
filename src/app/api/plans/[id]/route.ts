import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { data: plan, error: planLookupError } = await supabase
      .from('plans')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (planLookupError) throw planLookupError;
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const { data: replacementPlan, error: replacementError } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .neq('id', id)
      .order('slot')
      .limit(1)
      .maybeSingle();

    if (replacementError) throw replacementError;

    const { data: profile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('current_plan_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;
    const deletingCurrentPlan = profile?.current_plan_id === id;

    // The schema cascades this delete to subjects, topics, tasks, sessions, and import metadata.
    const { data: deletedPlan, error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!deletedPlan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // The FK sets this to null when the active plan is deleted. Point it to the remaining
    // plan when possible; the plans endpoint also safely falls back if this update fails.
    if (deletingCurrentPlan) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_plan_id: replacementPlan?.id ?? null })
        .eq('id', user.id);

      if (profileError) console.error('[DELETE /api/plans/:id] Failed to update current plan', profileError);
    }

    return NextResponse.json({
      success: true,
      deletedPlanId: plan.id,
      currentPlanId: replacementPlan?.id ?? null,
    });
  } catch (error: any) {
    console.error('[DELETE /api/plans/:id]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete study plan' }, { status: 500 });
  }
}
