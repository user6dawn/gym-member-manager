"use client";

import { useEffect, useMemo, useState, Fragment, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Search, SearchX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'active' | 'inactive' | 'expired';
type StatusFilter = 'all' | SubscriptionStatus;
type SortDirection = 'asc' | 'desc';

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  created_at: string;
  lastSubscriptionDate: string | null;
  subscriptionStatus: SubscriptionStatus;
};

type SortField = 'name' | 'created_at';

type AdminUsersTableProps = {
  users: UserRow[];
  totalUsersCount: number;
};

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; pill: string; dot: string }> = {
  active: {
    label: 'Active',
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    pill: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/50',
  },
  expired: {
    label: 'Expired',
    pill: 'bg-red-500/10 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

const AVATAR_TINTS = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
];

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '–';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
};

const getTint = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
};

function StatusPill({ status }: { status: SubscriptionStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        s.pill,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export default function AdminUsersTable({ users, totalUsersCount }: AdminUsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: users.length, active: 0, inactive: 0, expired: 0 };
    users.forEach((u) => {
      c[u.subscriptionStatus] += 1;
    });
    return c;
  }, [users]);

  const filteredAndSorted = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((u) => u.subscriptionStatus === statusFilter);
    }

    result.sort((a, b) => {
      let compare = 0;

      if (sortField === 'name') {
        compare = a.name.localeCompare(b.name);
      } else {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        compare = aTime - bTime;
      }

      return sortDirection === 'asc' ? compare : -compare;
    });

    return result;
  }, [users, search, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);
  const pageItems = filteredAndSorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleSort = (field: SortField) => {
    setPage(1);
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openUser = (id: string) => router.push(`/admin/user/${id}`);

  const onRowKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openUser(id);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    );
  };

  const ariaSort = (field: SortField) =>
    field === sortField ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

  const rangeStart = filteredAndSorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredAndSorted.length);

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1,
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div
          role="group"
          aria-label="Filter by subscription status"
          className="-mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 sm:w-fit sm:rounded-xl sm:bg-muted sm:p-1 sm:pb-1"
        >
          {FILTERS.map(({ value, label }) => {
            const selected = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
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
                    className={cn('h-1.5 w-1.5 rounded-full', STATUS_STYLES[value].dot)}
                  />
                )}
                {label}
                <span
                  className={cn(
                    'rounded-md px-1.5 text-xs tabular-nums',
                    selected ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search by name or email"
              aria-label="Search users"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 pl-9"
            />
          </div>
          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value: `${SortField}-${SortDirection}`) => {
              const [field, direction] = value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[170px]" aria-label="Sort users">
              <SelectValue placeholder="Sort users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="created_at-desc">Newest first</SelectItem>
              <SelectItem value="created_at-asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">
                Try a different name or email, or clear your filters.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-12 pl-5" aria-sort={ariaSort('name')}>
                      <Button
                        variant="ghost"
                        className="-ml-3 h-8 gap-1.5 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onClick={() => toggleSort('name')}
                      >
                        User
                        <SortIcon field="name" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Last subscription</TableHead>
                    <TableHead aria-sort={ariaSort('created_at')}>
                      <Button
                        variant="ghost"
                        className="-ml-3 h-8 gap-1.5 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onClick={() => toggleSort('created_at')}
                      >
                        Joined
                        <SortIcon field="created_at" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((user) => (
                    <TableRow
                      key={user.id}
                      tabIndex={0}
                      role="link"
                      aria-label={`View ${user.name}`}
                      onClick={() => openUser(user.id)}
                      onKeyDown={(e) => onRowKeyDown(e, user.id)}
                      className="group cursor-pointer outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <TableCell className="py-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {user.image_url ? (
                              <AvatarImage src={user.image_url} alt={user.name} />
                            ) : null}
                            <AvatarFallback className={getTint(user.name)}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">{user.name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {user.email ?? 'No email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={user.subscriptionStatus} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.lastSubscriptionDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <ChevronRight
                          className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y md:hidden">
              {pageItems.map((user) => (
                <li key={user.id}>
                  <div
                    tabIndex={0}
                    role="link"
                    aria-label={`View ${user.name}`}
                    onClick={() => openUser(user.id)}
                    onKeyDown={(e) => onRowKeyDown(e, user.id)}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3.5 outline-none transition-colors active:bg-muted/60 focus-visible:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      {user.image_url ? (
                        <AvatarImage src={user.image_url} alt={user.name} />
                      ) : null}
                      <AvatarFallback className={getTint(user.name)}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{user.name}</p>
                        <StatusPill status={user.subscriptionStatus} />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email ?? 'No email'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {formatDate(user.created_at)}
                        {user.lastSubscriptionDate
                          ? ` • Last sub ${formatDate(user.lastSubscriptionDate)}`
                          : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
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
              {rangeStart}–{rangeEnd} of {filteredAndSorted.length} users
              {filteredAndSorted.length !== totalUsersCount ? ` (${totalUsersCount} total)` : ''}
            </span>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="flex-wrap justify-center">
                <PaginationItem>
                  <PaginationPrevious
                    href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setPage((prev) => Math.max(1, prev - 1));
                    }}
                  />
                </PaginationItem>
                {visiblePages.map((pageNumber, index) => (
                  <Fragment key={pageNumber}>
                    {index > 0 && pageNumber - visiblePages[index - 1] > 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={`?page=${pageNumber}`}
                        isActive={pageNumber === currentPage}
                        aria-label={`Page ${pageNumber}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
