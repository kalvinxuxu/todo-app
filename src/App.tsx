import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'
import {
  DatePicker,
  TokenStatus,
  TodoItem,
  TagFilterTabs,
  TodoForm,
  TimeRangeFilterTabs,
  type TimeRangeFilter,
  TaskStatusFilterTabs,
  type TaskStatusFilter,
  WeatherWidget,
  FocusTimer,
} from './components'
import { useSwipeAndDrag, useTodoActions } from './hooks'
import {
  formatDateForInput,
  parseDateInput,
} from './utils/dateUtils'

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;
  priority: 'very-necessary' | 'important' | 'Normal' | '一般';
  order: number;
  tags: string[];
}

// 迁移现有数据，添加新字段
function migrateTodos(todos: any[]): Todo[] {
  const priorityMap: Record<string, 'very-necessary' | 'important' | 'Normal' | '一般'> = {
    'high': 'very-necessary',
    'medium': 'Normal',
    'low': '一般',
  };

  return todos.map((todo, index) => ({
    ...todo,
    priority: priorityMap[todo.priority] || 'Normal',
    order: todo.order ?? index,
    dueDate: todo.dueDate ?? todo.createdAt,
    tags: todo.tags ?? [],
  }));
}

// 获取优先级显示颜色
function getPriorityColor(priority: 'very-necessary' | 'important' | 'Normal' | '一般', order: number, totalItems: number): string {
  const baseColors = {
    'very-necessary': { r: 239, g: 68, b: 68 },
    'important': { r: 251, g: 146, b: 60 },
    'Normal': { r: 59, g: 130, b: 246 },
    '一般': { r: 156, g: 163, b: 175 },
  };

  const positionFactor = totalItems > 1 ? 1 - (order / (totalItems - 1)) * 0.4 : 0;
  const base = baseColors[priority];
  const darken = (value: number) => Math.floor(value * (0.6 + positionFactor * 0.4));

  return `rgb(${darken(base.r)}, ${darken(base.g)}, ${darken(base.b)})`;
}

// 获取时间范围筛选的日期范围
function getTimeRangeDateRange(timeRange: TimeRangeFilter): { start: number; end: number } | null {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  switch (timeRange) {
    case 'today': {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return { start: today.getTime(), end: endOfToday.getTime() };
    }
    case 'past-5-days': {
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      return { start: fiveDaysAgo.getTime(), end: now };
    }
    case 'past-7-days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { start: sevenDaysAgo.getTime(), end: now };
    }
    case 'all':
      return null;
  }
}

// 获取友好的时间范围描述
function getTimeRangeLabel(filter: TimeRangeFilter): string {
  switch (filter) {
    case 'today': return '今日';
    case 'past-5-days': return '过去 5 天';
    case 'past-7-days': return '过去 7 天';
    default: return '全部';
  }
}

