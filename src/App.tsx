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
  dueDate?: number;
  priority: 'very-necessary' | 'important' | 'Normal' | '一般';
  order: number;
  tags: string[];
}

type FilterType = 'all' | 'pending' | 'completed';

// 触屏滑动状态
interface SwipeState {
  todoId: number | null;
  offsetX: number;
  isComplete: boolean;
  isDelete: boolean;
}

// 获取优先级颜色深浅
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
    tags: todo.tags ?? analyzeTags(todo.text),
  }));
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
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(Date.now()));
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [editingTags, setEditingTags] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // 触屏滑动状态
  const [swipeState, setSwipeState] = useState<SwipeState>({
    todoId: null,
    offsetX: 0,
    isComplete: false,
    isDelete: false,
  });

  // 触屏拖拽状态
  const [touchDragState, setTouchDragState] = useState<{
    todoId: number | null;
    fromIndex: number;
    offsetY: number;
  }>({ todoId: null, fromIndex: -1, offsetY: 0 });

  // 保存时迁移数据
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
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

  const selectedDateTimestamp = parseDateInput(selectedDate);

  const priorityWeight: Record<'very-necessary' | 'important' | 'Normal' | '一般', number> = {
    'very-necessary': 0,
    'important': 1,
    'Normal': 2,
    '一般': 3,
  };

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
      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
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
      dueDate: selectedDateTimestamp,
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
    // 设置拖拽图片，使其更清晰
    const dragImage = document.createElement('div');
    dragImage.style.width = '200px';
    dragImage.style.height = '60px';
    dragImage.style.background = '#f3efee';
    dragImage.style.borderRadius = '12px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedId === null) return;

    const draggedIndex = filteredTodos.findIndex(t => t.id === draggedId);
    if (draggedIndex === index || draggedIndex < 0) return;

    const newTodos = [...todos];
    const draggedTodo = filteredTodos[draggedIndex];
    const targetTodo = filteredTodos[index];

    if (draggedTodo && targetTodo) {
      // 找到被拖拽任务和目标任务在原始数组中的索引
      const draggedTodoOrigIndex = newTodos.findIndex(t => t.id === draggedTodo.id);
      const targetTodoOrigIndex = newTodos.findIndex(t => t.id === targetTodo.id);

      if (draggedTodoOrigIndex >= 0 && targetTodoOrigIndex >= 0) {
        // 从原位置移除
        const [removed] = newTodos.splice(draggedTodoOrigIndex, 1);
        // 插入到目标位置
        newTodos.splice(targetTodoOrigIndex, 0, removed);

        // 重新计算所有任务的 order 值
        newTodos.forEach((todo, i) => {
          todo.order = i;
        });

        setTodos(newTodos);
        setDraggedId(draggedTodo.id);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedId(null);
  };

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

  const copyTodoToTomorrow = (todoId: number) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const tomorrow = getStartOfDay(parseDateInput(selectedDate)) + 24 * 60 * 60 * 1000;

    const newTodo: Todo = {
      ...todo,
      id: Date.now(),
      dueDate: tomorrow,
      completed: false,
      order: todos.length,
    };

    setTodos([...todos, newTodo]);
    setOpenMenuId(null);
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id: number) => {
    if (!editText.trim()) return;
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ));
    setEditingTodoId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditText('');
  };

  const allUsedTags = Array.from(new Set(todos.flatMap(t => t.tags)));
  const completedCount = filteredTodos.filter(t => t.completed).length;

  // 触屏滑动处理函数
  const SWIPE_THRESHOLD = 100;
  const MAX_SWIPE = 140;
  const LONG_PRESS_DURATION = 400; // 长按触发拖拽的时间

  const handleTouchStart = (e: React.TouchEvent, todoId: number, index: number, isCompleted: boolean) => {
    if (editingTodoId !== null || swipeState.todoId !== null || touchDragState.todoId !== null) return;
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    target.dataset.startX = String(touch.clientX);
    target.dataset.startY = String(touch.clientY);
    target.dataset.dragIndex = String(index);

    // 清除之前的长按计时器
    if (target.dataset.longPressTimer) {
      clearTimeout(Number(target.dataset.longPressTimer));
    }

    // 设置长按计时器，长按后触发拖拽模式
    const timerId = setTimeout(() => {
      if (!swipeState.todoId && !isCompleted) {
        setTouchDragState({ todoId, fromIndex: index, offsetY: 0 });
        target.dataset.dragStartY = String(touch.clientY);
        // 震动反馈
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
    target.dataset.longPressTimer = String(timerId);
  };

  const handleTouchMove = (e: React.TouchEvent, todoId: number) => {
    if (editingTodoId !== null) return;

    const target = e.currentTarget as HTMLElement;
    const startX = parseFloat(target.dataset.startX || '0');
    const startY = parseFloat(target.dataset.startY || '0');
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // 已经在拖拽模式（长按触发后）
    if (touchDragState.todoId === todoId) {
      // 清除长按计时器
      if (target.dataset.longPressTimer) {
        clearTimeout(Number(target.dataset.longPressTimer));
        delete target.dataset.longPressTimer;
      }

      setTouchDragState(prev => ({ ...prev, offsetY: diffY }));

      // 计算目标索引
      const itemHeight = 80;
      const fromIndex = parseInt(target.dataset.dragIndex || '0');
      const indexDiff = Math.round(diffY / itemHeight);
      const newIndex = Math.max(0, Math.min(filteredTodos.length - 1, fromIndex + indexDiff));

      if (newIndex !== fromIndex && newIndex >= 0 && newIndex < filteredTodos.length) {
        const fromTodo = filteredTodos[fromIndex];
        const toTodo = filteredTodos[newIndex];

        if (fromTodo && toTodo && fromTodo.id !== toTodo.id) {
          const newTodos = [...todos];
          const fromTodoOrigIndex = newTodos.findIndex(t => t.id === fromTodo.id);
          const toTodoOrigIndex = newTodos.findIndex(t => t.id === toTodo.id);

          if (fromTodoOrigIndex >= 0 && toTodoOrigIndex >= 0) {
            // 从原位置移除
            const [removed] = newTodos.splice(fromTodoOrigIndex, 1);
            // 插入到目标位置
            newTodos.splice(toTodoOrigIndex, 0, removed);

            // 重新计算所有任务的 order 值
            newTodos.forEach((todo, i) => {
              todo.order = i;
            });

            setTodos(newTodos);
          }

          target.dataset.dragIndex = String(newIndex);
          setTouchDragState({ todoId: fromTodo.id, fromIndex: newIndex, offsetY: 0 });
          target.dataset.dragStartY = String(touch.clientY);
        }
      }
      return;
    }

    // 如果垂直移动明显，取消长按计时器（用户想滚动页面而非拖拽）
    if (Math.abs(diffY) > Math.abs(diffX) * 1.5 && Math.abs(diffY) > 10) {
      if (target.dataset.longPressTimer) {
        clearTimeout(Number(target.dataset.longPressTimer));
        delete target.dataset.longPressTimer;
      }
      return;
    }

    // 水平滑动 - 完成/删除
    if (Math.abs(diffX) > 10) {
      // 取消长按计时器
      if (target.dataset.longPressTimer) {
        clearTimeout(Number(target.dataset.longPressTimer));
        delete target.dataset.longPressTimer;
      }
      e.preventDefault();
    }

    // 限制滑动距离
    let offsetX = diffX;
    if (Math.abs(offsetX) > MAX_SWIPE) {
      offsetX = MAX_SWIPE * Math.sign(offsetX);
    }

    setSwipeState({
      todoId,
      offsetX,
      isComplete: offsetX < -SWIPE_THRESHOLD,
      isDelete: offsetX > SWIPE_THRESHOLD,
    });
  };

  const handleTouchEnd = (todoId: number) => {
    // 清除长按计时器
    const target = document.querySelector(`[data-long-press-timer]`) as HTMLElement;
    if (target?.dataset.longPressTimer) {
      clearTimeout(Number(target.dataset.longPressTimer));
      delete target.dataset.longPressTimer;
    }

    // 处理拖拽结束
    if (touchDragState.todoId === todoId) {
      if (navigator.vibrate) navigator.vibrate(50);
      setTodos(prev => [...prev]);
      setTouchDragState({ todoId: null, fromIndex: -1, offsetY: 0 });
      return;
    }

    // 处理滑动完成/删除
    if (swipeState.todoId === todoId) {
      if (swipeState.isComplete) {
        setTodos(todos.map(todo =>
          todo.id === todoId ? { ...todo, completed: true } : todo
        ));
      } else if (swipeState.isDelete) {
        setTodos(todos.filter(todo => todo.id !== todoId));
      }
      setSwipeState({ todoId: null, offsetX: 0, isComplete: false, isDelete: false });
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Personal</h1>
      </div>

      <DatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        hasTaskDates={todos.map(t => t.dueDate ?? t.createdAt)}
      />

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
          filteredTodos.map((todo, index) => {
            const isSwiping = swipeState.todoId === todo.id;
            const isDragging = touchDragState.todoId === todo.id;
            const swipeOffset = isSwiping ? swipeState.offsetX : 0;
            const dragOffset = isDragging ? touchDragState.offsetY : 0;

            return (
              <li
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${editingTodoId === todo.id ? 'editing' : ''} ${isSwiping ? 'swiping' : ''} ${isDragging ? 'dragging' : ''} ${draggedId !== null && draggedId !== todo.id ? 'drag-over' : ''}`}
                draggable={editingTodoId === null && !isSwiping && !todo.completed && !isDragging}
                onDragStart={(e) => editingTodoId === null && !isSwiping && !todo.completed && handleDragStart(e, todo.id)}
                onDragOver={(e) => editingTodoId === null && !isSwiping && !todo.completed && handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => {
                  if (editingTodoId === null && !todo.completed) {
                    handleTouchStart(e, todo.id, index, todo.completed);
                  }
                }}
                onTouchMove={(e) => {
                  if (editingTodoId === null && !todo.completed) {
                    handleTouchMove(e, todo.id);
                  }
                }}
                onTouchEnd={() => {
                  if (editingTodoId === null && !todo.completed) {
                    handleTouchEnd(todo.id);
                  }
                }}
                style={{
                  borderLeft: `4px solid ${getPriorityColor(todo.priority, index, filteredTodos.length)}`,
                  transform: swipeOffset !== 0
                    ? `translateX(${swipeOffset}px)`
                    : dragOffset !== 0
                      ? `translateY(${dragOffset}px) scale(1.02)`
                      : undefined,
                  transition: isSwiping || isDragging ? 'none' : 'transform 0.2s ease',
                  zIndex: swipeOffset !== 0 || dragOffset !== 0 ? 10 : undefined,
                  position: swipeOffset !== 0 || dragOffset !== 0 ? 'relative' : undefined,
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(todo);
                }}
              >
                {/* 滑动提示背景 */}
                {editingTodoId === null && !todo.completed && (
                  <>
                    <div className={`swipe-action swipe-delete ${swipeOffset > 20 ? 'visible' : ''}`}>
                      <span>删除</span>
                    </div>
                    <div className={`swipe-action swipe-complete ${swipeOffset < -20 ? 'visible' : ''}`}>
                      <span>完成</span>
                    </div>
                  </>
                )}
                {editingTodoId === todo.id ? (
                  <div className="edit-mode" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button className="edit-save-btn" onClick={() => saveEdit(todo.id)}>保存</button>
                      <button className="edit-cancel-btn" onClick={() => cancelEdit()}>取消</button>
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="todo-actions">
                      <button
                        className="menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === todo.id ? null : todo.id);
                        }}
                      >
                        <span></span>
                        <span></span>
                        <span></span>
                      </button>
                      {openMenuId === todo.id && (
                        <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="menu-item copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTodoToTomorrow(todo.id);
                            }}
                          >
                            复制到明天
                          </button>
                          <button
                            className="menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTodo(todo.id);
                              setOpenMenuId(null);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
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
