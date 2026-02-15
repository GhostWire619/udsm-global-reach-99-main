import { TrendingUp, Eye, Download } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { OJSTimelineItem } from "@/services/ojsApi";

interface ViewsTimelineProps {
  abstractViews: OJSTimelineItem[];
  galleyViews: OJSTimelineItem[];
}

const chartConfig = {
  abstracts: {
    label: "Abstract Views",
    color: "hsl(210, 100%, 20%)",
  },
  downloads: {
    label: "Downloads",
    color: "hsl(42, 100%, 45%)",
  },
} satisfies ChartConfig;

const ViewsTimeline = ({ abstractViews, galleyViews }: ViewsTimelineProps) => {
  // Combine both timelines by date
  const dateMap = new Map<string, { date: string; abstracts: number; downloads: number }>();

  abstractViews.forEach((item) => {
    const formatted = formatDateLabel(item.date);
    const existing = dateMap.get(item.date) || { date: item.date, abstracts: 0, downloads: 0 };
    existing.abstracts = item.value;
    existing.date = formatted;
    dateMap.set(item.date, existing);
  });

  galleyViews.forEach((item) => {
    const formatted = formatDateLabel(item.date);
    const existing = dateMap.get(item.date) || { date: formatted, abstracts: 0, downloads: 0 };
    existing.downloads = item.value;
    existing.date = formatted;
    dateMap.set(item.date, existing);
  });

  // Sort by date and convert to array
  const data = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);

  if (data.length === 0) {
    return null;
  }

  // Calculate totals
  const totalAbstracts = data.reduce((sum, d) => sum + d.abstracts, 0);
  const totalDownloads = data.reduce((sum, d) => sum + d.downloads, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[hsl(210,100%,20%)]" />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Views Over Time
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(210,100%,20%)]" />
            <span className="text-muted-foreground">Abstracts ({totalAbstracts.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(42,100%,45%)]" />
            <span className="text-muted-foreground">Downloads ({totalDownloads.toLocaleString()})</span>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillAbstracts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(210, 100%, 20%)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(210, 100%, 20%)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillDownloads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(42, 100%, 45%)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(42, 100%, 45%)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <ChartTooltip
            cursor={{ stroke: "hsl(var(--border))" }}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => value}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()}`,
                  name === "abstracts" ? "Abstract Views" : "Downloads",
                ]}
              />
            }
          />
          <Area
            dataKey="abstracts"
            type="monotone"
            fill="url(#fillAbstracts)"
            stroke="hsl(210, 100%, 20%)"
            strokeWidth={2}
          />
          <Area
            dataKey="downloads"
            type="monotone"
            fill="url(#fillDownloads)"
            stroke="hsl(42, 100%, 45%)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

function formatDateLabel(dateStr: string): string {
  // dateStr format: "YYYY-MM-DD" or "YYYY-MM"
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[month - 1]} ${year.slice(-2)}`;
  }
  return dateStr;
}

export default ViewsTimeline;
