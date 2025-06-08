"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isAfter, differenceInDays, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { MemberStatusToggle } from '@/components/member-status-toggle';
import { ThemeToggle } from '@/components/theme-toggle';

type UserType = {
  id: string;
  member_id: number;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  created_at: string;
  address: string | null;
  gender: string | null;
};

type SubscriptionType = {
  id: string;
  user_id: string;
  payment_date: string;
  expiration_date: string;
  total_days: number;
  active_days: number;
  inactive_days: number;
  inactive_start_date: string | null;
  days_remaining: number | null;
  created_at: string;
};

const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  status: z.boolean(),
  address: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
});

const subscriptionSchema = z.object({
  payment_date: z.date({ required_error: 'Payment date is required' }),
  total_days: z.number().min(1, { message: 'Total days must be at least 1' }),
  active_days: z.number().default(0),
});

// Add utility function for calculating remaining days
const calculateRemainingDays = (totalDays: number, activeDays: number) => {
  return Math.max(0, totalDays - activeDays);
};

// Add function to calculate actual expiration date based on active days
const calculateActualExpirationDate = (paymentDate: Date, totalDays: number, activeDays: number) => {
  const remainingDays = calculateRemainingDays(totalDays, activeDays);
  return addDays(new Date(paymentDate), remainingDays);
};

// Add function to format member ID with leading zeros
const formatMemberId = (id: number) => {
  return id.toString().padStart(5, '0');
};

