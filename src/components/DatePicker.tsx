import { memo, useMemo } from 'react';
import { getTagColor } from '../utils/tagAnalyzer';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  hasTaskDates?: number[];
  onDateDrop?: (date: string, todoId: number) => void;
  hideDateInput?: boolean;
}

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  hasTask: boolean;
  onClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const CalendarDay = memo(({ date, isSelected, hasTask, onClick, onDrop, onDragOver }: CalendarDayProps) => {
  const day = date.getDate();
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div
      className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <span className="day-number">{day}</span>
      {hasTask && <span className="task-dot" />}
    </div>
  );
});

CalendarDay.displayName = 'CalendarDay';

export const DatePicker = memo(({ selectedDate, onDateChange, hasTaskDates = [], onDateDrop, hideDateInput = false }: DatePickerProps) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value);
  };

  // 生成当前月份的所有日期
  const calendarDays = useMemo(() => {
    const selected = new Date(selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: Date[] = [];

    // 添加上个月的日期来填充第一周
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // 添加当前月的日期
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    // 添加下个月的日期来填充最后一周
    const remainingDays = 42 - days.length; // 6 行 x 7 天 = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [selectedDate]);

  // 将 hasTaskDates 转换为 Set 以便快速查找
  const hasTaskDatesSet = useMemo(() => new Set(hasTaskDates), [hasTaskDates]);

  // 检查某日期是否有未完成的任务
  const hasPendingTask = (date: Date) => {
    const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return hasTaskDatesSet.has(timestamp);
  };

  // 处理日期拖拽放置
  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (onDateDrop) {
      const todoId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(todoId)) {
        const dateStr = date.toISOString().split('T')[0];
        onDateDrop(dateStr, todoId);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="date-picker-container">
      {/* 保持原有的日期选择器输入框 */}
      {!hideDateInput && (
        <div className="date-picker-input-wrapper">
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
      )}

      {/* 新增：月历视图 */}
      <div className="calendar-view">
        <div className="calendar-header">
          {weekDays.map((day, index) => (
            <div key={index} className={`calendar-header-cell ${index === 0 || index === 6 ? 'weekend' : ''}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;

            return (
              <CalendarDay
                key={index}
                date={date}
                isSelected={isSelected}
                hasTask={hasPendingTask(date)}
                onClick={() => onDateChange(dateStr)}
                onDrop={(e) => handleDrop(e, date)}
                onDragOver={handleDragOver}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';
