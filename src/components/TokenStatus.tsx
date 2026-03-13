import { useState, useEffect } from 'react';

interface ContextData {
  used_pct: number;
  remaining_percentage: number;
  timestamp: number;
}

export function TokenStatus() {
  const [context, setContext] = useState<ContextData | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        // Read from Claude Code's bridge file in tmp directory
        const response = await fetch('/claude-ctx.json');
        if (response.ok) {
          const data = await response.json();
          setContext(data);
        }
      } catch {
        // 静默失败
      }
    };

    fetchContext();
    const interval = setInterval(fetchContext, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!context) return null;

  // 根据使用率显示不同颜色
  const getColor = (pct: number) => {
    if (pct < 50) return '#4ade80'; // green
    if (pct < 65) return '#facc15'; // yellow
    if (pct < 80) return '#fb923c'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="token-status" style={{ color: getColor(context.used_pct) }}>
      Context: {context.used_pct}%
    </div>
  );
}