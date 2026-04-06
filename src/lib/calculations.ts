import type {
  Partner,
  Project,
  BillRecord,
  SharingRecord,
  ProjectFinancials,
  PartnerProjectSummary,
  PartnerTotalSummary,
  YearEndBonusData,
} from '@/types';

export function calcProjectFinancials(
  project: Project,
  bills: BillRecord[],
  partners?: Partner[]
): ProjectFinancials {
  const projectBills = bills.filter((b) => b.projectId === project.id);
  const totalIncome = projectBills.reduce((sum, b) => sum + (b.income ?? 0), 0);
  const totalExpense = projectBills.reduce((sum, b) => sum + (b.expense ?? 0), 0);
  const grossProfit = totalIncome - totalExpense;

  let priorityAmount = 0;
  if (project.prioritySharing) {
    priorityAmount = Math.max(0, grossProfit) * (project.prioritySharing.percentage / 100);
  }

  const base = Math.max(0, grossProfit - priorityAmount);

  // 只有主合伙人参与年终彩蛋，计算主合伙人占比之和
  let mainPartnerRatioSum = 0;
  if (partners) {
    for (const pid of project.partnerIds) {
      const p = partners.find((x) => x.id === pid);
      if (p?.type === 'main') {
        mainPartnerRatioSum += project.sharingRatios[pid] ?? 0;
      }
    }
  } else {
    mainPartnerRatioSum = 100;
  }

  // 计算不参与彩蛋的期次利润（这部分 100% 可分，不留存）
  const excludedPeriods = new Set(project.excludedPeriods ?? []);
  let excludedBase = 0;
  if (excludedPeriods.size > 0) {
    const excludedBills = projectBills.filter((b) => b.period && excludedPeriods.has(b.period));
    const excludedIncome = excludedBills.reduce((sum, b) => sum + (b.income ?? 0), 0);
    const excludedExpense = excludedBills.reduce((sum, b) => sum + (b.expense ?? 0), 0);
    const excludedProfit = excludedIncome - excludedExpense;
    // 优先分成按比例扣除
    const excludedPriority = project.prioritySharing
      ? Math.max(0, excludedProfit) * (project.prioritySharing.percentage / 100)
      : 0;
    excludedBase = Math.max(0, excludedProfit - excludedPriority);
  }

  // 参与彩蛋的部分 base
  const eligibleBase = Math.max(0, base - excludedBase);

  // 年终留存只从参与彩蛋的部分扣
  const yearEndRetained = eligibleBase * (mainPartnerRatioSum / 100) * 0.15;
  // 可即时分配 = 参与彩蛋部分的85% + 不参与彩蛋部分的100%
  const instantShareable = eligibleBase - yearEndRetained + excludedBase;

  return {
    projectId: project.id,
    totalIncome,
    totalExpense,
    grossProfit,
    priorityAmount,
    instantShareable,
    yearEndRetained,
  };
}

export function calcPartnerExpectedShare(
  project: Project,
  financials: ProjectFinancials,
  partnerId: string,
  partners?: Partner[]
): number {
  const ratio = project.sharingRatios[partnerId] ?? 0;
  const base = Math.max(0, financials.grossProfit - financials.priorityAmount);
  const isSpecial = partners?.find((p) => p.id === partnerId)?.type === 'special';

  let fromRatio: number;
  if (isSpecial) {
    // 特殊合伙人：直接按 base 的比例，100% 即时可分
    fromRatio = base * (ratio / 100);
  } else {
    // 主合伙人：从 instantShareable 中按比例分配
    // instantShareable 已经正确处理了排除期次（100%）和参与彩蛋期次（85%）
    // 需要算出主合伙人占比之和，再按个人比例分配
    const mainRatioSum = project.partnerIds.reduce((sum, pid) => {
      const p = partners?.find((x) => x.id === pid);
      const isMain = p ? p.type === 'main' : true;
      return isMain ? sum + (project.sharingRatios[pid] ?? 0) : sum;
    }, 0);
    const shareableForMain = mainRatioSum > 0
      ? financials.instantShareable * (mainRatioSum / 100)
      : financials.instantShareable;
    fromRatio = mainRatioSum > 0 ? shareableForMain * (ratio / mainRatioSum) : 0;
  }

  // Priority partner also gets their priority amount
  if (project.prioritySharing?.partnerId === partnerId) {
    return fromRatio + financials.priorityAmount;
  }
  return fromRatio;
}

