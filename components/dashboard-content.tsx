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
import { format, isAfter, isBefore, parseISO } from 'date-fns';

type Member = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  latestSubscription: {
    payment_date: string;
    expiration_date: string;
  } | null;
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
          member.latestSubscription && 
          isAfter(new Date(member.latestSubscription.expiration_date), today)
        );
      } else if (subscriptionFilter === 'expired') {
        result = result.filter(member => 
          !member.latestSubscription || 
          isBefore(new Date(member.latestSubscription.expiration_date), today)
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
        const dateA = a.latestSubscription ? new Date(a.latestSubscription.expiration_date).getTime() : 0;
        const dateB = b.latestSubscription ? new Date(b.latestSubscription.expiration_date).getTime() : 0;
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

  const toggleMemberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setMembers(members.map(member => 
        member.id === id ? { ...member, status: !currentStatus } : member
      ));
      
      toast({
        title: "Status updated",
        description: `Member is now ${!currentStatus ? 'active' : 'inactive'}`,
      });
    } catch (error) {
      console.error('Error updating member status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSubscriptionStatus = (member: Member) => {
    if (!member.latestSubscription) {
      return { status: 'No subscription', variant: 'outline' as const };
    }
    
    const expirationDate = new Date(member.latestSubscription.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: 'Expired', variant: 'destructive' as const };
    } else if (daysUntilExpiration <= 7) {
      return { status: `Expires in ${daysUntilExpiration} days`, variant: 'default' as const };
    } else {
      return { status: 'Active', variant: 'outline' as const };
    }
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
            <div className="flex items-center">Status</div>
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
            {filteredMembers.map((member) => {
              const subscriptionStatus = getSubscriptionStatus(member);
              
              return (
                <div key={member.id} className="p-4">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        {member.image_url && (
                          <img
                            src={getImageUrl(member.image_url)}
                            alt={member.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback') as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        )}
                        <div 
                          className={`fallback absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground ${!member.image_url ? 'flex' : 'hidden'}`}
                        >
                          {getInitials(member.name)}
                        </div>
                      </div>
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
                      <Switch
                        checked={member.status}
                        onCheckedChange={() => toggleMemberStatus(member.id, member.status)}
                        aria-label="Toggle status"
                      />
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
    </div>
  );
}