// 预定义标签关键词规则
export const TAG_KEYWORDS: Record<string, string[]> = {
  'AI Skills': ['ai', '人工智能', '大模型', '机器学习', '深度学习', 'llm', 'prompt', 'agent', '模型'],
  '家庭任务': ['家庭', '家人', '家务', '购物', '买菜', '做饭', '孩子', '父母', '小孩', '老人'],
  '个人提升': ['学习', '阅读', '课程', '技能', '提升', '证书', '考试', '练习', '培训'],
  '工作': ['工作', '会议', '项目', '报告', '邮件', '客户', 'deadline', '截止', '文档', '演示'],
  '健康': ['运动', '健身', '跑步', '体检', '医院', '饮食', '睡眠', '锻炼', '瑜伽', '减肥'],
  '财务': ['财务', '预算', '投资', '理财', '账单', '付款', '收款', '转账', '储蓄', '股票'],
};

// 所有可用标签
export const AVAILABLE_TAGS = Object.keys(TAG_KEYWORDS);

/**
 * 基于关键词规则自动识别标签
 * @param text 任务文本
 * @returns 匹配的标签数组
 */
export function analyzeTags(text: string): string[] {
  const matchedTags: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerText.includes(lowerKeyword)) {
        if (!matchedTags.includes(tag)) {
          matchedTags.push(tag);
        }
        break;
      }
    }
  }

  return matchedTags;
}

/**
 * 获取标签颜色
 * @param tag 标签名称
 * @returns 十六进制颜色代码
 */
export function getTagColor(tag: string): string {
  const colorMap: Record<string, string> = {
    'AI Skills': '#8b5cf6',    // 紫色
    '家庭任务': '#f97316',    // 橙色
    '个人提升': '#06b6d4',    // 青色
    '工作': '#3b82f6',        // 蓝色
    '健康': '#22c55e',        // 绿色
    '财务': '#eab308',        // 黄色
  };
  return colorMap[tag] || '#9ca3af'; // 默认灰色
}
