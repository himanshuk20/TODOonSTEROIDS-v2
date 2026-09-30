import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .order('slot');

    if (error) throw error;

    // Get profile for current_plan_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_plan_id')
      .eq('id', user.id)
      .single();

    const currentPlanId = profile?.current_plan_id || plans?.[0]?.id || null;
    const occupiedSlots = new Set((plans || []).map((p: any) => p.slot));
    const canCreate = !occupiedSlots.has(1) || !occupiedSlots.has(2);

    return NextResponse.json({ plans: plans || [], currentPlanId, canCreate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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
    const { name, exam_date, slot } = body;
    if (!name || !exam_date) {
      return NextResponse.json({ error: 'Name and exam date are required' }, { status: 400 });
    }

    // Check two-plan rule
    const { data: existing } = await supabase
      .from('plans')
      .select('slot')
      .eq('user_id', user.id);

    const occupiedSlots = new Set((existing || []).map((p: any) => p.slot));
    let targetSlot: 1 | 2 = slot;
    if (!targetSlot) {
      if (!occupiedSlots.has(1)) targetSlot = 1;
      else if (!occupiedSlots.has(2)) targetSlot = 2;
      else {
        return NextResponse.json(
          { error: 'Maximum 2 study plans allowed.' },
          { status: 409 }
        );
      }
    }

    const { data: plan, error } = await supabase
      .from('plans')
      .insert({ user_id: user.id, slot: targetSlot, name, exam_date })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
