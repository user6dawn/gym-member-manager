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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
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

      // First create the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name: values.name,
          phone: values.phone,
          email: values.email || null,
          status: true,
        })
        .select('id')
        .single();

      if (userError) throw userError;

      // If there's an image, upload it to storage
      if (image && userData.id) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${userData.id}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from('gym.members')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: publicURLData } = supabase
          .storage
          .from('member-images')
          .getPublicUrl(filePath);

        // Update the user with the image URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ image_url: publicURLData.publicUrl })
          .eq('id', userData.id);

        if (updateError) throw updateError;
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
                <Input placeholder="+1 123 456 7890" {...field} />
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
              <FormLabel>Email Address (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Profile Picture (Optional)</FormLabel>
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
                  <span>{image ? 'Change image' : 'Upload image'}</span>
                </div>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
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