import { formatDateForInput } from '../utils/dateUtils';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  hasTaskDates: number[]; // 有任务的日期戳数组
}

export function DatePicker({ selectedDate, onDateChange, hasTaskDates }: DatePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value);
  };

  return (
    <div className="date-picker-container">
      <label className="date-picker-label">
        <svg className="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="date-picker-input"
      />
    </div>
  );
}
