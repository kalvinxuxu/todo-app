import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';

interface Todo {
  id: number;
  completed: boolean;
  order: number;
  priority: 'very-necessary' | 'important' | 'Normal' | '一般';
  text: string;
  createdAt: number;
  dueDate?: number;
  tags: string[];
}

interface SwipeState {
  todoId: number | null;
  offsetX: number;
  isComplete: boolean;
  isDelete: boolean;
}

interface TouchDragState {
  todoId: number | null;
  fromIndex: number;
  offsetY: number;
}

interface UseSwipeAndDragOptions {
  filteredTodos: Todo[];
  editingTodoId: number | null;
  onTodosChange: Dispatch<SetStateAction<Todo[]>>;
}

export function useSwipeAndDrag({
  filteredTodos,
  editingTodoId,
  onTodosChange,
}: UseSwipeAndDragOptions) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    todoId: null,
    offsetX: 0,
    isComplete: false,
    isDelete: false,
  });
  const [touchDragState, setTouchDragState] = useState<TouchDragState>({
    todoId: null,
    fromIndex: -1,
    offsetY: 0,
  });

  const longPressTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const SWIPE_THRESHOLD = 100;
  const MAX_SWIPE = 140;
  const LONG_PRESS_DURATION = 400;

  const clearLongPressTimer = useCallback((todoId: number) => {
    const timer = longPressTimers.current.get(todoId);
    if (timer) {
      clearTimeout(timer);
      longPressTimers.current.delete(todoId);
    }
  }, []);

  // Desktop drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', String(id));
    const dragImage = document.createElement('div');
    dragImage.style.width = '200px';
    dragImage.style.height = '60px';
    dragImage.style.background = '#f3efee';
    dragImage.style.borderRadius = '12px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedId === null) return;

    const draggedIndex = filteredTodos.findIndex(t => t.id === draggedId);
    if (draggedIndex === index || draggedIndex < 0) return;

    onTodosChange((prev: Todo[]) => {
      const newTodos = [...prev];
      const draggedTodo = filteredTodos[draggedIndex];
      const targetTodo = filteredTodos[index];

      if (draggedTodo && targetTodo) {
        const draggedTodoOrigIndex = newTodos.findIndex(t => t.id === draggedTodo.id);
        const targetTodoOrigIndex = newTodos.findIndex(t => t.id === targetTodo.id);

        if (draggedTodoOrigIndex >= 0 && targetTodoOrigIndex >= 0) {
          const [removed] = newTodos.splice(draggedTodoOrigIndex, 1);
          newTodos.splice(targetTodoOrigIndex, 0, removed);
          newTodos.forEach((todo, i) => { todo.order = i; });
          return newTodos;
        }
      }
      return prev;
    });
  }, [draggedId, filteredTodos, onTodosChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedId(null);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, todoId: number, index: number, isCompleted: boolean) => {
    if (editingTodoId !== null || swipeState.todoId !== null || touchDragState.todoId !== null) return;

    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    target.dataset.startX = String(touch.clientX);
    target.dataset.startY = String(touch.clientY);
    target.dataset.dragIndex = String(index);

    clearLongPressTimer(todoId);

    const timerId = setTimeout(() => {
      if (!swipeState.todoId && !isCompleted) {
        setTouchDragState({ todoId, fromIndex: index, offsetY: 0 });
        target.dataset.dragStartY = String(touch.clientY);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);

    longPressTimers.current.set(todoId, timerId);
  }, [editingTodoId, swipeState.todoId, touchDragState.todoId, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent, todoId: number) => {
    if (editingTodoId !== null) return;

    const target = e.currentTarget as HTMLElement;
    const startX = parseFloat(target.dataset.startX || '0');
    const startY = parseFloat(target.dataset.startY || '0');
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Drag mode (long press triggered)
    if (touchDragState.todoId === todoId) {
      clearLongPressTimer(todoId);
      setTouchDragState(prev => ({ ...prev, offsetY: diffY }));

      const itemHeight = 80;
      const fromIndex = parseInt(target.dataset.dragIndex || '0');
      const indexDiff = Math.round(diffY / itemHeight);
      const newIndex = Math.max(0, Math.min(filteredTodos.length - 1, fromIndex + indexDiff));

      if (newIndex !== fromIndex && newIndex >= 0 && newIndex < filteredTodos.length) {
        const fromTodo = filteredTodos[fromIndex];
        const toTodo = filteredTodos[newIndex];

        if (fromTodo && toTodo && fromTodo.id !== toTodo.id) {
          onTodosChange((prev: Todo[]) => {
            const newTodos = [...prev];
            const fromTodoOrigIndex = newTodos.findIndex(t => t.id === fromTodo.id);
            const toTodoOrigIndex = newTodos.findIndex(t => t.id === toTodo.id);

            if (fromTodoOrigIndex >= 0 && toTodoOrigIndex >= 0) {
              const [removed] = newTodos.splice(fromTodoOrigIndex, 1);
              newTodos.splice(toTodoOrigIndex, 0, removed);
              newTodos.forEach((todo, i) => { todo.order = i; });
              return newTodos;
            }
            return prev;
          });

          target.dataset.dragIndex = String(newIndex);
          setTouchDragState(prev => ({ todoId: prev.todoId, fromIndex: newIndex, offsetY: 0 }));
          target.dataset.dragStartY = String(touch.clientY);
        }
      }
      return;
    }

    // Cancel long press if vertical scroll detected
    if (Math.abs(diffY) > Math.abs(diffX) * 1.5 && Math.abs(diffY) > 10) {
      clearLongPressTimer(todoId);
      return;
    }

    // Horizontal swipe
    if (Math.abs(diffX) > 10) {
      clearLongPressTimer(todoId);
      e.preventDefault();
    }

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
  }, [editingTodoId, touchDragState.todoId, filteredTodos.length, onTodosChange, clearLongPressTimer, SWIPE_THRESHOLD, MAX_SWIPE]);

  const handleTouchEnd = useCallback((todoId: number, onComplete: () => void, onDelete: () => void) => {
    clearLongPressTimer(todoId);

    if (touchDragState.todoId === todoId) {
      if (navigator.vibrate) navigator.vibrate(50);
      setTouchDragState({ todoId: null, fromIndex: -1, offsetY: 0 });
      return;
    }

    if (swipeState.todoId === todoId) {
      if (swipeState.isComplete) {
        onComplete();
      } else if (swipeState.isDelete) {
        onDelete();
      }
      setSwipeState({ todoId: null, offsetX: 0, isComplete: false, isDelete: false });
    }
  }, [touchDragState.todoId, swipeState.todoId, swipeState.isComplete, swipeState.isDelete, clearLongPressTimer]);

  const resetSwipeState = useCallback(() => {
    setSwipeState({ todoId: null, offsetX: 0, isComplete: false, isDelete: false });
  }, []);

  return {
    draggedId,
    swipeState,
    touchDragState,
    setDraggedId,
    setSwipeState,
    setTouchDragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetSwipeState,
  };
}
