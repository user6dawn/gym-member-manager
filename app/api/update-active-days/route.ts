import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    // Get all active users with active subscriptions
    const { data: activeSubscriptions, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        status,
        subscriptions (
          id,
          payment_date,
          expiration_date,
          total_days,
          active_days,
          inactive_days,
          inactive_start_date,
          days_remaining
        )
      `)
      .eq('status', true)
      .is('subscriptions.inactive_start_date', null)
      .is('subscriptions.days_remaining', null);

    if (fetchError) throw fetchError;

    const today = new Date();
    let updatedCount = 0;

    for (const user of activeSubscriptions ?? []) {
      const subscription = user.subscriptions?.[0];
      if (!subscription) continue;

      const paymentDate = new Date(subscription.payment_date);
      const currentActiveDays = Math.floor(
        (today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const newActiveDays = Math.min(currentActiveDays, subscription.total_days);

      if (newActiveDays > subscription.active_days) {
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ active_days: newActiveDays })
          .eq('id', subscription.id);
        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Updated ${updatedCount} subscriptions` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}