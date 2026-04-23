import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import type { Partner, Project, BillRecord, SharingRecord, ExpenseCategory } from '@/types';
import { getSeedData } from '@/lib/seedData';
import { supabase } from '@/lib/supabase';

export interface AppState {
  partners: Partner[];
  projects: Project[];
  bills: BillRecord[];
  sharingRecords: SharingRecord[];
  expenseCategories: ExpenseCategory[];
}

type AppAction =
  | { type: 'ADD_PARTNER'; payload: Partner }
  | { type: 'UPDATE_PARTNER'; payload: Partner }
  | { type: 'DELETE_PARTNER'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_BILL'; payload: BillRecord }
  | { type: 'UPDATE_BILL'; payload: BillRecord }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'ADD_SHARING'; payload: SharingRecord }
  | { type: 'UPDATE_SHARING'; payload: SharingRecord }
  | { type: 'DELETE_SHARING'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: ExpenseCategory }
  | { type: 'UPDATE_CATEGORY'; payload: ExpenseCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'RESET_TO_SEED' }
  | { type: 'LOAD_FROM_CLOUD'; payload: AppState };

const STORAGE_KEY = 'xiaoyan-qianfang-data';

const NEW_CATEGORIES = [
  { id: 'cat13', name: '线下课花销' },
  { id: 'cat14', name: '差旅费' },
  { id: 'cat15', name: '场地费' },
  { id: 'cat16', name: '物料费' },
  { id: 'cat17', name: 'AI花销' },
  { id: 'cat18', name: '其他费用' },
];

function migrateState(parsed: AppState): AppState {
  const partners = parsed.partners.map((p) =>
    p.type ? p : { ...p, type: 'main' as const }
  );
  const projects = parsed.projects.map((p) => {
    let migrated = { ...p };
    if (p.type === 'regular' || p.type === 'offline-course') {
      migrated = { ...migrated, type: 'internal' as const };
    }
    if (p.type === 'ai-website') {
      migrated = { ...migrated, type: 'cooperation' as const };
    }
    if (p.id === 'proj3' && !p.periods) {
      const billPeriods = [...new Set(
        parsed.bills.filter((b) => b.projectId === 'proj3' && b.period).map((b) => b.period!)
      )];
      if (billPeriods.length > 0) {
        migrated = { ...migrated, periods: billPeriods };
      }
    }
    return migrated;
  });
  // 补充缺失的新分类
  const existingCategoryIds = new Set((parsed.expenseCategories || []).map((c) => c.id));
  const existingCategoryNames = new Set((parsed.expenseCategories || []).map((c) => c.name));
  const missingCategories = NEW_CATEGORIES.filter(
    (c) => !existingCategoryIds.has(c.id) && !existingCategoryNames.has(c.name)
  );
  const expenseCategories = [...(parsed.expenseCategories || []), ...missingCategories];

  return { ...parsed, partners, projects, expenseCategories };
}

