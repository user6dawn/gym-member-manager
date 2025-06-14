"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
  created_at: string;
  total_days: number;
  active_days: number;
  inactive_days: number;
  inactive_start_date: string | null;
  days_remaining: number | null;
  last_active_date: string | null;
  expiration_date: string; // Added property
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
  start_date: z.date({ required_error: 'Start date is required' }),
  total_days: z.number().min(1, { message: 'Total days must be at least 1' }),
});

// Add function to calculate subscription status
const getSubscriptionStatus = (subscription: SubscriptionType) => {
  if (!subscription) {
    return { 
      status: 'No subscription', 
      variant: 'outline' as const,
      daysText: 'No subscription'
    };
  }

  const today = new Date();
  const expirationDate = new Date(subscription.expiration_date);
  const remainingDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // If member has inactive days and remaining days
  if (subscription.days_remaining !== null) {
    return { 
      status: 'Paused',
      variant: 'default' as const,
      daysText: `${subscription.days_remaining} days on hold`
    };
  }

  // If subscription has expired
  if (remainingDays <= 0) {
    return { 
      status: 'Expired',
      variant: 'destructive' as const,
      daysText: 'Subscription expired'
    };
  }
  
  // If less than or equal to 7 days remaining
  if (remainingDays <= 7) {
    return { 
      status: 'Expiring Soon',
      variant: 'default' as const,
      daysText: `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining`
    };
  }
  
  // Active with more than 7 days remaining
  return { 
    status: 'Active',
    variant: 'outline' as const,
    daysText: `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining`
  };
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
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
      start_date: new Date(),
      total_days: 30,
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
        setIsUploadingImage(true);
        
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
        
        // Get the public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('gym.members')
          .getPublicUrl(filePath);
      
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
      } finally {
        setIsUploadingImage(false);
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
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: values.name,
          phone: values.phone,
          email: values.email || null,
          address: values.address || null,
          gender: values.gender || null,
          status: values.status,
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
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
      
      const formattedDate = format(values.start_date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          created_at: formattedDate,
          payment_date: formattedDate, // Add this line to set payment_date
          expiration_date: format(addDays(values.start_date, values.total_days), 'yyyy-MM-dd'),
          total_days: values.total_days,
          active_days: 0,
          inactive_days: 0,
          last_active_date: user.status ? formattedDate : null
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
        start_date: new Date(),
        total_days: 30,
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

  const getMemberStatus = () => {
    if (!currentStatus) {
      return subscriptions.length > 0 ? 
        { text: 'Paused', variant: 'default' as const } : 
        { text: 'Inactive', variant: 'destructive' as const };
    }
    return { text: 'Active', variant: 'outline' as const };
  };

  const ImageModal = () => (
    <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
      <DialogContent className="max-w-2xl p-0">
        <div className="relative aspect-square">
          {user.image_url ? (
            <>
              <img 
                src={imagePreview || user.image_url} 
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <label 
                  htmlFor="modal-image-upload"
                  className="bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="modal-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-4">
              <User className="h-32 w-32 text-muted-foreground/50" />
              <label 
                htmlFor="modal-image-upload"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
                <input
                  id="modal-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

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
            {/* <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar 
                  className="h-16 w-16 relative cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  {user.image_url ? (
                    <AvatarImage 
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
                <label 
                  htmlFor="profile-image" 
                  className="absolute -bottom-2 -right-2 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-3 w-3 text-primary-foreground" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>Member since {format(new Date(user.created_at), 'MMMM d, yyyy')}</CardDescription>
              </div>
            </div> */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar 
                  className="h-16 w-16 relative cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  {user.image_url ? (
                    <AvatarImage 
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
                <label 
                  htmlFor="profile-image" 
                  className="absolute -bottom-2 -right-2 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-3 w-3 text-primary-foreground" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
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
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                          <FormLabel>Email Address (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
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
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Gender (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
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

                  <div className="flex items-center justify-between">
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
                    
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
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
                          name="start_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
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
                    const statusState = getSubscriptionStatus(subscription);
                    const today = new Date();
                    const expirationDate = new Date(subscription.expiration_date);
                    const remainingDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
                                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                                  <p className="font-medium">
                                    {format(new Date(subscription.created_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Last Active</Label>
                                  <p className="font-medium">
                                    {subscription.last_active_date 
                                      ? format(new Date(subscription.last_active_date), 'MMM d, yyyy')
                                      : 'Never'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Days Left</Label>
                                  <p className="font-medium">
                                    {subscription.days_remaining !== null 
                                      ? `${subscription.days_remaining} days`
                                      : remainingDays <= 0 
                                        ? '0 days'
                                        : `${remainingDays} days`}
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

      <ImageModal />
    </div>
  );
}

