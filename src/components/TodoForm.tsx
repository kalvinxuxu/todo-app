import { memo, type KeyboardEvent, type ChangeEvent } from 'react';

interface TodoFormProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
}

export const TodoForm = memo(({ inputValue, onInputChange, onAdd }: TodoFormProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onAdd();
  };

  return (
    <div className="input-group">
      <input
        type="text"
        id="todo-input"
        placeholder="Write a task..."
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button id="add-btn" onClick={onAdd}>Add</button>
    </div>
  );
});

TodoForm.displayName = 'TodoForm';
