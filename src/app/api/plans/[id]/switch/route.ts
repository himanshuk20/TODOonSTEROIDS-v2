import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // Verify the plan belongs to this user
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found or unauthorized' }, { status: 404 });
    }

    // Update current_plan_id in profile
    await supabase
      .from('profiles')
      .update({ current_plan_id: id })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      currentPlan: plan,
      message: `Switched active plan to ${plan.name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to switch plan' }, { status: 500 });
  }
}
