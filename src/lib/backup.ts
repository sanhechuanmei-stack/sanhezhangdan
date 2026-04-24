import type { AppState } from '@/context/AppDataContext';

const DB_NAME = 'sanhe-backup';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

interface BackupRecord {
  id: string;       // always 'latest'
  timestamp: number;
  billCount: number;
  partnerCount: number;
  projectCount: number;
  state: AppState;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 保存备份（覆盖上一次）
let lastSaveTime = 0;
export async function saveBackup(state: AppState): Promise<void> {
  const now = Date.now();
  // 30 秒防抖
  if (now - lastSaveTime < 30_000) return;
  lastSaveTime = now;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const record: BackupRecord = {
      id: 'latest',
      timestamp: now,
      billCount: state.bills.length,
      partnerCount: state.partners.length,
      projectCount: state.projects.length,
      state,
    };
    tx.objectStore(STORE_NAME).put(record);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 备份失败不影响主流程
  }
}

// 读取最近一次备份
export async function loadBackup(): Promise<AppState | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('latest');
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const record = req.result as BackupRecord | undefined;
        resolve(record?.state ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// 获取备份摘要信息
export async function getBackupInfo(): Promise<{ date: string; billCount: number } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('latest');
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const record = req.result as BackupRecord | undefined;
        if (!record) return resolve(null);
        const d = new Date(record.timestamp);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        resolve({ date, billCount: record.billCount });
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
