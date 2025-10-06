"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendNewUserEmail } from '@/lib/email';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),  // Remove optional
  address: z.string().min(5, { message: 'Please enter a valid address.' }),
  gender: z.enum(['male', 'female'], { required_error: 'Please select a gender.' }),
  image: z.any().refine((file) => file !== null, "Profile picture is required"), // Add image validation
});

export function MemberForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      gender: undefined,
      image: null,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Normalize email for consistent lookups
      const normalizedEmail = values.email.trim().toLowerCase();

      // Check if a user with this email already exists before any uploads
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingUserError) {
        throw existingUserError;
      }

      if (existingUser) {
        toast({
          title: "Email already registered",
          description: "An account with this email already exists.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!image) {
        toast({
          title: "Error",
          description: "Please upload a profile picture",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = null;

      // If there's an image, upload it first
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from('gym.members')
          .upload(filePath, image, {
            cacheControl: '31536000',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get the public URL with no expiry
        const { data: publicURLData } = supabase
          .storage
          .from('gym.members')
          .getPublicUrl(filePath, {
            download: false,
          });

        imageUrl = publicURLData.publicUrl;
      }

      // Create the user with the image URL if available
      const { error: userError, data: newUser } = await supabase
        .from('users')
        .insert({
          name: values.name,
          phone: values.phone,
          email: normalizedEmail,
          address: values.address,
          gender: values.gender,
          image_url: imageUrl,
          status: false,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Send email notification
      try {
        await sendNewUserEmail({
          userName: values.name,
          userPhone: values.phone,
          userEmail: normalizedEmail
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't throw here - we don't want to affect the user experience
        // if email sending fails
      }

      toast({
        title: "Registration successful!",
        description: "Your membership has been submitted.",
      });

      // Reset form and redirect after successful submission
      form.reset();
      setImage(null);
      setImagePreview(null);
      
      // Redirect to success page or home
      router.push('/form/success');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name*</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number*</FormLabel>
              <FormControl>
                <Input placeholder="+234 903 333 3333" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address*</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address*</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, aja, lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
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
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture <br />use a picture of your <b>face</b>* </FormLabel>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-20 h-20 rounded-full overflow-hidden border">
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>{image ? 'Change image' : 'Upload image*'}</span>
                      </div>
                      <input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          handleImageChange(e);
                          field.onChange(e.target.files?.[0] || null);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </Button>
      </form>
    </Form>
  );
}