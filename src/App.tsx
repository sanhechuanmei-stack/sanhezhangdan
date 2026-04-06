import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDataProvider } from "@/context/AppDataContext";
import { useAppData } from "@/hooks/useAppData";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PartnersPage from "./pages/PartnersPage";
import ProjectsPage from "./pages/ProjectsPage";
import ExpenseCategoriesPage from "./pages/ExpenseCategoriesPage";
import DynamicBusinessPage from "./pages/DynamicBusinessPage";
import SharingPage from "./pages/SharingPage";
import AnnualStatsPage from "./pages/AnnualStatsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppDataProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />
              <Route path="/business/:projectId" element={<DynamicBusinessPage />} />
              {/* 旧路由兼容重定向 */}
              <Route path="/yanxishe" element={<LegacyRedirect name="研习社" />} />
              <Route path="/xiaojiandao" element={<LegacyRedirect name="三和·小剪刀" />} />
              <Route path="/offline-course" element={<LegacyRedirect name="线下课" />} />
              <Route path="/sharing" element={<SharingPage />} />
              <Route path="/annual-stats" element={<AnnualStatsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// 旧路由兼容：按名称查找项目，重定向到 /business/:projectId
function LegacyRedirect({ name }: { name: string }) {
  const { state } = useAppData();
  const project = state.projects.find((p) => p.name === name);
  if (project) return <Navigate to={`/business/${project.id}`} replace />;
  return <Navigate to="/" replace />;
}
