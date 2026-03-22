import { memo } from 'react';
import { getTagColor } from '../utils/tagAnalyzer';

interface FilterTabsProps {
  currentFilter: 'all' | 'pending' | 'completed';
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
  showFilterTabs?: boolean;
}

export const FilterTabs = memo(({ currentFilter, onFilterChange, showFilterTabs = true }: FilterTabsProps) => {
  if (!showFilterTabs) return null;

  return (
    <div className="filter-tabs">
      <button
        className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
        onClick={() => onFilterChange('all')}
      >
        All Task
      </button>
    </div>
  );
});

FilterTabs.displayName = 'FilterTabs';

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
        All
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

// 新增：汇总筛选组件
export type SummaryFilterType =
  | 'all'
  | 'custom-range'
  | 'past-5-days'
  | 'past-7-days'
  | 'finished'
  | 'unfinished'
  | 'today';

interface SummaryFilterTabsProps {
  currentSummaryFilter: SummaryFilterType;
  onSummaryFilterChange: (filter: SummaryFilterType) => void;
  onCustomRangeChange?: (startDate: string, endDate: string) => void;
}

export const SummaryFilterTabs = memo(({
  currentSummaryFilter,
  onSummaryFilterChange,
  onCustomRangeChange
}: SummaryFilterTabsProps) => {
  return (
    <div className="summary-filter-tabs">
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'today' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('today')}
      >
        今日
      </button>
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'past-5-days' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('past-5-days')}
      >
        过去 5 天
      </button>
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'past-7-days' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('past-7-days')}
      >
        过去 7 天
      </button>
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'finished' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('finished')}
      >
        已完成
      </button>
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'unfinished' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('unfinished')}
      >
        未完成
      </button>
      <button
        className={`summary-filter-tab ${currentSummaryFilter === 'all' ? 'active' : ''}`}
        onClick={() => onSummaryFilterChange('all')}
      >
        全部任务
      </button>
    </div>
  );
});

SummaryFilterTabs.displayName = 'SummaryFilterTabs';

// 任务状态筛选（All/Todo/Done）
interface TaskStatusFilterTabsProps {
  currentTaskStatusFilter: 'all' | 'pending' | 'completed';
  onTaskStatusFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
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
        All
      </button>
      <button
        className={`task-status-filter-tab ${currentTaskStatusFilter === 'pending' ? 'active' : ''}`}
        onClick={() => onTaskStatusFilterChange('pending')}
      >
        To Do
      </button>
      <button
        className={`task-status-filter-tab ${currentTaskStatusFilter === 'completed' ? 'active' : ''}`}
        onClick={() => onTaskStatusFilterChange('completed')}
      >
        Done
      </button>
    </div>
  );
});

TaskStatusFilterTabs.displayName = 'TaskStatusFilterTabs';
