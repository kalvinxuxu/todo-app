import { useState, useEffect } from 'react'
import './App.css'
import { TokenStatus } from './components/TokenStatus'
import { DatePicker } from './components/DatePicker'
import { TagBadge } from './components/TagBadge'
import { analyzeTags, AVAILABLE_TAGS, getTagColor } from './utils/tagAnalyzer'
import {
  formatDateForInput,
  parseDateInput,
  getStartOfDay,
  getEndOfDay,
  formatDisplayDate,
  getFriendlyDateLabel
} from './utils/dateUtils'

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;        // 任务目标日期（默认为创建日期）
  priority: 'very-necessary' | 'important' | 'Normal' | '一般';  // 优先级
  order: number;           // 排序顺序（同优先级内使用）
  tags: string[];          // 标签数组
}

type FilterType = 'all' | 'pending' | 'completed';

// 迁移现有数据，添加新字段
function migrateTodos(todos: any[]): Todo[] {
  // 优先级映射
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
    tags: todo.tags ?? analyzeTags(todo.text),
  }));
}

// 获取优先级颜色深浅
function getPriorityColor(priority: 'very-necessary' | 'important' | 'Normal' | '一般', order: number, totalItems: number): string {
  // 基础优先级颜色
  const baseColors = {
    'very-necessary': { r: 239, g: 68, b: 68 },    // 红色系 - 最重要
    'important': { r: 251, g: 146, b: 60 },        // 橙色系 - 重要
    'Normal': { r: 59, g: 130, b: 246 },           // 蓝色系 - 普通
    '一般': { r: 156, g: 163, b: 175 },            // 灰色系 - 一般
  };

  // 根据排序位置计算深浅（越靠前越深）
  const positionFactor = totalItems > 1 ? 1 - (order / (totalItems - 1)) * 0.4 : 0;

  const base = baseColors[priority];
  const darken = (value: number) => Math.floor(value * (0.6 + positionFactor * 0.4));

  return `rgb(${darken(base.r)}, ${darken(base.g)}, ${darken(base.b)})`;
}

