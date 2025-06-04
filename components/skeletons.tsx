import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-full md:w-1/3" />
        <Skeleton className="h-10 w-full md:w-1/3" />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-4">
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-6 col-span-1" />
            <Skeleton className="h-6 col-span-3" />
            <Skeleton className="h-6 col-span-2" />
            <Skeleton className="h-6 col-span-2 hidden md:block" />
            <Skeleton className="h-6 col-span-2" />
            <Skeleton className="h-6 col-span-2" />
          </div>
        </div>
        
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full col-span-1" />
                <Skeleton className="h-6 col-span-3" />
                <Skeleton className="h-6 col-span-2" />
                <Skeleton className="h-6 col-span-2 hidden md:block" />
                <Skeleton className="h-6 col-span-2" />
                <Skeleton className="h-8 w-16 col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      <Skeleton className="h-10 w-40" />
      
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}