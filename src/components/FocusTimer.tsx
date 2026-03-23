import { useState, useEffect, useRef } from 'react';

interface FocusTimerProps {
  defaultMinutes?: number;
}

export const FocusTimer = ({ defaultMinutes = 25 }: FocusTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(defaultMinutes);
  const [isEditing, setIsEditing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // 计时结束提示
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('专注时间到！', {
          body: `完成了 ${customMinutes} 分钟的专注`,
          icon: '🎉',
        });
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, customMinutes]);

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customMinutes * 60);
  };

  const handleCustomTimeChange = (minutes: number) => {
    setCustomMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
    setIsEditing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((customMinutes * 60 - timeLeft) / (customMinutes * 60)) * 100;

  return (
    <div className="focus-timer">
      <div className="focus-timer-header">
        <span className="focus-timer-title">专注计时</span>
        {!isEditing && (
          <button
            className="edit-time-btn"
            onClick={() => setIsEditing(true)}
            title="设置时间"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="custom-time-editor">
          <div className="time-presets">
            {[15, 25, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                className={`time-preset-btn ${customMinutes === mins ? 'active' : ''}`}
                onClick={() => handleCustomTimeChange(mins)}
              >
                {mins}分钟
              </button>
            ))}
          </div>
          <div className="custom-time-input">
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
              onBlur={() => setTimeLeft(customMinutes * 60)}
              className="custom-minutes-input"
            />
            <span>分钟</span>
          </div>
          <button
            className="done-editing-btn"
            onClick={() => {
              setTimeLeft(customMinutes * 60);
              setIsEditing(false);
            }}
          >
            完成
          </button>
        </div>
      ) : (
        <>
          <div className="timer-display">
            <div className="timer-progress-ring">
              <svg className="progress-ring-svg" viewBox="0 0 120 120">
                <circle
                  className="progress-ring-background"
                  cx="60"
                  cy="60"
                  r="52"
                />
                <circle
                  className="progress-ring-circle"
                  cx="60"
                  cy="60"
                  r="52"
                  style={{
                    strokeDashoffset: 326.72 * (1 - progress / 100),
                  }}
                />
              </svg>
            </div>
            <div className="timer-time">{formatTime(timeLeft)}</div>
          </div>

          <div className="timer-controls">
            <button
              className={`timer-btn ${isRunning ? 'pause' : 'start'}`}
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  暂停
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  {timeLeft === customMinutes * 60 ? '开始' : '继续'}
                </>
              )}
            </button>
            <button
              className="timer-btn reset"
              onClick={resetTimer}
              disabled={timeLeft === customMinutes * 60}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              重置
            </button>
          </div>
        </>
      )}
    </div>
  );
};
