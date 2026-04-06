import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/shared/DatePicker';

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function DateRangePicker({ from, to, onFromChange, onToChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Label className="text-xs sm:text-sm text-muted-foreground shrink-0">从</Label>
        <DatePicker
          value={from}
          onChange={onFromChange}
          placeholder="开始日期"
          className="w-36 sm:w-44 text-xs sm:text-sm"
        />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Label className="text-xs sm:text-sm text-muted-foreground shrink-0">到</Label>
        <DatePicker
          value={to}
          onChange={onToChange}
          placeholder="结束日期"
          className="w-36 sm:w-44 text-xs sm:text-sm"
        />
      </div>
    </div>
  );
}
