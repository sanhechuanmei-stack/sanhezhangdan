import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Download } from "lucide-react";

function ExportButton() {
  function handleExport() {
    const STORAGE_KEY = 'xiaoyan-qianfang-data';
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
      title="导出备份"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">导出备份</span>
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(240_5%_97%)]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Apple-style frosted glass header */}
          <header className="h-14 flex items-center border-b border-border/40 bg-white/70 backdrop-blur-xl backdrop-saturate-150 px-4 shrink-0 sticky top-0 z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <span className="ml-3 text-sm font-display font-semibold text-foreground md:hidden tracking-tight">小言千方</span>
            <div className="ml-auto">
              <ExportButton />
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
