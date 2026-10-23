"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Member = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  subscriptions: Array<{
    expiration_date: string;
    session?: string | null;
  }>;
};

type DashboardContentProps = {
  initialMembers: Member[];
  membersLoadError: boolean;
  newUsersCount: number;
  newSubscriptionsCount: number;
  isAdmin: boolean;
  totalMembersCount: number;
};

type SortOption = {
  field: string;
  direction: 'asc' | 'desc';
};

type Tone = 'none' | 'expired' | 'soon' | 'ok';

const TONES: Record<Tone, { pill: string; dot: string; ring: string }> = {
  none: {
    pill: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/50',
    ring: 'ring-border',
  },
  expired: {
    pill: 'bg-red-500/10 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    ring: 'ring-red-500/60',
  },
  soon: {
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/60',
  },
  ok: {
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/60',
  },
};

const SUBSCRIPTION_FILTERS = [
  { value: 'all', label: 'All members' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
];

const DEFAULT_SORT: SortOption = { field: 'name', direction: 'asc' };

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_1.5rem] md:items-center md:gap-4';

export default function DashboardContent({
  initialMembers,
  membersLoadError,
  newUsersCount,
  newSubscriptionsCount,
  isAdmin,
  totalMembersCount,
}: DashboardContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const now = new Date();
  const todayDateKey = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');

  const filteredMembers = useMemo(() => {
    let result = [...initialMembers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((member) =>
        member.name.toLowerCase().includes(query) ||
        member.phone.toLowerCase().includes(query) ||
        (member.email && member.email.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter((member) => {
        const hasCurrentSubscription = member.subscriptions.some(
          (subscription) => subscription.expiration_date.slice(0, 10) > todayDateKey,
        );
        const isCurrentlyActive = member.status && hasCurrentSubscription;
        return isCurrentlyActive === isActive;
      });
    }

    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'active') {
        result = result.filter((member) =>
          member.subscriptions.some((subscription) =>
            subscription.expiration_date.slice(0, 10) > todayDateKey
          )
        );
      } else if (subscriptionFilter === 'expired') {
        result = result.filter((member) =>
          member.subscriptions.length > 0 &&
          member.subscriptions.every(
            (subscription) => subscription.expiration_date.slice(0, 10) <= todayDateKey,
          )
        );
      }
    }

    result.sort((a, b) => {
      if (sortOption.field === 'name') {
        return sortOption.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      const dateA = a.subscriptions[0]?.expiration_date
        ? new Date(a.subscriptions[0].expiration_date).getTime()
        : 0;
      const dateB = b.subscriptions[0]?.expiration_date
        ? new Date(b.subscriptions[0].expiration_date).getTime()
        : 0;

      return sortOption.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [initialMembers, searchQuery, statusFilter, subscriptionFilter, sortOption, todayDateKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, subscriptionFilter, sortOption]);

  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));

  useEffect(() => {
    if (currentPage !== safeCurrentPage) setCurrentPage(safeCurrentPage);
  }, [currentPage, safeCurrentPage]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDaysLeftDisplay = (member: Member): { text: string; tone: Tone } => {
    const subscription = member.subscriptions[0];

    if (!subscription) {
      return { text: 'No subscription', tone: 'none' };
    }

    const today = new Date();
    const expirationDate = new Date(subscription.expiration_date);
    const remainingDays = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays <= 0) {
      return { text: 'Expired', tone: 'expired' };
    }

    const text = `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} left`;

    if (remainingDays <= 7) {
      return { text, tone: 'soon' };
    }

    return { text, tone: 'ok' };
  };

  const paginatedMembers = useMemo(
    () =>
      filteredMembers.slice(
        (safeCurrentPage - 1) * membersPerPage,
        safeCurrentPage * membersPerPage,
      ),
    [filteredMembers, safeCurrentPage, membersPerPage]
  );

  const firstVisibleMember = filteredMembers.length === 0
    ? 0
    : (safeCurrentPage - 1) * membersPerPage + 1;
  const lastVisibleMember = Math.min(safeCurrentPage * membersPerPage, filteredMembers.length);
  const visiblePageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (sortOption.field !== DEFAULT_SORT.field || sortOption.direction !== DEFAULT_SORT.direction ? 1 : 0);

  const resetAll = () => {
    setStatusFilter('all');
    setSubscriptionFilter('all');
    setSortOption(DEFAULT_SORT);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const stats = [
    { label: 'Sign-ups today', value: newUsersCount, Icon: UserPlus },
    { label: 'Renewals today', value: newSubscriptionsCount, Icon: RefreshCw },
    { label: 'Total members', value: totalMembersCount, Icon: Users },
  ];

  const renderMemberAvatar = (member: Member, index: number, tone: Tone, size: 'md' | 'lg' = 'md') => (
    <Avatar
      className={cn(
        'shrink-0 overflow-hidden ring-2 ring-offset-2 ring-offset-card',
        size === 'lg' ? 'h-12 w-12' : 'h-11 w-11',
        TONES[tone].ring,
      )}
    >
      {member.image_url ? (
        <Image
          src={member.image_url}
          alt=""
          width={64}
          height={64}
          sizes="48px"
          quality={70}
          priority={safeCurrentPage === 1 && index < 4}
          className="h-full w-full object-cover"
        />
      ) : (
        <AvatarFallback className="bg-muted text-sm font-semibold">
          {getInitials(member.name)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  const renderPill = (text: string, tone: Tone) => (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone].pill,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', TONES[tone].dot)} />
      {text}
    </span>
  );

  // Rows become links for admins; otherwise a plain container
  const RowShell = ({ member, children }: { member: Member; children: ReactNode }) => {
    const className = cn(
      'group block px-4 py-3.5 outline-none transition-colors md:px-5',
      ROW_GRID,
      isAdmin && 'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
    );
    return isAdmin ? (
      <Link href={`/admin/user/${member.id}`} aria-label={`View ${member.name}`} className={className}>
        {children}
      </Link>
    ) : (
      <div className={className}>{children}</div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none tabular-nums">{value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div
          role="group"
          aria-label="Filter by subscription"
          className="-mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 sm:w-fit sm:rounded-xl sm:bg-muted sm:p-1"
        >
          {SUBSCRIPTION_FILTERS.map(({ value, label }) => {
            const selected = subscriptionFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setSubscriptionFilter(value)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground max-sm:bg-muted',
                )}
              >
                {value !== 'all' && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      value === 'active' ? TONES.ok.dot : TONES.expired.dot,
                    )}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder={isAdmin ? 'Search by name, phone or email' : 'Search by member number'}
              aria-label={isAdmin ? 'Search members' : 'Search member numbers'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter members</h4>

                  <div className="space-y-2">
                    <Label>Account status</Label>
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
                    <Label>Sort by</Label>
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
                        <SelectItem value="expiration-asc">Expiry date (soonest first)</SelectItem>
                        <SelectItem value="expiration-desc">Expiry date (latest first)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={resetAll}>
                      Reset all
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label={sortOption.direction === 'asc' ? 'Sorted ascending, switch to descending' : 'Sorted descending, switch to ascending'}
              onClick={() =>
                setSortOption((prev) => ({
                  ...prev,
                  direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }))
              }
            >
              {sortOption.direction === 'asc' ? (
                <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Column headers (desktop) */}
        <div
          className={cn(
            'hidden border-b bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground',
            ROW_GRID,
          )}
        >
          <div>Member</div>
          <div>Session</div>
          <div>Subscription</div>
          <div />
        </div>

        {membersLoadError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h3 className="font-medium">Members could not be loaded</h3>
              <p className="text-sm text-muted-foreground">Refresh the page to try again.</p>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserX className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h3 className="font-medium">No members found</h3>
              <p className="text-sm text-muted-foreground">
                Try a different search or clear your filters.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll}>
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {paginatedMembers.map((member, index) => {
              const daysLeft = getDaysLeftDisplay(member);
              const sessionValue = member.subscriptions[0]?.session;

              return (
                <li key={member.id}>
                  <RowShell member={member}>
                    {/* Member */}
                    <div className="flex min-w-0 items-center gap-3.5">
                      {renderMemberAvatar(member, index, daysLeft.tone)}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">{member.name}</p>
                        {isAdmin && (
                          <p className="truncate text-sm text-muted-foreground">{member.phone}</p>
                        )}
                      </div>
                      {/* Mobile-only status + chevron */}
                      <div className="flex items-center gap-2 md:hidden">
                        {renderPill(daysLeft.text, daysLeft.tone)}
                        {isAdmin && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    {/* Session */}
                    <div className="mt-2 pl-[3.75rem] text-sm md:mt-0 md:pl-0">
                      <span className="text-muted-foreground md:hidden">Session: </span>
                      {sessionValue ? (
                        <span className="capitalize">{sessionValue}</span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>

                    {/* Subscription (desktop) */}
                    <div className="hidden md:block">{renderPill(daysLeft.text, daysLeft.tone)}</div>

                    {/* Chevron (desktop) */}
                    <div className="hidden justify-end md:flex">
                      {isAdmin && (
                        <ChevronRight
                          className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </RowShell>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <Select
                value={String(membersPerPage)}
                onValueChange={(value) => {
                  setMembersPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[74px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span aria-live="polite">
              {firstVisibleMember}–{lastVisibleMember} of {filteredMembers.length} members
            </span>
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center gap-1" aria-label="Member pages">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {visiblePageNumbers.map((pageNumber, index) => (
                <Fragment key={pageNumber}>
                  {index > 0 && pageNumber - visiblePageNumbers[index - 1] > 1 && (
                    <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>
                  )}
                  <Button
                    variant={pageNumber === safeCurrentPage ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 min-w-8 px-2.5"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                    aria-label={`Page ${pageNumber}`}
                  >
                    {pageNumber}
                  </Button>
                </Fragment>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
