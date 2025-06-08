import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active users with active subscriptions
    const { data: activeSubscriptions, error: fetchError } = await supabase
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

    // Process each active subscription
    for (const user of activeSubscriptions) {
      const subscription = user.subscriptions[0];
      if (!subscription) continue;

      const paymentDate = new Date(subscription.payment_date);
      const currentActiveDays = Math.floor(
        (today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const newActiveDays = Math.min(currentActiveDays, subscription.total_days);

      // Only update if active days have changed
      if (newActiveDays > subscription.active_days) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            active_days: newActiveDays,
          })
          .eq('id', subscription.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${updatedCount} subscriptions` 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}); 