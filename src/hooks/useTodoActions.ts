import { useCallback } from 'react';
import { analyzeTags } from '../utils/tagAnalyzer';

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

interface UseTodoActionsOptions {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  inputValue: string;
  setInputValue: (value: string) => void;
  selectedDateTimestamp: number;
  selectedDate: string;
  setOpenMenuId: (id: number | null) => void;
  setEditingTodoId: (id: number | null) => void;
  setEditText: (text: string) => void;
}

export function useTodoActions({
  todos,
  setTodos,
  inputValue,
  setInputValue,
  selectedDateTimestamp,
  selectedDate,
  setOpenMenuId,
  setEditingTodoId,
  setEditText,
}: UseTodoActionsOptions) {
  const addTodo = useCallback(() => {
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

    setTodos(prev => [...prev, newTodo]);
    setInputValue('');
  }, [inputValue, selectedDateTimestamp, todos.length, setTodos, setInputValue]);

  const toggleTodo = useCallback((id: number) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, [setTodos]);

  const deleteTodo = useCallback((id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, [setTodos]);

  const updatePriority = useCallback((id: number, priority: 'very-necessary' | 'important' | 'Normal' | '一般') => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, priority } : todo
    ));
  }, [setTodos]);

  const addTag = useCallback((todoId: number, tag: string) => {
    if (!tag.trim()) return;
    setTodos(prev => prev.map(todo =>
      todo.id === todoId && !todo.tags.includes(tag)
        ? { ...todo, tags: [...todo.tags, tag] }
        : todo
    ));
  }, [setTodos]);

  const removeTag = useCallback((todoId: number, tag: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === todoId
        ? { ...todo, tags: todo.tags.filter(t => t !== tag) }
        : todo
    ));
  }, [setTodos]);

  const copyTodoToTomorrow = useCallback((todoId: number) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const newTodo: Todo = {
      ...todo,
      id: Date.now(),
      dueDate: tomorrow.getTime(),
      completed: false,
      order: todos.length,
    };

    setTodos(prev => [...prev, newTodo]);
    setOpenMenuId(null);
  }, [todos, selectedDate, setTodos, setOpenMenuId]);

  // 复制任务到指定日期
  const copyTodoToDate = useCallback((dateStr: string, todoId: number) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const newTodo: Todo = {
      ...todo,
      id: Date.now(),
      dueDate: targetDate.getTime(),
      completed: false,
      order: todos.length,
    };

    setTodos(prev => [...prev, newTodo]);
  }, [todos, setTodos]);

  const startEditing = useCallback((todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditText(todo.text);
  }, [setEditingTodoId, setEditText]);

  const saveEdit = useCallback((id: number, editText: string) => {
    if (!editText.trim()) return;
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ));
    setEditingTodoId(null);
  }, [setTodos, setEditingTodoId]);

  const cancelEdit = useCallback(() => {
    setEditingTodoId(null);
  }, [setEditingTodoId]);

  return {
    addTodo,
    toggleTodo,
    deleteTodo,
    updatePriority,
    addTag,
    removeTag,
    copyTodoToTomorrow,
    copyTodoToDate,
    startEditing,
    saveEdit,
    cancelEdit,
  };
}