export function calcPartnerPaid(
  sharingRecords: SharingRecord[],
  projectId: string,
  partnerId: string,
  period?: string
): number {
  return sharingRecords
    .filter((r) => !r.isYearEnd && r.projectId === projectId && r.partnerId === partnerId && (period ? r.period === period : true))
    .reduce((sum, r) => sum + r.amount, 0);
}

export function calcPartnerProjectSummary(
  project: Project,
  financials: ProjectFinancials,
  sharingRecords: SharingRecord[],
  partnerId: string,
  partners?: Partner[]
): PartnerProjectSummary {
  const expected = calcPartnerExpectedShare(project, financials, partnerId, partners);
  const paid = calcPartnerPaid(sharingRecords, project.id, partnerId);
  return { projectId: project.id, expected, paid, unpaid: expected - paid };
}

export function calcPartnerTotalSummary(
  partner: Partner,
  projects: Project[],
  bills: BillRecord[],
  sharingRecords: SharingRecord[],
  partners?: Partner[]
): PartnerTotalSummary {
  const byProject: PartnerProjectSummary[] = [];

  for (const project of projects) {
    if (!project.partnerIds.includes(partner.id)) continue;
    const financials = calcProjectFinancials(project, bills, partners);
    const summary = calcPartnerProjectSummary(project, financials, sharingRecords, partner.id, partners);
    byProject.push(summary);
  }

  // Also check if partner is a priority partner in any project
  for (const project of projects) {
    if (project.prioritySharing?.partnerId === partner.id && !project.partnerIds.includes(partner.id)) {
      const financials = calcProjectFinancials(project, bills, partners);
      const expected = financials.priorityAmount;
      const paid = calcPartnerPaid(sharingRecords, project.id, partner.id);
      byProject.push({ projectId: project.id, expected, paid, unpaid: expected - paid });
    }
  }

  const expected = byProject.reduce((s, p) => s + p.expected, 0);
  const paid = byProject.reduce((s, p) => s + p.paid, 0);
  return { partnerId: partner.id, expected, paid, unpaid: expected - paid, byProject };
}

export function calcYearEndBonus(
  projects: Project[],
  bills: BillRecord[],
  partners: Partner[],
  sharingRecords: SharingRecord[]
): YearEndBonusData {
  let total = 0;
  const byProject: { projectId: string; amount: number }[] = [];
  const partnerProjectMap: Record<string, Record<string, number>> = {};

  for (const project of projects) {
    const financials = calcProjectFinancials(project, bills, partners);
    const retained = financials.yearEndRetained;
    total += retained;
    byProject.push({ projectId: project.id, amount: retained });

    // 只有主合伙人参与年终彩蛋分成
    for (const partnerId of project.partnerIds) {
      const partner = partners.find((p) => p.id === partnerId);
      if (partner?.type !== 'main') continue; // 特殊合伙人跳过

      const ratio = project.sharingRatios[partnerId] ?? 0;
      // 主合伙人在该项目的年终彩蛋份额 = retained × (该主合伙人比例 / 所有主合伙人比例之和)
      const mainRatioSum = project.partnerIds.reduce((sum, pid) => {
        const p = partners.find((x) => x.id === pid);
        return p?.type === 'main' ? sum + (project.sharingRatios[pid] ?? 0) : sum;
      }, 0);
      const share = mainRatioSum > 0 ? retained * (ratio / mainRatioSum) : 0;
      if (!partnerProjectMap[partnerId]) partnerProjectMap[partnerId] = {};
      partnerProjectMap[partnerId][project.id] = (partnerProjectMap[partnerId][project.id] ?? 0) + share;
    }
  }

  const yearEndRecords = sharingRecords.filter((r) => r.isYearEnd);

  // 只展示主合伙人
  const byPartner = partners
    .filter((p) => p.type === 'main' && partnerProjectMap[p.id] !== undefined)
    .map((p) => {
      const projectEntries = partnerProjectMap[p.id];
      const amount = Object.values(projectEntries).reduce((s, v) => s + v, 0);
      const paid = yearEndRecords
        .filter((r) => r.partnerId === p.id)
        .reduce((s, r) => s + r.amount, 0);
      return {
        partnerId: p.id,
        amount,
        paid,
        unpaid: amount - paid,
        byProject: Object.entries(projectEntries).map(([projectId, amt]) => ({ projectId, amount: amt })),
      };
    });

  return { total, byPartner, byProject };
}

