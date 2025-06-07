"use client";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, isAfter, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";

type Subscription = {
  id: string;
  payment_date: string;
  expiration_date: string;
  total_days: number;
  active_days: number;
  inactive_days: number;
  inactive_start_date: string | null;
  days_remaining: number | null;
};

type MemberStatusToggleProps = {
  userId: string;
  isActive: boolean;
  latestSubscription?: Subscription;
  onStatusChange?: (newStatus: boolean) => void;
  className?: string;
};

export function MemberStatusToggle({
  userId,
  isActive,
  latestSubscription,
  onStatusChange,
  className
}: MemberStatusToggleProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  const hasActiveSubscription = () => {
    if (!latestSubscription) return false;
    const today = new Date();
    const expirationDate = new Date(latestSubscription.expiration_date);
    return !isAfter(today, expirationDate);
  };

  const handleStatusChange = async (newStatus: boolean) => {
    try {
      console.log('Attempting to update status:', { userId, newStatus });

      if (newStatus && !hasActiveSubscription() && !latestSubscription?.days_remaining) {
        toast({
          title: "Cannot activate member",
          description: "Member needs an active subscription to be activated.",
          variant: "destructive",
        });
        return;
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating user status:', updateError);
        throw new Error(`Failed to update user status: ${updateError.message}`);
      }

      if (!data) {
        throw new Error("Update was not applied");
      }

      if (latestSubscription) {
        const today = new Date();

        if (!newStatus) {
          // Going inactive
          const currentExpiration = new Date(latestSubscription.expiration_date);
          const remainingDays = differenceInDays(currentExpiration, today);

          const { error: subError } = await supabase
            .from('subscriptions')
            .update({
              inactive_start_date: today.toISOString(),
              days_remaining: remainingDays
            })
            .eq('id', latestSubscription.id);

          if (subError) {
            console.error('Error updating subscription:', subError);
            await supabase.from('users').update({ status: isActive }).eq('id', userId);
            throw new Error(`Failed to update subscription: ${subError.message}`);
          }
        } else {
          // Going active
          if (latestSubscription.inactive_start_date && latestSubscription.days_remaining !== null) {
            const inactiveStartDate = new Date(latestSubscription.inactive_start_date);
            const daysInactive = differenceInDays(today, inactiveStartDate);
            const newExpirationDate = addDays(today, latestSubscription.days_remaining);

            const totalDays = latestSubscription.total_days;
            const activeDays = totalDays - latestSubscription.days_remaining;
            const newInactiveDays = latestSubscription.inactive_days + daysInactive;

            const { error: subError } = await supabase
              .from('subscriptions')
              .update({
                expiration_date: format(newExpirationDate, 'yyyy-MM-dd'),
                inactive_start_date: null,
                days_remaining: null,
                active_days: activeDays,
                inactive_days: newInactiveDays
              })
              .eq('id', latestSubscription.id);

            if (subError) {
              console.error('Error updating subscription:', subError);
              await supabase.from('users').update({ status: isActive }).eq('id', userId);
              throw new Error(`Failed to update subscription: ${subError.message}`);
            }
          }
        }
      }

      onStatusChange?.(newStatus);

      toast({
        title: "Status updated",
        description: `Member is now ${newStatus ? 'active' : 'inactive'}.`,
      });

      router.refresh();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "There was a problem updating the member status.",
        variant: "destructive",
      });
      onStatusChange?.(isActive);
    }
  };

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleStatusChange}
      className={className}
      aria-label="Toggle member status"
      disabled={isActive ? false : (!hasActiveSubscription() && !latestSubscription?.days_remaining)}
    />
  );
}
