import { useState, useEffect, memo } from 'react';

interface ContextData {
  used_pct: number;
  remaining_percentage: number;
  timestamp: number;
}

export const TokenStatus = memo(() => {
  const [context, setContext] = useState<ContextData | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
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

  const getColor = (pct: number) => {
    if (pct < 50) return '#4ade80';
    if (pct < 65) return '#facc15';
    if (pct < 80) return '#fb923c';
    return '#ef4444';
  };

  return (
    <div className="token-status" style={{ color: getColor(context.used_pct) }}>
      Context: {context.used_pct}%
    </div>
  );
});

TokenStatus.displayName = 'TokenStatus';