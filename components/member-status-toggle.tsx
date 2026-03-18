"use client";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Subscription = {
  id: string;
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
