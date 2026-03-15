"use client";

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

type TimeSeriesPoint = {
  date: string;
  count: number;
};

type SessionSlice = {
  name: string;
  value: number;
};

type AdminStatsContentProps = {
  totalUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  newUsers: number;
  newSubscriptions: number;
  userGrowth: TimeSeriesPoint[];
  subscriptionGrowth: TimeSeriesPoint[];
  sessionDistribution: SessionSlice[];
};

type RangeOption = 7 | 30 | 180;

export default function AdminStatsContent({
  totalUsers,
  totalSubscriptions,
  activeSubscriptions,
  newUsers,
  newSubscriptions,
  userGrowth,
  subscriptionGrowth,
  sessionDistribution,
}: AdminStatsContentProps) {
  const [range, setRange] = useState<RangeOption>(30);

  const subscriptionStatusData = [
    { name: 'Active', value: activeSubscriptions },
    {
      name: 'Inactive',
      value: Math.max(totalSubscriptions - activeSubscriptions, 0),
    },
  ];

  const chartConfig = {
    users: {
      label: 'New users',
      color: 'hsl(var(--chart-1))',
    },
    subscriptions: {
      label: 'New subscriptions',
      color: 'hsl(var(--chart-2))',
    },
    active: {
      label: 'Active',
      color: 'hsl(var(--chart-1))',
    },
    inactive: {
      label: 'Inactive',
      color: 'hsl(var(--chart-2))',
    },
    morning: {
      label: 'Morning',
      color: 'hsl(var(--chart-1))',
    },
    afternoon: {
      label: 'Afternoon',
      color: 'hsl(var(--chart-2))',
    },
    night: {
      label: 'Night',
      color: 'hsl(var(--chart-3))',
    },
    unknown: {
      label: 'Unknown',
      color: 'hsl(var(--chart-4))',
    },
  };

  const filterByRange = (data: TimeSeriesPoint[], days: RangeOption) => {
    if (!data.length) return data;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days + 1);

    return data.filter((point) => {
      const d = new Date(point.date);
      return d >= cutoff;
    });
  };

  const filteredUserGrowth = useMemo(
    () => filterByRange(userGrowth, range),
    [userGrowth, range],
  );

  const filteredSubscriptionGrowth = useMemo(
    () => filterByRange(subscriptionGrowth, range),
    [subscriptionGrowth, range],
  );

  const rangeLabel =
    range === 7 ? 'last 7 days' : range === 30 ? 'last 30 days' : 'last 6 months';

  const dayTickFormatter = (value: string) => {
    const d = new Date(value);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  };

  const filteredSessionDistribution = sessionDistribution.filter((slice) => {
    const key = slice.name.toLowerCase();
    return key === 'morning' || key === 'afternoon' || key === 'night';
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Total users</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Total subscriptions</p>
          <p className="text-2xl font-bold">{totalSubscriptions}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Active subscriptions</p>
          <p className="text-2xl font-bold">{activeSubscriptions}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Sign-up (last 30 days)</p>
          <p className="text-2xl font-bold">{newUsers}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">
            Renewal (last 30 days)
          </p>
          <p className="text-2xl font-bold">{newSubscriptions}</p>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-xs ${
            range === 7 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
          onClick={() => setRange(7)}
        >
          7 days
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-xs ${
            range === 30 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
          onClick={() => setRange(30)}
        >
          30 days
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-xs ${
            range === 180 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
          onClick={() => setRange(180)}
        >
          6 months
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">User growth over time</h2>
            <p className="text-sm text-muted-foreground">
              Daily new users for the {rangeLabel}
            </p>
          </div>
          <ChartContainer config={chartConfig}>
            <LineChart data={filteredUserGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickMargin={8} tickFormatter={dayTickFormatter} />
              <YAxis allowDecimals={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={false}
                name="users"
              />
            </LineChart>
          </ChartContainer>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Subscription growth over time</h2>
            <p className="text-sm text-muted-foreground">
              Daily new subscriptions for the {rangeLabel}
            </p>
          </div>
          <ChartContainer config={chartConfig}>
            <BarChart data={filteredSubscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickMargin={8} tickFormatter={dayTickFormatter} />
              <YAxis allowDecimals={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-subscriptions)"
                name="subscriptions"
              />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Active vs inactive subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              Distribution of current subscriptions
            </p>
          </div>
          <ChartContainer config={chartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Pie data={subscriptionStatusData} dataKey="value" nameKey="name" label>
                {subscriptionStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === 'Active'
                        ? 'var(--color-active)'
                        : 'var(--color-inactive)'
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Sessions distribution</h2>
            <p className="text-sm text-muted-foreground">
              Subscriptions by session type
            </p>
          </div>
          <ChartContainer config={chartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Pie data={filteredSessionDistribution} dataKey="value" nameKey="name" label>
                {filteredSessionDistribution.map((slice) => {
                  const key = slice.name.toLowerCase();
                  const colorKey =
                    key === 'morning' || key === 'afternoon' || key === 'night'
                      ? key
                      : 'unknown';
                  return (
                    <Cell
                      key={slice.name}
                      fill={`var(--color-${colorKey})`}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ChartContainer>
        </Card>
      </div>
    </div>
  );
}