// 格式化日期显示
function formatDateForDisplay(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return '今日';
  if (isYesterday) return '昨日';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return migrateTodos(parsed);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(Date.now()));
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>('today');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>('all');
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);

  // 处理日历日期切换
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    // 当用户点击日历日期时，切换到自定义日期模式
    if (!isCustomDateMode) {
      setIsCustomDateMode(true);
      setTimeRangeFilter('all');
    }
  }, [isCustomDateMode]);

  // 当时间范围筛选改变时，退出自定义日期模式
  useEffect(() => {
    if (timeRangeFilter !== 'all') {
      setIsCustomDateMode(false);
      // 如果切换到"今日"，自动将选中日期切换到今天
      if (timeRangeFilter === 'today') {
        const todayStr = formatDateForInput(Date.now());
        setSelectedDate(todayStr);
      }
    }
  }, [timeRangeFilter]);

  // 使用防抖同步 localStorage，避免频繁写入
  const todosRef = useRef(todos);
  todosRef.current = todos;

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('todos', JSON.stringify(todosRef.current));
    }, 500);
    return () => clearTimeout(timer);
  }, [todos]);

  // 点击页面其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const selectedDateTimestamp = useMemo(() => parseDateInput(selectedDate), [selectedDate]);

  // 计算有未完成任务的日期列表（用于日历红点标注）
  const pendingTaskDates = useMemo(() => {
    return todos
      .filter(todo => !todo.completed)
      .map(todo => {
        const dueDate = todo.dueDate ?? todo.createdAt;
        const date = new Date(dueDate);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      });
  }, [todos]);

  // 自定义 hooks
  const {
    addTodo,
    toggleTodo,
    deleteTodo,
    updatePriority,
    addTag,
    removeTag,
    copyTodoToTomorrow,
    startEditing,
    saveEdit,
    cancelEdit,
    copyTodoToDate,
    moveTodoToDate,
  } = useTodoActions({
    todos,
    setTodos,
    inputValue,
    setInputValue,
    selectedDateTimestamp,
    selectedDate,
    setOpenMenuId,
    setEditingTodoId,
    setEditText,
  });

  const filteredTodos = useMemo(() => {
    let result = todos;

    // 1. 自定义日期模式：显示选中日期的任务
    if (isCustomDateMode) {
      const selectedDateStart = selectedDateTimestamp;
      const selectedDateEnd = selectedDateTimestamp + 24 * 60 * 60 * 1000 - 1;
      result = result.filter(todo => {
        const todoDate = todo.dueDate ?? todo.createdAt;
        return todoDate >= selectedDateStart && todoDate <= selectedDateEnd;
      });
    } else {
      // 2. 时间范围筛选
      const dateRange = getTimeRangeDateRange(timeRangeFilter);
      if (dateRange) {
        result = result.filter(todo => {
          const todoDate = todo.dueDate ?? todo.createdAt;
          return todoDate >= dateRange.start && todoDate <= dateRange.end;
        });
      }
    }

    // 3. 标签筛选
    if (selectedTagFilter) {
      result = result.filter(todo => todo.tags.includes(selectedTagFilter));
    }

    // 4. 任务状态筛选
    if (taskStatusFilter === 'pending') {
      result = result.filter(todo => !todo.completed);
    } else if (taskStatusFilter === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    return result.sort((a, b) => {
      const priorityWeight = { 'very-necessary': 0, 'important': 1, 'Normal': 2, '一般': 3 };
      return priorityWeight[a.priority] - priorityWeight[b.priority] || a.order - b.order;
    });
  }, [todos, isCustomDateMode, timeRangeFilter, selectedDateTimestamp, selectedTagFilter, taskStatusFilter]);

  const allUsedTags = useMemo(() => Array.from(new Set(todos.flatMap(t => t.tags))), [todos]);
  const completedCount = useMemo(() => filteredTodos.filter(t => t.completed).length, [filteredTodos]);

  // 滑动拖拽逻辑
  const {
    draggedId,
    swipeState,
    touchDragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSwipeAndDrag({
    filteredTodos,
    editingTodoId,
    onTodosChange: setTodos,
  });

  // 为单个 todo 创建处理函数
  const createTodoHandlers = useCallback((todo: Todo, index: number) => ({
    onToggle: () => toggleTodo(todo.id),
    onDelete: () => deleteTodo(todo.id),
    onUpdatePriority: (priority: 'very-necessary' | 'important' | 'Normal' | '一般') => updatePriority(todo.id, priority),
    onAddTag: (tag: string) => addTag(todo.id, tag),
    onRemoveTag: (tag: string) => removeTag(todo.id, tag),
    onTagClick: () => setSelectedTagFilter(selectedTagFilter === todo.tags[0] ? null : todo.tags[0]),
    onMenuClick: () => setOpenMenuId(openMenuId === todo.id ? null : todo.id),
    onCopyToTomorrow: () => copyTodoToTomorrow(todo.id),
    onStartEditing: () => startEditing(todo),
    onSaveEdit: (text: string) => saveEdit(todo.id, text),
    onCancelEdit: () => cancelEdit(),
    onSetEditingTags: (id: number | null) => setEditingTags(id),
    onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, todo.id, index, todo.completed),
    onTouchMove: (e: React.TouchEvent) => handleTouchMove(e, todo.id),
    onTouchEnd: () => handleTouchEnd(todo.id, () => toggleTodo(todo.id), () => deleteTodo(todo.id)),
    onDragStart: (e: React.DragEvent) => handleDragStart(e, todo.id),
    onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
    onDragEnd: () => handleDragEnd(),
    getPriorityColor: () => getPriorityColor(todo.priority, index, filteredTodos.length),
  }), [toggleTodo, deleteTodo, updatePriority, addTag, removeTag, selectedTagFilter, openMenuId, copyTodoToTomorrow, startEditing, saveEdit, cancelEdit, handleTouchStart, handleTouchMove, handleTouchEnd, handleDragStart, handleDragOver, handleDragEnd, filteredTodos.length, copyTodoToDate]);

  // 处理拖拽到日期（移动任务到新日期）
  const handleDateDrop = useCallback((dateStr: string, todoId: number) => {
    moveTodoToDate(dateStr, todoId);
  }, [moveTodoToDate]);

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Personal</h1>
      </div>

      {/* 日历和侧边工具区域 */}
      <div className="calendar-sidebar-container">
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          hasTaskDates={pendingTaskDates}
          onDateDrop={handleDateDrop}
          hideDateInput={true}
        />
        <div className="sidebar">
          <WeatherWidget />
          <FocusTimer />
        </div>
      </div>

      <div className="time-range-filter-container">
        <TimeRangeFilterTabs
          currentTimeRangeFilter={timeRangeFilter}
          onTimeRangeFilterChange={setTimeRangeFilter}
        />
      </div>

      <div className="date-label">
        {isCustomDateMode ? formatDateForDisplay(selectedDateTimestamp) : getTimeRangeLabel(timeRangeFilter)}
      </div>

      <TaskStatusFilterTabs
        currentTaskStatusFilter={taskStatusFilter}
        onTaskStatusFilterChange={setTaskStatusFilter}
      />

      <TagFilterTabs
        allUsedTags={allUsedTags}
        selectedTagFilter={selectedTagFilter}
        onTagFilterChange={setSelectedTagFilter}
      />

      <TodoForm
        inputValue={inputValue}
        onInputChange={setInputValue}
        onAdd={addTodo}
      />

      <ul className="todo-list" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {filteredTodos.length === 0 ? (
          <li className="empty-state">
            {isCustomDateMode && '这天没有任务'}
            {timeRangeFilter === 'today' && '今日没有任务'}
            {timeRangeFilter === 'past-5-days' && '过去 5 天没有任务'}
            {timeRangeFilter === 'past-7-days' && '过去 7 天没有任务'}
            {timeRangeFilter === 'all' && selectedTagFilter === null && taskStatusFilter === 'all' && !isCustomDateMode && '还没有任务，添加一个吧！'}
            {taskStatusFilter === 'pending' && '没有进行中的任务'}
            {taskStatusFilter === 'completed' && '没有已完成的任务'}
            {selectedTagFilter !== null && `没有标签"${selectedTagFilter}"的任务`}
          </li>
        ) : (
          filteredTodos.map((todo, index) => {
            const handlers = createTodoHandlers(todo, index);
            const isSwiping = swipeState.todoId === todo.id;
            const isDragging = touchDragState.todoId === todo.id;
            const swipeOffset = isSwiping ? swipeState.offsetX : 0;
            const dragOffset = isDragging ? touchDragState.offsetY : 0;

            return (
              <TodoItem
                key={todo.id}
                todo={todo}
                isDragging={isDragging}
                isSwiping={isSwiping}
                swipeOffset={swipeOffset}
                dragOffset={dragOffset}
                editingTags={editingTags}
                editingTodoId={editingTodoId}
                editText={editText}
                openMenuId={openMenuId}
                selectedTagFilter={selectedTagFilter}
                draggedId={draggedId}
                {...handlers}
              />
            );
          })
        )}
      </ul>

      <div className="stats">
        <span>{completedCount}</span> of <span>{filteredTodos.length}</span> completed
      </div>
      <TokenStatus />
    </div>
  )
}

export default App
