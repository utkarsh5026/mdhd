import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TimeRange } from "@/utils/time";

interface TimeRangeSelectProps {
  onTimeRangeChange: (timeRange: TimeRange) => void;
  currentTimeRange: TimeRange;
}

const TimeRangeSelect: React.FC<TimeRangeSelectProps> = ({
  onTimeRangeChange,
  currentTimeRange,
}) => {
  const handleTimeRangeChange = (value: TimeRange) => {
    onTimeRangeChange(value);
  };

  return (
    <Select
      value={currentTimeRange}
      onValueChange={(v) => handleTimeRangeChange(v as TimeRange)}
    >
      <SelectTrigger className="h-8 text-xs w-24 bg-card border-border/50 focus:ring-primary/20 focus:border-primary/30 rounded-2xl">
        <SelectValue placeholder="Time Range" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl font-cascadia-code">
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="quarter">This Quarter</SelectItem>
        <SelectItem value="year">This Year</SelectItem>
        <SelectItem value="all">All Time</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default TimeRangeSelect;
