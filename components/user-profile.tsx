"use client";

import { useState } from 'react';
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

type UserType = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  created_at: string;
};

type SubscriptionType = {
  id: string;
  user_id: string;
  payment_date: string;
  expiration_date: string;
  created_at: string;
};

const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  status: z.boolean(),
});

const subscriptionSchema = z.object({
  payment_date: z.date({ required_error: 'Payment date is required' }),
  expiration_date: z.date({ required_error: 'Expiration date is required' }),
});

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
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      status: user.status,
    },
  });
  
  const subscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      payment_date: new Date(),
      expiration_date: addDays(new Date(), 30), // Default to 30 days
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
          status: values.status,
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
          .from('member-images')
          .upload(filePath, newImage, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: publicURLData } = supabase
          .storage
          .from('member-images')
          .getPublicUrl(filePath);
          
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
      
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          payment_date: format(values.payment_date, 'yyyy-MM-dd'),
          expiration_date: format(values.expiration_date, 'yyyy-MM-dd'),
        });
        
      if (error) throw error;
      
      toast({
        title: "Subscription added",
        description: "The subscription has been added successfully.",
      });
      
      subscriptionForm.reset({
        payment_date: new Date(),
        expiration_date: addDays(new Date(), 30),
      });
      
      setIsSubscriptionDialogOpen(false);
      router.refresh();
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

  const getSubscriptionStatus = (expiration_date: string) => {
    const today = new Date();
    const expirationDate = new Date(expiration_date);
    const isExpired = isAfter(today, expirationDate);
    const daysRemaining = differenceInDays(expirationDate, today);
    
    if (isExpired) {
      return { status: 'Expired', variant: 'destructive' as const, daysText: 'Expired' };
    } else if (daysRemaining <= 7) {
      return { 
        status: 'Expiring Soon', 
        variant: 'default' as const,
        daysText: `${daysRemaining} days left`
      };
    } else {
      return { 
        status: 'Active', 
        variant: 'outline' as const,
        daysText: `${daysRemaining} days left`
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Member Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={imagePreview || undefined} alt={user.name} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>Member since {format(new Date(user.created_at), 'MMMM d, yyyy')}</CardDescription>
              </div>
            </div>
            <Badge variant={user.status ? 'outline' : 'destructive'}>
              {user.status ? 'Active' : 'Inactive'}
            </Badge>
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Member ID</FormLabel>
                      <Input 
                        value={user.id} 
                        disabled 
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={imagePreview || undefined} alt={user.name} />
                        <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <label htmlFor="profile-image" className="cursor-pointer">
                          <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted transition-colors">
                            <Upload className="h-4 w-4" />
                            <span>{imagePreview ? 'Change image' : 'Upload image'}</span>
                          </div>
                          <input 
                            id="profile-image" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={userForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
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
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
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
                          name="expiration_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Expiration Date</FormLabel>
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
                    const status = getSubscriptionStatus(subscription.expiration_date);
                    
                    return (
                      <Card key={subscription.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <Badge variant={status.variant}>
                                  {status.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {status.daysText}
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