function App() {
  // 数据迁移
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
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(Date.now()));
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [editingTags, setEditingTags] = useState<number | null>(null);

  // 保存时迁移数据
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // 获取选定日期的时间戳
  const selectedDateTimestamp = parseDateInput(selectedDate);

  // 优先级权重（用于排序）
  const priorityWeight: Record<'very-necessary' | 'important' | 'Normal' | '一般', number> = {
    'very-necessary': 0,  // 最靠前
    'important': 1,
    'Normal': 2,
    '一般': 3,             // 最靠后
  };

  // 筛选任务：先按日期筛选，再按状态和标签筛选，最后按优先级和 order 排序
  const filteredTodos = todos
    .filter(todo => {
      const todoDate = todo.dueDate ?? todo.createdAt;
      const startOfDay = getStartOfDay(selectedDateTimestamp);
      const endOfDay = getEndOfDay(selectedDateTimestamp);
      return todoDate >= startOfDay && todoDate <= endOfDay;
    })
    .filter(todo => {
      if (currentFilter === 'pending') return !todo.completed;
      if (currentFilter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => {
      if (!selectedTagFilter) return true;
      return todo.tags.includes(selectedTagFilter);
    })
    .sort((a, b) => {
      // 先按优先级排序
      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // 同优先级内按 order 排序
      return a.order - b.order;
    });

  const addTodo = () => {
    const text = inputValue.trim();
    if (!text) return;

    const now = Date.now();
    const autoTags = analyzeTags(text);

    const newTodo: Todo = {
      id: now,
      text,
      completed: false,
      createdAt: now,
      dueDate: selectedDateTimestamp, // 默认添加到选定日期
      priority: 'Normal',
      order: todos.length,
      tags: autoTags,
    };

    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const updatePriority = (id: number, priority: 'very-necessary' | 'important' | 'Normal' | '一般') => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, priority } : todo
    ));
  };

  // 拖拽排序相关函数
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedId === null) return;

    const draggedIndex = filteredTodos.findIndex(t => t.id === draggedId);
    if (draggedIndex === index) return;

    // 交换 order 值
    const newTodos = [...todos];
    const draggedTodo = newTodos.find(t => t.id === draggedId);
    const targetTodo = filteredTodos[index];

    if (draggedTodo && targetTodo) {
      draggedTodo.order = targetTodo.order;
      // 更新其他任务的顺序
      newTodos.forEach(todo => {
        if (todo.id !== draggedId && filteredTodos.includes(todo)) {
          const todoIndex = filteredTodos.findIndex(t => t.id === todo.id);
          if (draggedIndex < index) {
            if (todoIndex > draggedIndex && todoIndex <= index) {
              todo.order -= 1;
            }
          } else {
            if (todoIndex >= index && todoIndex < draggedIndex) {
              todo.order += 1;
            }
          }
        }
      });

      setTodos(newTodos);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedId(null);
  };

  // 标签相关函数
  const addTag = (todoId: number, tag: string) => {
    if (!tag.trim()) return;
    setTodos(todos.map(todo =>
      todo.id === todoId && !todo.tags.includes(tag)
        ? { ...todo, tags: [...todo.tags, tag] }
        : todo
    ));
  };

  const removeTag = (todoId: number, tag: string) => {
    setTodos(todos.map(todo =>
      todo.id === todoId
        ? { ...todo, tags: todo.tags.filter(t => t !== tag) }
        : todo
    ));
  };

  // 获取所有使用的标签
  const allUsedTags = Array.from(new Set(todos.flatMap(t => t.tags)));

  const completedCount = filteredTodos.filter(t => t.completed).length;

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Personal</h1>
      </div>

      {/* 日期选择器 */}
      <DatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        hasTaskDates={todos.map(t => t.dueDate ?? t.createdAt)}
      />

      {/* 日期标签 */}
      <div className="date-label">
        {getFriendlyDateLabel(selectedDateTimestamp)}
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCurrentFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${currentFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setCurrentFilter('pending')}
        >
          To Do
        </button>
        <button
          className={`filter-tab ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setCurrentFilter('completed')}
        >
          Done
        </button>
      </div>

      {/* 标签筛选 */}
      {allUsedTags.length > 0 && (
        <div className="tag-filter-tabs">
          <button
            className={`tag-filter-tab ${selectedTagFilter === null ? 'active' : ''}`}
            onClick={() => setSelectedTagFilter(null)}
          >
            All
          </button>
          {allUsedTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter-tab ${selectedTagFilter === tag ? 'active' : ''}`}
              onClick={() => setSelectedTagFilter(tag)}
              style={{
                borderColor: selectedTagFilter === tag ? getTagColor(tag) : undefined,
                color: selectedTagFilter === tag ? getTagColor(tag) : undefined
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="input-group">
        <input
          type="text"
          id="todo-input"
          placeholder="Write a task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button id="add-btn" onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {filteredTodos.length === 0 ? (
          <li className="empty-state">
            {currentFilter === 'all' && selectedTagFilter === null && 'No tasks yet. Add one above!'}
            {currentFilter === 'pending' && selectedTagFilter === null && 'All caught up!'}
            {currentFilter === 'completed' && selectedTagFilter === null && 'No completed tasks yet'}
            {selectedTagFilter !== null && `No tasks with tag "${selectedTagFilter}"`}
            {currentFilter !== 'all' && selectedTagFilter !== null && 'No matching tasks'}
          </li>
        ) : (
          filteredTodos.map((todo, index) => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                borderLeft: `4px solid ${getPriorityColor(todo.priority, index, filteredTodos.length)}`,
              }}
            >
              <div className="checkbox" onClick={() => toggleTodo(todo.id)}></div>
              <div className="todo-content">
                <span className="todo-text">{todo.text}</span>
                <div className="todo-meta">
                  <span className="todo-date">{formatDisplayDate(todo.dueDate ?? todo.createdAt)}</span>
                  <select
                    className="priority-select"
                    value={todo.priority}
                    onChange={(e) => updatePriority(todo.id, e.target.value as 'very-necessary' | 'important' | 'Normal' | '一般')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="very-necessary">🔥 Very Necessary</option>
                    <option value="important">⚡ Important</option>
                    <option value="Normal">📌 Normal</option>
                    <option value="一般">💧 一般</option>
                  </select>
                </div>
                <div className="todo-tags">
                  {todo.tags.map(tag => (
                    <TagBadge
                      key={tag}
                      tag={tag}
                      removable={editingTags === todo.id}
                      onRemove={() => removeTag(todo.id, tag)}
                      active={selectedTagFilter === tag}
                      onClick={() => setSelectedTagFilter(tag)}
                    />
                  ))}
                  {editingTags === todo.id ? (
                    <div className="tag-input-container">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTag(todo.id, e.target.value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">+ 添加标签</option>
                        {AVAILABLE_TAGS.filter(t => !todo.tags.includes(t)).map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                      <button
                        className="close-tag-editor"
                        onClick={() => setEditingTags(null)}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="add-tag-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTags(todo.id);
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
              <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
                <span></span>
                <span></span>
                <span></span>
              </button>
            </li>
          ))
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
