"use client";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";

type Subscription = {
  id: string;
  created_at: string;
  total_days: number;
  active_days: number;
  inactive_days: number;
  inactive_start_date: string | null;
  days_remaining: number | null;
  last_active_date: string | null;
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
  className,
}: MemberStatusToggleProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  const handleStatusChange = async (newStatus: boolean) => {
    try {
      if (!latestSubscription) {
        toast({
          title: "No Subscription Found",
          description: "Please create a subscription before activating the member.",
          variant: "destructive",
        });
        return;
      }

      const today = new Date();
      const subscriptionId = latestSubscription.id;

      if (newStatus === false) {
        // Going inactive
        const lastActiveDate = latestSubscription.last_active_date
          ? new Date(latestSubscription.last_active_date)
          : new Date(latestSubscription.created_at);
        const daysActiveNow = differenceInDays(today, lastActiveDate);
        const newActiveDays = latestSubscription.active_days + daysActiveNow;
        const newDaysRemaining = latestSubscription.total_days - newActiveDays;

        const { error: subError } = await supabase
          .from("subscriptions")
          .update({
            active_days: newActiveDays,
            days_remaining: newDaysRemaining,
            inactive_start_date: format(today, "yyyy-MM-dd"),
          })
          .eq("id", subscriptionId);

        if (subError) throw new Error(subError.message);
      } else {
        // Going active
        const inactiveStart = latestSubscription.inactive_start_date
          ? new Date(latestSubscription.inactive_start_date)
          : null;
        let daysInactive = 0;
        if (inactiveStart) {
          daysInactive = differenceInDays(today, inactiveStart);
        }
        const newInactiveDays = latestSubscription.inactive_days + daysInactive;
        const newTotalDays = latestSubscription.total_days + daysInactive; // Extend total_days by days inactive
        const newDaysRemaining = (latestSubscription.days_remaining ?? (latestSubscription.total_days - latestSubscription.active_days)) + daysInactive;

        const { error: subError } = await supabase
          .from("subscriptions")
          .update({
            inactive_days: newInactiveDays,
            inactive_start_date: null,
            last_active_date: format(today, "yyyy-MM-dd"),
            total_days: newTotalDays,
            days_remaining: newDaysRemaining,
          })
          .eq("id", subscriptionId);

        if (subError) throw new Error(subError.message);
      }

      // Update user status
      const { error: userError } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", userId);

      if (userError) throw new Error(userError.message);

      toast({
        title: "Status Updated",
        description: `Member is now ${newStatus ? "active" : "inactive"}.`,
      });

      onStatusChange?.(newStatus);
      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update member status.",
        variant: "destructive",
      });
      onStatusChange?.(isActive); // revert UI switch
    }
  };

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleStatusChange}
      className={className}
      aria-label="Toggle member status"
    />
  );
}
