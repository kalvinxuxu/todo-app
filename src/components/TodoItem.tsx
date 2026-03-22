import { memo } from 'react';
import { TagBadge } from './TagBadge';
import { AVAILABLE_TAGS } from '../utils/tagAnalyzer';
import { formatDisplayDate } from '../utils/dateUtils';

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

interface TodoItemProps {
  todo: Todo;
  isDragging: boolean;
  isSwiping: boolean;
  swipeOffset: number;
  dragOffset: number;
  editingTags: number | null;
  editingTodoId: number | null;
  editText: string;
  openMenuId: number | null;
  selectedTagFilter: string | null;
  draggedId: number | null;
  onToggle: () => void;
  onDelete: () => void;
  onUpdatePriority: (priority: 'very-necessary' | 'important' | 'Normal' | '一般') => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onTagClick: () => void;
  onMenuClick: () => void;
  onCopyToTomorrow: () => void;
  onStartEditing: () => void;
  onSaveEdit: (text: string) => void;
  onCancelEdit: () => void;
  onSetEditingTags: (id: number | null) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  getPriorityColor: () => string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TodoItem = memo(({
  todo,
  isDragging,
  isSwiping,
  swipeOffset,
  dragOffset,
  editingTags,
  editingTodoId,
  editText,
  openMenuId,
  selectedTagFilter,
  draggedId,
  onToggle,
  onDelete,
  onUpdatePriority,
  onAddTag,
  onRemoveTag,
  onTagClick,
  onMenuClick,
  onCopyToTomorrow,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onSetEditingTags,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDragStart,
  onDragOver,
  onDragEnd,
  getPriorityColor,
}: TodoItemProps) => {
  const priorityColor = getPriorityColor();

  const itemClasses = [
    'todo-item',
    todo.completed ? 'completed' : '',
    editingTodoId === todo.id ? 'editing' : '',
    isSwiping ? 'swiping' : '',
    isDragging ? 'dragging' : '',
    draggedId !== null && draggedId !== todo.id ? 'drag-over' : '',
  ].filter(Boolean).join(' ');

  const itemStyle: React.CSSProperties = {
    borderLeft: `4px solid ${priorityColor}`,
    transform: swipeOffset !== 0
      ? `translateX(${swipeOffset}px)`
      : dragOffset !== 0
        ? `translateY(${dragOffset}px) scale(1.02)`
        : undefined,
    transition: isSwiping || isDragging ? 'none' : 'transform 0.2s ease',
    zIndex: swipeOffset !== 0 || dragOffset !== 0 ? 10 : undefined,
    position: swipeOffset !== 0 || dragOffset !== 0 ? 'relative' : undefined,
  };

  return (
    <li
      key={todo.id}
      className={itemClasses}
      draggable={editingTodoId === null && !isSwiping && !todo.completed && !isDragging}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={itemStyle}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEditing();
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
            onChange={(e) => onSaveEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit(editText);
              if (e.key === 'Escape') onCancelEdit();
            }}
            autoFocus
          />
          <div className="edit-actions">
            <button className="edit-save-btn" onClick={() => onSaveEdit(editText)}>保存</button>
            <button className="edit-cancel-btn" onClick={onCancelEdit}>取消</button>
          </div>
        </div>
      ) : (
        <>
          <div className="checkbox" onClick={onToggle}></div>
          <div className="todo-content">
            <span className="todo-text">{todo.text}</span>
            <div className="todo-meta">
              <span className="todo-date">{formatDisplayDate(todo.dueDate ?? todo.createdAt)}</span>
              <select
                className="priority-select"
                value={todo.priority}
                onChange={(e) => onUpdatePriority(e.target.value as 'very-necessary' | 'important' | 'Normal' | '一般')}
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
                  onRemove={() => onRemoveTag(tag)}
                  active={selectedTagFilter === tag}
                  onClick={onTagClick}
                />
              ))}
              {editingTags === todo.id ? (
                <div className="tag-input-container">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onAddTag(e.target.value);
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
                    onClick={() => onSetEditingTags(null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  className="add-tag-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetEditingTags(todo.id);
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
                onMenuClick();
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
                    onCopyToTomorrow();
                  }}
                >
                  复制到明天
                </button>
                <button
                  className="menu-item delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
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
});

TodoItem.displayName = 'TodoItem';
