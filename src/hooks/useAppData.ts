import { useAppDataContext } from '@/context/AppDataContext';
import type { Partner, Project, BillRecord, SharingRecord, ExpenseCategory } from '@/types';

export function useAppData() {
  const { state, dispatch } = useAppDataContext();

  return {
    state,
    dispatch,
    // Partners
    addPartner: (p: Partner) => dispatch({ type: 'ADD_PARTNER', payload: p }),
    updatePartner: (p: Partner) => dispatch({ type: 'UPDATE_PARTNER', payload: p }),
    deletePartner: (id: string) => dispatch({ type: 'DELETE_PARTNER', payload: id }),
    // Projects
    addProject: (p: Project) => dispatch({ type: 'ADD_PROJECT', payload: p }),
    updateProject: (p: Project) => dispatch({ type: 'UPDATE_PROJECT', payload: p }),
    deleteProject: (id: string) => dispatch({ type: 'DELETE_PROJECT', payload: id }),
    // Bills
    addBill: (b: BillRecord) => dispatch({ type: 'ADD_BILL', payload: b }),
    updateBill: (b: BillRecord) => dispatch({ type: 'UPDATE_BILL', payload: b }),
    deleteBill: (id: string) => dispatch({ type: 'DELETE_BILL', payload: id }),
    // Sharing
    addSharing: (r: SharingRecord) => dispatch({ type: 'ADD_SHARING', payload: r }),
    updateSharing: (r: SharingRecord) => dispatch({ type: 'UPDATE_SHARING', payload: r }),
    deleteSharing: (id: string) => dispatch({ type: 'DELETE_SHARING', payload: id }),
    // Categories
    addCategory: (c: ExpenseCategory) => dispatch({ type: 'ADD_CATEGORY', payload: c }),
    updateCategory: (c: ExpenseCategory) => dispatch({ type: 'UPDATE_CATEGORY', payload: c }),
    deleteCategory: (id: string) => dispatch({ type: 'DELETE_CATEGORY', payload: id }),
    // Reset
    resetToSeed: () => dispatch({ type: 'RESET_TO_SEED' }),
  };
}