// Utility: get current month's income for a specific project
export function calcMonthlyProjectIncome(
  projectId: string,
  bills: BillRecord[],
  year: number,
  month: number // 1-12
): number {
  return bills
    .filter((b) => {
      if (b.projectId !== projectId) return false;
      const d = new Date(b.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .reduce((sum, b) => sum + (b.income ?? 0), 0);
}

// Utility: get income for the most recent period of offline-course project
export function calcCurrentPeriodIncome(
  projectId: string,
  bills: BillRecord[],
  period?: string
): number {
  const projectBills = bills.filter((b) => b.projectId === projectId && b.period);
  if (projectBills.length === 0) return 0;

  // Use provided period, or fall back to most recent
  const targetPeriod = period ?? [...projectBills].sort((a, b) => b.date.localeCompare(a.date))[0].period;

  return bills
    .filter((b) => b.projectId === projectId && b.period === targetPeriod)
    .reduce((sum, b) => sum + (b.income ?? 0), 0);
}

// Utility: get net profit (income - expense) for a specific period
export function calcCurrentPeriodProfit(
  projectId: string,
  bills: BillRecord[],
  period?: string
): number {
  const projectBills = bills.filter((b) => b.projectId === projectId && b.period);
  if (projectBills.length === 0) return 0;

  const targetPeriod = period ?? [...projectBills].sort((a, b) => b.date.localeCompare(a.date))[0].period;

  const periodBills = bills.filter((b) => b.projectId === projectId && b.period === targetPeriod);
  const income = periodBills.reduce((sum, b) => sum + (b.income ?? 0), 0);
  const expense = periodBills.reduce((sum, b) => sum + (b.expense ?? 0), 0);
  return income - expense;
}

// Utility: get all available periods for a project, sorted newest first
export function getProjectPeriods(projectId: string, bills: BillRecord[]): string[] {
  const periods = [...new Set(
    bills.filter((b) => b.projectId === projectId && b.period).map((b) => b.period!)
  )];
  // Sort by the latest bill date within each period
  return periods.sort((a, b) => {
    const latestA = bills.filter((x) => x.projectId === projectId && x.period === a)
      .map((x) => x.date).sort().at(-1) ?? '';
    const latestB = bills.filter((x) => x.projectId === projectId && x.period === b)
      .map((x) => x.date).sort().at(-1) ?? '';
    return latestB.localeCompare(latestA);
  });
}

// Utility: calc project financials filtered to a specific period
export function calcProjectFinancialsByPeriod(
  project: Project,
  bills: BillRecord[],
  period: string,
  partners?: Partner[]
): ProjectFinancials {
  const periodBills = bills.filter((b) => b.projectId === project.id && b.period === period);
  const allOtherBills = bills.filter((b) => b.projectId === project.id && !b.period);
  const filteredBills = [...periodBills, ...allOtherBills];
  return calcProjectFinancials(project, filteredBills, partners);
}

// Utility: total balance = all income - all expense - all sharing paid out
export function calcTotalBalance(
  bills: BillRecord[],
  sharingRecords: SharingRecord[]
): number {
  const totalIncome = bills.reduce((s, b) => s + (b.income ?? 0), 0);
  const totalExpense = bills.reduce((s, b) => s + (b.expense ?? 0), 0);
  const totalPaid = sharingRecords.reduce((s, r) => s + r.amount, 0);
  return totalIncome - totalExpense - totalPaid;
}

// Utility: monthly data for annual stats chart
export function calcMonthlyData(bills: BillRecord[], year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthBills = bills.filter((b) => {
      const d = new Date(b.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const income = monthBills.reduce((s, b) => s + (b.income ?? 0), 0);
    const expense = monthBills.reduce((s, b) => s + (b.expense ?? 0), 0);
    return { month: `${month}月`, income, expense, profit: income - expense };
  });
}
