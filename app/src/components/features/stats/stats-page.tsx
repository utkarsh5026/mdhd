import { Activity, ArrowLeft, BookOpenText, Flame, Timer, Trophy } from 'lucide-react';
import { type ComponentType, memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LoadingFallback } from '@/components/utils';
import { fetchStatsSummary, type StatsSummary } from '@/services/progress';

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <Card className="relative overflow-hidden border-border/70 p-4 transition-colors hover:border-primary/40">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      </div>
      <div className="rounded-md border border-border/80 bg-muted/40 p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
  </Card>
);

const SevenDayChart = ({ days }: { days: StatsSummary['last_7_days'] }) => {
  const chartData = days.map((d) => ({
    day: d.day,
    label: new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' }),
    seconds: d.seconds_spent,
  }));
  const chartConfig = {
    seconds: {
      label: 'Reading time',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-3">
      <ChartContainer
        config={chartConfig}
        className="h-44 w-full rounded-lg border border-border/60 bg-muted/20 p-2"
      >
        <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px]"
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => formatDuration(Number(value))}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.day
                    ? new Date(payload[0].payload.day).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''
                }
              />
            }
          />
          <Bar dataKey="seconds" fill="var(--color-seconds)" radius={999} maxBarSize={24} />
        </BarChart>
      </ChartContainer>
      {days.map((d) => {
        const label = new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' });
        return (
          <div key={`value-${d.day}`} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{formatDuration(d.seconds_spent)}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatsPage = memo(() => {
  const [data, setData] = useState<StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatsSummary()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stats'));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Reading Stats</h1>
        <Card className="mt-4 border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!data) return <LoadingFallback />;

  const weekTotalSeconds = data.last_7_days.reduce((sum, day) => sum + day.seconds_spent, 0);
  const topDay = data.last_7_days.reduce((best, day) =>
    day.seconds_spent > best.seconds_spent ? day : best
  );
  const topDayLabel = new Date(topDay.day).toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="relative overflow-hidden border-border/70 p-6 sm:p-7">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Progress dashboard
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reading Stats
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              This week you logged {formatDuration(weekTotalSeconds)} across your documents.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/90 p-3 text-sm shadow-sm">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Most active:</span>
            <span className="font-medium">
              {topDayLabel} ({formatDuration(topDay.seconds_spent)})
            </span>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reader
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total time"
          value={formatDuration(data.total_seconds)}
          hint="All-time tracked reading"
          icon={Timer}
        />
        <StatCard
          label="Files completed"
          value={data.files_completed}
          hint="Documents fully finished"
          icon={BookOpenText}
        />
        <StatCard
          label="Current streak"
          value={`${data.current_streak} days`}
          hint="Consecutive active days"
          icon={Flame}
        />
        <StatCard
          label="Longest streak"
          value={`${data.longest_streak} days`}
          hint="Best run so far"
          icon={Trophy}
        />
      </div>

      <Card className="border-border/70 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Last 7 days
        </h2>
        <SevenDayChart days={data.last_7_days} />
      </Card>

      <Card className="border-border/70 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Recent files
        </h2>
        {data.recent_files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reading activity yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {data.recent_files.map((f) => (
              <li
                key={f.file_id}
                className="group flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3.5 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/35"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium transition-colors group-hover:text-primary">
                    {f.name}
                  </div>
                  <div className="text-xs text-muted-foreground/90">
                    Section {f.section_index + 1} · {formatRelative(f.updated_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
});
StatsPage.displayName = 'StatsPage';

export default StatsPage;
