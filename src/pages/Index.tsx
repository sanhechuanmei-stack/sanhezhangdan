import { useState, useMemo } from 'react';
import { AIQuickEntry } from "@/components/dashboard/AIQuickEntry";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProjectSharingCards } from "@/components/dashboard/ProjectSharingCards";
import { SharingOverview } from "@/components/dashboard/SharingOverview";
import { YearEndBonus } from "@/components/dashboard/YearEndBonus";
import { FinexyDashboard } from "@/components/finexy/FinexyDashboard";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/context/AuthContext";
import { getProjectPeriods } from "@/lib/calculations";

const Index = () => {
  const { state } = useAppData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // partner 用户（小靓、橙子）使用 Finexy 新版 UI
  if (!isAdmin && user) {
    return <FinexyDashboard />;
  }

  // Find the project that has period-based bills
  const offlineProject = useMemo(() =>
    state.projects.find((p) => state.bills.some((b) => b.projectId === p.id && b.period)),
    [state.projects, state.bills]
  );

  const periods = useMemo(() =>
    offlineProject ? getProjectPeriods(offlineProject.id, state.bills) : [],
    [offlineProject, state.bills]
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);

  // Default to latest period once periods are available
  const activePeriod = selectedPeriod ?? periods[0];

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* AI Quick Entry — 仅 admin 可见 */}
      {isAdmin && (
        <section>
          <AIQuickEntry />
        </section>
      )}

      {/* Top Row: Stats Cards (left) + Sharing Overview (right) */}
      <section>
        <div className="flex flex-col xl:flex-row xl:items-stretch gap-4 sm:gap-5">
          <div className="xl:w-[45%] shrink-0">
            <StatsCards offlineProjectId={offlineProject?.id} selectedPeriod={activePeriod} />
          </div>
          <div className="flex-1 min-w-0">
            <SharingOverview />
          </div>
        </div>
      </section>

      {/* Project Sharing */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-display font-semibold text-base sm:text-lg text-foreground">各项目分成</h2>
          {offlineProject && periods.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{offlineProject.name}期次</span>
              <select
                value={activePeriod ?? ''}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <ProjectSharingCards offlineProjectId={offlineProject?.id} selectedPeriod={activePeriod} />
      </section>

      {/* Year End Bonus */}
      <YearEndBonus />
    </div>
  );
};

export default Index;
