import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Download, LogOut, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import FinexyLayout from "@/components/finexy/FinexyLayout";
import { loadBackup, getBackupInfo } from "@/lib/backup";

const STORAGE_KEY = 'xiaoyan-qianfang-data';

function ExportButton() {
  function handleExport() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      alert('暂无数据可导出');
      return;
    }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `三和记账备份_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/50"
      title="下载备份到本地"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">下载备份</span>
    </button>
  );
}

function RestoreButton() {
  const [backupInfo, setBackupInfo] = useState<{ date: string; billCount: number } | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getBackupInfo().then(setBackupInfo);
  }, []);

  async function handleRestore() {
    if (!backupInfo) return;
    if (!confirm(`确定要从备份恢复数据吗？\n\n备份时间：${backupInfo.date}\n账单数量：${backupInfo.billCount} 条\n\n当前数据将被覆盖！`)) return;
    setRestoring(true);
    try {
      const backup = await loadBackup();
      if (!backup) {
        alert('没有找到备份数据');
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      alert('数据恢复成功！页面将刷新。');
      window.location.reload();
    } catch {
      alert('恢复失败，请重试');
    } finally {
      setRestoring(false);
    }
  }

  if (!backupInfo) return null;

  return (
    <button
      onClick={handleRestore}
      disabled={restoring}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/50"
      title={`从备份恢复（${backupInfo.date}，${backupInfo.billCount}条账单）`}
    >
      <RotateCcw className="h-4 w-4" />
      <span className="hidden sm:inline">{restoring ? '恢复中...' : '恢复备份'}</span>
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {user.name}
      </span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
        title="退出登录"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">退出</span>
      </button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // partner 用户（小靓、橙子）使用 Finexy 新版布局
  if (user?.role === 'partner') {
    return <FinexyLayout>{children}</FinexyLayout>;
  }

  // admin（老李）保持原有布局
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(240_5%_97%)]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Apple-style frosted glass header */}
          <header className="h-14 flex items-center border-b border-border/40 bg-white/70 backdrop-blur-xl backdrop-saturate-150 px-4 shrink-0 sticky top-0 z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <span className="ml-3 text-sm font-display font-semibold text-foreground md:hidden tracking-tight">小言千方</span>
            <div className="ml-auto flex items-center gap-3">
              <RestoreButton />
              <ExportButton />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
