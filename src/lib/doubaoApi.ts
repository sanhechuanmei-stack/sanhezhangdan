import type { Project, ExpenseCategory, ParsedEntry } from '@/types';

const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ARK_MODEL = 'doubao-1-5-lite-32k-250115';

export async function parseEntryWithAI(
  input: string,
  projects: Project[],
  categories: ExpenseCategory[],
  apiKey: string
): Promise<ParsedEntry> {
  const today = new Date().toISOString().split('T')[0];
  const projectList = projects.map((p) => p.name).join('、');
  const categoryList = categories.map((c) => c.name).join('、');

  const systemPrompt = `记账助手，从输入提取信息，只返回JSON：{"type":"income/expense","amount":数字或null,"projectName":"业务名或null","expenseCategory":"分类或null","note":"备注或null","date":"${today}"}
业务：${projectList}
分类：${categoryList}
收入关键词：收入收款到账学费报名付款。支出关键词：买支出花了充值报销打车红包。默认income。`;

  const response = await fetch(ARK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ARK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`豆包 API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  // 提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 返回格式异常');

  const parsed = JSON.parse(jsonMatch[0]);
  const project = projects.find((p) => p.name === parsed.projectName);

  return {
    projectId: project?.id,
    date: parsed.date ?? today,
    type: parsed.type === 'expense' ? 'expense' : 'income',
    amount: parsed.amount ?? undefined,
    expenseCategory: parsed.expenseCategory ?? undefined,
    incomeNote: parsed.type !== 'expense' ? (parsed.note ?? undefined) : undefined,
    expenseNote: parsed.type === 'expense' ? (parsed.note ?? undefined) : undefined,
  };
}