function initState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed.partners || !parsed.projects || !parsed.bills) {
        return getSeedData();
      }
      return migrateState(parsed);
    }
  } catch {
    // ignore parse errors
  }
  return getSeedData();
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PARTNER':
      return { ...state, partners: [...state.partners, action.payload] };
    case 'UPDATE_PARTNER':
      return { ...state, partners: state.partners.map((p) => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PARTNER':
      return { ...state, partners: state.partners.filter((p) => p.id !== action.payload) };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map((p) => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.payload) };

    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.payload] };
    case 'UPDATE_BILL':
      return { ...state, bills: state.bills.map((b) => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BILL':
      return { ...state, bills: state.bills.filter((b) => b.id !== action.payload) };

    case 'ADD_SHARING':
      return { ...state, sharingRecords: [...state.sharingRecords, action.payload] };
    case 'UPDATE_SHARING':
      return { ...state, sharingRecords: state.sharingRecords.map((r) => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_SHARING':
      return { ...state, sharingRecords: state.sharingRecords.filter((r) => r.id !== action.payload) };

    case 'ADD_CATEGORY':
      return { ...state, expenseCategories: [...state.expenseCategories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, expenseCategories: state.expenseCategories.map((c) => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return { ...state, expenseCategories: state.expenseCategories.filter((c) => c.id !== action.payload) };

    case 'RESET_TO_SEED':
      return getSeedData();

    case 'LOAD_FROM_CLOUD':
      return action.payload;

    default:
      return state;
  }
}

interface AppDataContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  cloudReady: boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

// 从云端加载数据
async function loadFromCloud(): Promise<AppState | null> {
  try {
    const [partnersRes, projectsRes, billsRes, sharingRes, categoriesRes] = await Promise.all([
      supabase.from('partners').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('bills').select('*'),
      supabase.from('sharing_records').select('*'),
      supabase.from('expense_categories').select('*'),
    ]);

    // 如果任何表出错或都没数据，返回 null
    if (partnersRes.error || projectsRes.error || billsRes.error || sharingRes.error || categoriesRes.error) {
      console.warn('云端加载出错，使用本地数据');
      return null;
    }

    // 如果云端完全没有数据，返回 null
    const hasAnyData = (partnersRes.data && partnersRes.data.length > 0) ||
      (projectsRes.data && projectsRes.data.length > 0) ||
      (billsRes.data && billsRes.data.length > 0);
    if (!hasAnyData) return null;

    // 转换字段名（snake_case -> camelCase）
    const partners: Partner[] = (partnersRes.data || []).map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      type: r.type,
    }));

    const projects: Project[] = (projectsRes.data || []).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      status: r.status,
      partnerIds: r.partner_ids || [],
      sharingRatios: r.sharing_ratios || {},
      prioritySharing: r.priority_sharing || undefined,
      periods: r.periods || undefined,
      excludedPeriods: r.excluded_periods || undefined,
      notes: r.notes || undefined,
      extraFields: r.extra_fields || undefined,
    }));

    const bills: BillRecord[] = (billsRes.data || []).map((r) => ({
      id: r.id,
      projectId: r.project_id,
      date: r.date,
      income: r.income || undefined,
      incomeNote: r.income_note || undefined,
      expenseCategory: r.expense_category || undefined,
      expense: r.expense || undefined,
      expenseNote: r.expense_note || undefined,
      period: r.period || undefined,
      attachment: r.attachment || undefined,
      customerName: r.customer_name || undefined,
      customerPhone: r.customer_phone || undefined,
    }));

    const sharingRecords: SharingRecord[] = (sharingRes.data || []).map((r) => ({
      id: r.id,
      date: r.date,
      projectId: r.project_id,
      partnerId: r.partner_id,
      amount: r.amount,
      period: r.period || undefined,
      note: r.note || undefined,
      attachment: r.attachment || undefined,
      isYearEnd: r.is_year_end || undefined,
    }));

    const expenseCategories: ExpenseCategory[] = (categoriesRes.data || []).map((r) => ({
      id: r.id,
      name: r.name,
    }));

    return { partners, projects, bills, sharingRecords, expenseCategories };
  } catch (e) {
    console.warn('云端加载异常:', e);
    return null;
  }
}

