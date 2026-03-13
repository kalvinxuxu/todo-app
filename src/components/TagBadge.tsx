import { getTagColor } from '../utils/tagAnalyzer';

interface TagBadgeProps {
  tag: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  active?: boolean;
}

export function TagBadge({ tag, onClick, removable, onRemove, active }: TagBadgeProps) {
  return (
    <span
      className={`tag-badge ${active ? 'active' : ''}`}
      style={{ backgroundColor: getTagColor(tag) }}
      onClick={onClick}
    >
      {tag}
      {removable && onRemove && (
        <button
          className="tag-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
