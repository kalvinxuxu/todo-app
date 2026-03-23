import { memo } from 'react';
import { getTagColor } from '../utils/tagAnalyzer';

// ==================== 时间范围筛选 ====================
export type TimeRangeFilter = 'all' | 'today' | 'past-5-days' | 'past-7-days';

interface TimeRangeFilterTabsProps {
  currentTimeRangeFilter: TimeRangeFilter;
  onTimeRangeFilterChange: (filter: TimeRangeFilter) => void;
}

export const TimeRangeFilterTabs = memo(({
  currentTimeRangeFilter,
  onTimeRangeFilterChange
}: TimeRangeFilterTabsProps) => {
  return (
    <div className="time-range-filter-tabs">
      <button
        className={`time-range-filter-tab ${currentTimeRangeFilter === 'today' ? 'active' : ''}`}
        onClick={() => onTimeRangeFilterChange('today')}
      >
        今日
      </button>
      <button
        className={`time-range-filter-tab ${currentTimeRangeFilter === 'past-5-days' ? 'active' : ''}`}
        onClick={() => onTimeRangeFilterChange('past-5-days')}
      >
        过去 5 天
      </button>
      <button
        className={`time-range-filter-tab ${currentTimeRangeFilter === 'past-7-days' ? 'active' : ''}`}
        onClick={() => onTimeRangeFilterChange('past-7-days')}
      >
        过去 7 天
      </button>
      <button
        className={`time-range-filter-tab ${currentTimeRangeFilter === 'all' ? 'active' : ''}`}
        onClick={() => onTimeRangeFilterChange('all')}
      >
        全部
      </button>
    </div>
  );
});

TimeRangeFilterTabs.displayName = 'TimeRangeFilterTabs';

// ==================== 任务状态筛选 ====================
export type TaskStatusFilter = 'all' | 'pending' | 'completed';

interface TaskStatusFilterTabsProps {
  currentTaskStatusFilter: TaskStatusFilter;
  onTaskStatusFilterChange: (filter: TaskStatusFilter) => void;
}

export const TaskStatusFilterTabs = memo(({
  currentTaskStatusFilter,
  onTaskStatusFilterChange
}: TaskStatusFilterTabsProps) => {
  return (
    <div className="task-status-filter-tabs">
      <button
        className={`task-status-filter-tab ${currentTaskStatusFilter === 'all' ? 'active' : ''}`}
        onClick={() => onTaskStatusFilterChange('all')}
      >
        全部
      </button>
      <button
        className={`task-status-filter-tab ${currentTaskStatusFilter === 'pending' ? 'active' : ''}`}
        onClick={() => onTaskStatusFilterChange('pending')}
      >
        进行中
      </button>
      <button
        className={`task-status-filter-tab ${currentTaskStatusFilter === 'completed' ? 'active' : ''}`}
        onClick={() => onTaskStatusFilterChange('completed')}
      >
        已完成
      </button>
    </div>
  );
});

TaskStatusFilterTabs.displayName = 'TaskStatusFilterTabs';

// ==================== 标签筛选 ====================
interface TagFilterTabsProps {
  allUsedTags: string[];
  selectedTagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
}

export const TagFilterTabs = memo(({ allUsedTags, selectedTagFilter, onTagFilterChange }: TagFilterTabsProps) => {
  if (allUsedTags.length === 0) return null;

  return (
    <div className="tag-filter-tabs">
      <button
        className={`tag-filter-tab ${selectedTagFilter === null ? 'active' : ''}`}
        onClick={() => onTagFilterChange(null)}
      >
        全部
      </button>
      {allUsedTags.map(tag => (
        <button
          key={tag}
          className={`tag-filter-tab ${selectedTagFilter === tag ? 'active' : ''}`}
          onClick={() => onTagFilterChange(tag)}
          style={{
            borderColor: selectedTagFilter === tag ? getTagColor(tag) : undefined,
            color: selectedTagFilter === tag ? getTagColor(tag) : undefined
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
});

TagFilterTabs.displayName = 'TagFilterTabs';
