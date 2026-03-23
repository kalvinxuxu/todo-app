import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  icon: string;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟天气数据（实际项目中可以调用天气 API）
    // 这里使用模拟数据，因为需要 API key 才能获取真实天气
    const mockWeatherData: WeatherData = {
      temp: 22,
      condition: '多云',
      location: '本地',
      icon: 'cloudy',
    };

    // 模拟网络延迟
    const timer = setTimeout(() => {
      setWeather(mockWeatherData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        );
      case 'cloudy':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        );
      case 'rainy':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 13v8" />
            <path d="M8 13v8" />
            <path d="M12 15v8" />
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
          </svg>
        );
      case 'partly-cloudy':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
          </svg>
        );
    }
  };

  return (
    <div className="weather-widget">
      {loading ? (
        <div className="weather-loading">加载中...</div>
      ) : weather ? (
        <div className="weather-content">
          <div className="weather-icon">{getWeatherIcon(weather.icon)}</div>
          <div className="weather-info">
            <div className="weather-temp">{weather.temp}°C</div>
            <div className="weather-condition">{weather.condition}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
