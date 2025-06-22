"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  UserCircle,
  Check,
  X,
  ArrowUpDown,
  Eye
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, isAfter, isBefore, parseISO, addDays, differenceInDays } from 'date-fns';

type Member = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  subscriptions: Array<{
    id: string;
    created_at: string;
    payment_date: string;
    expiration_date: string;
    total_days: number;
    active_days: number;
    inactive_days: number;
    inactive_start_date: string | null;
    days_remaining: number | null;
    last_active_date: string | null;
  }>;
};

type SortOption = {
  field: string;
  direction: 'asc' | 'desc';
};

export default function DashboardContent({ 
  initialMembers 
}: { 
  initialMembers: Member[] 
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(initialMembers);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10; // You can adjust this number as needed
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'name', direction: 'asc' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { toast } = useToast();
  const supabase = createClient();

  // Apply filters and sort whenever search, filters or sort changes
  useEffect(() => {
    let result = [...members];
    setCurrentPage(1); // Reset to first page on filter/sort/search change
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member => 
        member.name.toLowerCase().includes(query) || 
        member.phone.toLowerCase().includes(query) || 
        (member.email && member.email.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(member => member.status === isActive);
    }
    
    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      const today = new Date();
      
      if (subscriptionFilter === 'active') {
        result = result.filter(member => 
          member.subscriptions.some(sub => 
            isAfter(new Date(sub.expiration_date), today)
          )
        );
      } else if (subscriptionFilter === 'expired') {
        result = result.filter(member => 
          member.subscriptions.every(sub => 
            isBefore(new Date(sub.expiration_date), today)
          )
        );
      }
    }
    
    // Apply sort
    result.sort((a, b) => {
      if (sortOption.field === 'name') {
        return sortOption.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortOption.field === 'expiration') {
        const dateA = a.subscriptions[0]?.expiration_date ? new Date(a.subscriptions[0].expiration_date).getTime() : 0;
        const dateB = b.subscriptions[0]?.expiration_date ? new Date(b.subscriptions[0].expiration_date).getTime() : 0;
        return sortOption.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    
    setFilteredMembers(result);
  }, [members, searchQuery, statusFilter, subscriptionFilter, sortOption]);

  // Function to ensure proper image URL
  const getImageUrl = (url: string | null) => {
    if (!url) return undefined;
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) return url;
    
    // Check which bucket the image might be in
    const buckets = ['gym.members'];
    for (const bucket of buckets) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(url);
      if (data?.publicUrl) return data.publicUrl;
    }
    
    return url;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateRemainingDays = (totalDays: number, activeDays: number) => {
    return Math.max(0, totalDays - activeDays);
  };

  const getSubscriptionStatus = (member: Member) => {
    if (member.subscriptions.length === 0) {
      return { status: 'No subscription', variant: 'outline' as const };
    }
    
    const latestSubscription = member.subscriptions[0];
    const today = new Date();
    const expirationDate = new Date(latestSubscription.expiration_date);
    const isExpired = isAfter(today, expirationDate);
    
    // Calculate active days from payment date until now if member is active
    const paymentDate = new Date(latestSubscription.payment_date);
    const currentActiveDays = member.status ? 
      Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      latestSubscription.active_days;
    
    const remainingDays = calculateRemainingDays(latestSubscription.total_days, currentActiveDays);
    
    if (isExpired || remainingDays === 0) {
      return { status: 'Expired', variant: 'destructive' as const };
    } else if (!member.status) {
      return { status: 'Paused', variant: 'default' as const };
    } else if (remainingDays <= 7) {
      return { status: `Expires in ${remainingDays} days`, variant: 'default' as const };
    } else {
      return { status: 'Subscribed', variant: 'outline' as const };
    }
  };

  const getDaysLeftDisplay = (member: Member) => {
    const subscription = member.subscriptions[0];
    
    if (!subscription) {
      return { 
        text: 'No subscription', 
        variant: 'outline' as const
      };
    }

    // If member is inactive and has remaining days
    if (!member.status && subscription.days_remaining !== null) {
      return { 
        text: `${subscription.days_remaining} days`, 
        variant: 'default' as const
      };
    }

    // Calculate remaining days using expiration date
    const today = new Date();
    const expirationDate = new Date(subscription.expiration_date);
    const remainingDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // If subscription has expired
    if (remainingDays <= 0) {
      return { 
        text: '0 days left', 
        variant: 'destructive' as const
      };
    }
    
    // If subscription is expiring soon
    if (remainingDays <= 7) {
      return { 
        text: `${remainingDays} days left`, 
        variant: 'default' as const
      };
    }
    
    // Active subscription
    return { 
      text: `${remainingDays} days left`, 
      variant: 'outline' as const
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-3">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Members</h4>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select 
                    value={`${sortOption.field}-${sortOption.direction}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-') as [string, 'asc' | 'desc'];
                      setSortOption({ field, direction });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort members by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="expiration-asc">Expiration Date (Asc)</SelectItem>
                      <SelectItem value="expiration-desc">Expiration Date (Desc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setSubscriptionFilter('all');
                      setSortOption({ field: 'name', direction: 'asc' });
                      setSearchQuery('');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSortOption(prev => ({
                ...prev, 
                direction: prev.direction === 'asc' ? 'desc' : 'asc'
              }));
            }}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sortOption.direction === 'asc' ? 'Ascending' : 'Descending'}
            </span>
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="bg-muted/50 p-4">
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center">Profile</div>
            <div className="flex items-center">Name</div>
            <div className="flex items-center">Phone</div>
            <div className="flex items-center">Expiration</div>
            <div className="flex items-center">Days Left</div>
            <div className="flex items-center justify-end">Actions</div>
          </div>
        </div>
        
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-2 text-lg font-medium">No members found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMembers
              .slice((currentPage - 1) * membersPerPage, currentPage * membersPerPage)
              .map((member) => {
              const subscriptionStatus = getSubscriptionStatus(member);
              const daysLeft = getDaysLeftDisplay(member);
              
              return (
                <div key={member.id} className="p-4">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center">
                      <Avatar className="h-16 w-16">
                        {member.image_url ? (
                          <AvatarImage src={member.image_url} alt={member.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-lg">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="font-medium">{member.name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm">{member.phone}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Badge variant={subscriptionStatus.variant}>
                        {subscriptionStatus.status}
                      </Badge>
                    </div>

                    <div className="flex items-center">
                      <Badge variant={daysLeft.variant}>
                        {daysLeft.text}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <Link href={`/admin/user/${member.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {/* Pagination Controls */}
      {filteredMembers.length > membersPerPage && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {Math.ceil(filteredMembers.length / membersPerPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(filteredMembers.length / membersPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(filteredMembers.length / membersPerPage)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}