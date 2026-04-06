import { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import {
  calcProjectFinancials,
  calcPartnerTotalSummary,
  calcYearEndBonus,
  calcTotalBalance,
  calcMonthlyProjectIncome,
} from '@/lib/calculations';

export function useCalculations() {
  const { state } = useAppData();
  const { partners, projects, bills, sharingRecords } = state;

  const projectFinancials = useMemo(
    () => projects.map((p) => calcProjectFinancials(p, bills, partners)),
    [projects, bills, partners]
  );

  const partnerSummaries = useMemo(
    () => partners.map((p) => calcPartnerTotalSummary(p, projects, bills, sharingRecords, partners)),
    [partners, projects, bills, sharingRecords]
  );

  const yearEndBonus = useMemo(
    () => calcYearEndBonus(projects, bills, partners, sharingRecords),
    [projects, bills, partners, sharingRecords]
  );

  const totalBalance = useMemo(
    () => calcTotalBalance(bills, sharingRecords),
    [bills, sharingRecords]
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthlyTotalIncome = useMemo(
    () => bills
      .filter((b) => {
        const d = new Date(b.date);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
      })
      .reduce((s, b) => s + (b.income ?? 0), 0),
    [bills, currentYear, currentMonth]
  );

  // 本月研习社收入
  const monthlyYanxisheIncome = useMemo(() => {
    const yanxishe = projects.find((p) => p.name === '研习社');
    if (!yanxishe) return 0;
    return calcMonthlyProjectIncome(yanxishe.id, bills, currentYear, currentMonth);
  }, [projects, bills, currentYear, currentMonth]);

  return {
    projectFinancials,
    partnerSummaries,
    yearEndBonus,
    totalBalance,
    monthlyTotalIncome,
    monthlyYanxisheIncome,
  };
}
