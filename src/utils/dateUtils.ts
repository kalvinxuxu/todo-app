/**
 * 将时间戳转换为日期字符串 (YYYY-MM-DD)
 */
export function formatDateForInput(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 将日期字符串转换为时间戳 (当天零点)
 */
export function parseDateInput(dateString: string): number {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * 获取某天的开始时间戳
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * 获取某天的结束时间戳
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * 格式化日期显示 (MM-DD)
 */
export function formatDisplayDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * 判断是否是今天
 */
export function isToday(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return today.getTime() === date.getTime();
}

/**
 * 判断是否是昨天
 */
export function isYesterday(timestamp: number): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return yesterday.getTime() === date.getTime();
}

/**
 * 获取友好的日期描述
 */
export function getFriendlyDateLabel(timestamp: number): string {
  if (isToday(timestamp)) {
    return '今天';
  }
  if (isYesterday(timestamp)) {
    return '昨天';
  }
  return formatDisplayDate(timestamp);
}
