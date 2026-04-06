import type { Project, ExpenseCategory, ParsedEntry } from '@/types';

const INCOME_KEYWORDS = ['收入', '收款', '到账', '进账', '学费', '回款', '报名', '付款'];
const EXPENSE_KEYWORDS = ['买', '报销', '打印', '物料', '充值', '打车', '酒店', '机票', '红包', '支出', '花了', '付了', '缴', '租'];

// Category keyword mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'DOU+投流': ['dou+', 'dou +', '投流', '推广'],
  '抖币充值': ['抖币'],
  '群红包': ['红包'],
  '场地费用': ['场地', '会议室', '酒店'],
  '物料费用': ['物料', '打印', '印刷', '耗材'],
  '差旅费用': ['打车', '机票', '高铁', '火车', '差旅', '住宿', '酒店'],
  '其他工资': ['工资', '薪资', '劳务'],
  '软件工具充值': ['充值', 'poe', 'chatgpt', 'notion', '订阅', '软件', '工具'],
  '学习资料/内容采购': ['书', '课程', '学习', '资料', '内容'],
  '新设备引入': ['设备', '电脑', '手机', '相机', '麦克风', '摄像'],
  '退款/售后支出': ['退款', '售后', '退'],
};

function matchCategory(text: string, categories: ExpenseCategory[]): string | undefined {
  const lower = text.toLowerCase();
  // First try matching against known keyword map
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      // Check if this category exists in the user's list
      const found = categories.find((c) => c.name === catName);
      if (found) return found.name;
    }
  }
  // Then try direct match against category names
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) return cat.name;
  }
  // Default to 其他支出
  return categories.find((c) => c.name === '其他支出')?.name;
}

function extractAmount(text: string): number | undefined {
  const match = text.match(/[¥￥]?(\d+(?:\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  return undefined;
}

function detectDirection(text: string): 'income' | 'expense' | null {
  const lower = text.toLowerCase();
  if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) return 'income';
  if (EXPENSE_KEYWORDS.some((kw) => lower.includes(kw))) return 'expense';
  return null;
}

function matchProject(text: string, projects: Project[]): Project | undefined {
  // Sort by name length desc to match longer names first
  const sorted = [...projects].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((p) => text.includes(p.name));
}

export function parseEntry(
  input: string,
  projects: Project[],
  categories: ExpenseCategory[]
): ParsedEntry {
  const today = new Date().toISOString().split('T')[0];
  const project = matchProject(input, projects);
  const amount = extractAmount(input);
  const direction = detectDirection(input) ?? 'income'; // default to income

  if (direction === 'expense') {
    const expenseCategory = matchCategory(input, categories);
    // Extract note: remove project name, amount, and known keywords
    let note = input;
    if (project) note = note.replace(project.name, '');
    note = note.replace(/[¥￥]?\d+(?:\.\d+)?/, '').trim();
    EXPENSE_KEYWORDS.forEach((kw) => { note = note.replace(kw, ''); });
    note = note.trim();

    return {
      projectId: project?.id,
      date: today,
      type: 'expense',
      amount,
      expenseCategory,
      expenseNote: note || undefined,
    };
  } else {
    let note = input;
    if (project) note = note.replace(project.name, '');
    note = note.replace(/[¥￥]?\d+(?:\.\d+)?/, '').trim();
    INCOME_KEYWORDS.forEach((kw) => { note = note.replace(kw, ''); });
    note = note.trim();

    return {
      projectId: project?.id,
      date: today,
      type: 'income',
      amount,
      incomeNote: note || undefined,
    };
  }
}