export default function UserProfile({
  user,
  subscriptions,
}: {
  user: UserType;
  subscriptions: SubscriptionType[];
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image_url);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(user.status);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      status: currentStatus,
      address: user.address || '',
      gender: user.gender || '',
    },
  });
  
  const subscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      payment_date: new Date(),
      total_days: 30,
      active_days: 0,
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      try {
        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        
        // Upload image to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;
        
        const { error: uploadError, data } = await supabase
          .storage
          .from('gym.members')
          .upload(filePath, file, { 
            upsert: true,
            cacheControl: '31536000'
          });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL with no expiry
        const { data: { publicUrl } } = supabase
          .storage
          .from('gym.members')
          .getPublicUrl(filePath, {
            download: false
          });

        
        // Update the user with the new image URL
        const { error: imageUpdateError } = await supabase
          .from('users')
          .update({ image_url: publicUrl })
          .eq('id', user.id);
          
        if (imageUpdateError) throw imageUpdateError;

        // Cleanup preview URL
        URL.revokeObjectURL(previewUrl);
        
        toast({
          title: "Image uploaded",
          description: "Profile picture has been updated successfully.",
        });

        // Force a refresh to get the updated user data
        router.refresh();
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error uploading image",
          description: "There was a problem uploading the profile picture.",
          variant: "destructive",
        });
      }
    }
  };

  // Update the handleStatusChange function
  const handleStatusChange = (newStatus: boolean) => {
    setCurrentStatus(newStatus);
    userForm.setValue('status', newStatus, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const onUserSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      setIsUpdating(true);
      
      // Update user data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: values.name,
          phone: values.phone,
          email: values.email || null,
          address: values.address || null,
          gender: values.gender || null,
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // If there's a new image, upload it
      if (newImage) {
        const fileExt = newImage.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `profiles/${fileName}`;
        
        // Upload the new image
        const { error: uploadError } = await supabase
          .storage
          .from('gym.members')
          .upload(filePath, newImage, { 
            upsert: true,
            cacheControl: '31536000'
          });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL with no expiry
        const { data: publicURLData } = supabase
          .storage
          .from('gym.members')
          .getPublicUrl(filePath, {
            download: false
          });
          
        // Update the user with the new image URL
        const { error: imageUpdateError } = await supabase
          .from('users')
          .update({ image_url: publicURLData.publicUrl })
          .eq('id', user.id);
          
        if (imageUpdateError) throw imageUpdateError;
      }
      
      toast({
        title: "Profile updated",
        description: "Member information has been updated successfully.",
      });
      
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating the member information.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onSubscriptionSubmit = async (values: z.infer<typeof subscriptionSchema>) => {
    try {
      setIsAddingSubscription(true);
      
      // If user is active, calculate active days from payment date until now
      const initialActiveDays = user.status ? 
        Math.floor((new Date().getTime() - values.payment_date.getTime()) / (1000 * 60 * 60 * 24)) : 
        0;
      
      const calculatedExpirationDate = calculateActualExpirationDate(
        values.payment_date,
        values.total_days,
        initialActiveDays
      );
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          payment_date: format(values.payment_date, 'yyyy-MM-dd'),
          expiration_date: format(calculatedExpirationDate, 'yyyy-MM-dd'),
          total_days: values.total_days,
          active_days: initialActiveDays,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update user status to active if not already active
      if (!user.status) {
        const { error: statusError } = await supabase
          .from('users')
          .update({ status: true })
          .eq('id', user.id);
          
        if (statusError) throw statusError;
      }
      
      toast({
        title: "Subscription added",
        description: "The subscription has been added successfully.",
      });
      
      subscriptionForm.reset({
        payment_date: new Date(),
        total_days: 30,
        active_days: 0,
      });
      
      setIsSubscriptionDialogOpen(false);
      
      // Force a hard refresh to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast({
        title: "Error adding subscription",
        description: "There was a problem adding the subscription.",
        variant: "destructive",
      });
    } finally {
      setIsAddingSubscription(false);
    }
  };

  const getSubscriptionStatus = async (subscription: SubscriptionType) => {
    if (!subscription) {
      return { 
        status: 'No subscription', 
        variant: 'outline' as const,
        daysText: 'No subscription',
        activeText: '0/0 days left'
      };
    }
    
    const today = new Date();
    const expirationDate = new Date(subscription.expiration_date);
    const paymentDate = new Date(subscription.payment_date);
    
    // Calculate current active days if the member is active
    if (user.status) {
      const currentActiveDays = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      const newActiveDays = Math.min(currentActiveDays, subscription.total_days);
      
      // Only update if active days have changed
      if (newActiveDays > subscription.active_days) {
        try {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              active_days: newActiveDays,
            })
            .eq('id', subscription.id);
            
          if (updateError) throw updateError;
          
          // Update the local subscription object
          subscription.active_days = newActiveDays;
        } catch (error) {
          console.error('Error updating active days:', error);
        }
      }
    }
    
    // Calculate remaining days considering both calendar days and active days
    const calendarDaysLeft = differenceInDays(expirationDate, today);
    const activeDaysLeft = subscription.total_days - subscription.active_days;
    const effectiveDaysLeft = Math.min(calendarDaysLeft, activeDaysLeft);
    
    // If member is inactive and has remaining days
    if (!user.status && subscription.days_remaining !== null) {
      return { 
        status: 'Paused',
        variant: 'default' as const,
        daysText: `${subscription.days_remaining} days`,
        activeText: `${subscription.days_remaining}/${subscription.total_days} days left`
      };
    }
    
    // If subscription is expired or all days are used
    if (isAfter(today, expirationDate) || subscription.active_days >= subscription.total_days) {
      return { 
        status: 'Expired',
        variant: 'destructive' as const,
        daysText: 'Expired',
        activeText: `0/${subscription.total_days} days left`
      };
    }
    
    if (effectiveDaysLeft <= 7) {
      return { 
        status: 'Expiring Soon',
        variant: 'default' as const,
        daysText: `${effectiveDaysLeft} days left`,
        activeText: `${effectiveDaysLeft}/${subscription.total_days} days left`
      };
    }
    
    return { 
      status: 'Active',
      variant: 'outline' as const,
      daysText: `${effectiveDaysLeft} days left`,
      activeText: `${effectiveDaysLeft}/${subscription.total_days} days left`
    };
  };

  // Add real-time subscription to status changes
  useEffect(() => {
    const channel = supabase
      .channel('status_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          // Refresh data when status changes
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase, router]);

  useEffect(() => {
  }, [user.image_url, imagePreview]);

  const getMemberStatus = () => {
    if (!currentStatus) {
      return subscriptions.length > 0 ? 
        { text: 'Paused', variant: 'default' as const } : 
        { text: 'Inactive', variant: 'destructive' as const };
    }
    return { text: 'Active', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Member Details</h1>
        </div>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 relative">
                {user.image_url ? (
                  <img 
                    src={user.image_url} 
                    alt={user.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback') as HTMLDivElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>Member since {format(new Date(user.created_at), 'MMMM d, yyyy')}</CardDescription>
              </div>
            </div>
            {(() => {
              const status = getMemberStatus();
              return (
                <Badge variant={status.variant}>
                  {status.text}
                </Badge>
              );
            })()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Personal Details</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 pt-4">
              <Form {...userForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Member ID</FormLabel>
                      <Input 
                        value={formatMemberId(user.member_id)}
                        disabled 
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={userForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <MemberStatusToggle
                              userId={user.id}
                              isActive={field.value}
                              latestSubscription={subscriptions[0]}
                              onStatusChange={handleStatusChange}
                            />
                          </FormControl>
                          <FormLabel>Active Member</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="subscriptions" className="space-y-6 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Subscription History</h3>
                <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscription</DialogTitle>
                      <DialogDescription>
                        Enter the payment and expiration dates for the new subscription.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...subscriptionForm}>
                      <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)} className="space-y-4">
                        <FormField
                          control={subscriptionForm.control}
                          name="payment_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Payment Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={subscriptionForm.control}
                          name="total_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Days</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={isAddingSubscription}>
                            {isAddingSubscription ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Subscription'
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {subscriptions.length === 0 ? (
                <div className="py-8 text-center border rounded-lg">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-2 text-lg font-medium">No subscriptions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new subscription to track membership status
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => {
                    const [statusState, setStatusState] = useState<{
                      status: string;
                      variant: 'default' | 'destructive' | 'outline' | 'secondary';
                      daysText: string;
                      activeText: string;
                    } | null>(null);

                    useEffect(() => {
                      let isMounted = true;

                      const fetchStatus = async () => {
                        const result = await getSubscriptionStatus(subscription);
                        if (isMounted) {
                          setStatusState(result);
                        }
                      };

                      fetchStatus();

                      return () => {
                        isMounted = false;
                      };
                    }, [subscription]);

                    if (!statusState) return null;

                    return (
                      <Card key={subscription.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <Badge variant={statusState.variant}>
                                  {statusState.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {statusState.daysText}
                                </span>
                              </div>
                              <div className="flex gap-6 mt-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Payment Date</Label>
                                  <p className="font-medium">
                                    {format(new Date(subscription.payment_date), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Expiration Date</Label>
                                  <p className="font-medium">
                                    {format(new Date(subscription.expiration_date), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Days Remaining</Label>
                                  <p className="font-medium">
                                    {statusState.activeText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}