// 将数据同步到云端（upsert方式，更可靠）
async function syncToCloud(state: AppState) {
  try {
    // 先获取云端所有 ID
    const [cloudPartners, cloudProjects, cloudBills, cloudSharing, cloudCategories] = await Promise.all([
      supabase.from('partners').select('id'),
      supabase.from('projects').select('id'),
      supabase.from('bills').select('id'),
      supabase.from('sharing_records').select('id'),
      supabase.from('expense_categories').select('id'),
    ]);

    const cloudPartnerIds = new Set((cloudPartners.data || []).map((r) => r.id));
    const cloudProjectIds = new Set((cloudProjects.data || []).map((r) => r.id));
    const cloudBillIds = new Set((cloudBills.data || []).map((r) => r.id));
    const cloudSharingIds = new Set((cloudSharing.data || []).map((r) => r.id));
    const cloudCategoryIds = new Set((cloudCategories.data || []).map((r) => r.id));

    const localPartnerIds = new Set(state.partners.map((p) => p.id));
    const localProjectIds = new Set(state.projects.map((p) => p.id));
    const localBillIds = new Set(state.bills.map((b) => b.id));
    const localSharingIds = new Set(state.sharingRecords.map((r) => r.id));
    const localCategoryIds = new Set(state.expenseCategories.map((c) => c.id));

    // 删除云端有但本地没有的记录
    const deleteOps = [];
    const toDeletePartners = [...cloudPartnerIds].filter((id) => !localPartnerIds.has(id));
    if (toDeletePartners.length > 0) deleteOps.push(supabase.from('partners').delete().in('id', toDeletePartners));

    const toDeleteProjects = [...cloudProjectIds].filter((id) => !localProjectIds.has(id));
    if (toDeleteProjects.length > 0) deleteOps.push(supabase.from('projects').delete().in('id', toDeleteProjects));

    const toDeleteBills = [...cloudBillIds].filter((id) => !localBillIds.has(id));
    if (toDeleteBills.length > 0) deleteOps.push(supabase.from('bills').delete().in('id', toDeleteBills));

    const toDeleteSharing = [...cloudSharingIds].filter((id) => !localSharingIds.has(id));
    if (toDeleteSharing.length > 0) deleteOps.push(supabase.from('sharing_records').delete().in('id', toDeleteSharing));

    const toDeleteCategories = [...cloudCategoryIds].filter((id) => !localCategoryIds.has(id));
    if (toDeleteCategories.length > 0) deleteOps.push(supabase.from('expense_categories').delete().in('id', toDeleteCategories));

    await Promise.all(deleteOps);

    // upsert 所有本地数据（新增或更新）
    const upsertOps = [];
    if (state.partners.length > 0) {
      upsertOps.push(supabase.from('partners').upsert(
        state.partners.map((p) => ({ id: p.id, name: p.name, status: p.status, type: p.type }))
      ));
    }
    if (state.projects.length > 0) {
      upsertOps.push(supabase.from('projects').upsert(
        state.projects.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          partner_ids: p.partnerIds,
          sharing_ratios: p.sharingRatios,
          priority_sharing: p.prioritySharing || null,
          periods: p.periods || null,
          excluded_periods: p.excludedPeriods || null,
          notes: p.notes || null,
          extra_fields: p.extraFields || null,
        }))
      ));
    }
    if (state.bills.length > 0) {
      upsertOps.push(supabase.from('bills').upsert(
        state.bills.map((b) => ({
          id: b.id,
          project_id: b.projectId,
          date: b.date,
          income: b.income || null,
          income_note: b.incomeNote || null,
          expense_category: b.expenseCategory || null,
          expense: b.expense || null,
          expense_note: b.expenseNote || null,
          period: b.period || null,
          attachment: b.attachment || null,
          customer_name: b.customerName || null,
          customer_phone: b.customerPhone || null,
        }))
      ));
    }
    if (state.sharingRecords.length > 0) {
      upsertOps.push(supabase.from('sharing_records').upsert(
        state.sharingRecords.map((r) => ({
          id: r.id,
          date: r.date,
          project_id: r.projectId,
          partner_id: r.partnerId,
          amount: r.amount,
          period: r.period || null,
          note: r.note || null,
          attachment: r.attachment || null,
          is_year_end: r.isYearEnd || false,
        }))
      ));
    }
    if (state.expenseCategories.length > 0) {
      upsertOps.push(supabase.from('expense_categories').upsert(
        state.expenseCategories.map((c) => ({ id: c.id, name: c.name }))
      ));
    }

    await Promise.all(upsertOps);
  } catch (e) {
    console.warn('云端同步出错:', e);
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [cloudReady, setCloudReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [cloudFailed, setCloudFailed] = useState(false);

  // 启动时从云端加载数据
  useEffect(() => {
    (async () => {
      const cloudData = await loadFromCloud();
      if (cloudData) {
        // 补充云端数据中缺失的新分类
        const existingIds = new Set(cloudData.expenseCategories.map((c) => c.id));
        const existingNames = new Set(cloudData.expenseCategories.map((c) => c.name));
        const missing = NEW_CATEGORIES.filter((c) => !existingIds.has(c.id) && !existingNames.has(c.name));
        if (missing.length > 0) {
          cloudData.expenseCategories = [...cloudData.expenseCategories, ...missing];
        }
        dispatch({ type: 'LOAD_FROM_CLOUD', payload: cloudData });
      } else {
        // 云端没有数据或加载失败，检查本地是否有真实数据
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw) as AppState;
            // 如果本地数据包含 seed data 的特征（如喵喵龙），说明是假数据，不要同步
            const hasSeedPartner = localData.partners?.some((p) => p.id === 'p4');
            const hasSeedProject = localData.projects?.some((p) => p.id === 'proj2');
            if (hasSeedPartner || hasSeedProject) {
              console.warn('检测到本地为种子数据，云端加载失败，跳过同步防止数据覆盖');
              setCloudFailed(true);
            } else {
              // 本地有真实数据但云端为空，可以同步上去
            }
          } catch {
            setCloudFailed(true);
          }
        } else {
          // 本地也为空，云端也为空，这是全新设备
        }
      }
      setCloudReady(true);
      setInitialized(true);
    })();
  }, []);

  // 状态变更时同步到 localStorage + 云端
  // 仅在云端数据已成功加载或确认安全后才同步，防止种子数据覆盖云端
  useEffect(() => {
    if (!initialized) return;
    if (cloudFailed) {
      // 云端加载失败且本地是种子数据，只写本地不同步云端
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncToCloud(state);
  }, [state, initialized, cloudFailed]);

  return (
    <AppDataContext.Provider value={{ state, dispatch, cloudReady }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppDataContext() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppDataContext must be used within AppDataProvider');
  return ctx;
}
