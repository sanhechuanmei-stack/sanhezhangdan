import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDataProvider } from "@/context/AppDataContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useAppData } from "@/hooks/useAppData";
import AppLayout from "@/components/AppLayout";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PartnersPage from "./pages/PartnersPage";
import ProjectsPage from "./pages/ProjectsPage";
import ExpenseCategoriesPage from "./pages/ExpenseCategoriesPage";
import DynamicBusinessPage from "./pages/DynamicBusinessPage";
import SharingPage from "./pages/SharingPage";
import AnnualStatsPage from "./pages/AnnualStatsPage";

const queryClient = new QueryClient();

// 未登录时跳转到登录页
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// partner 角色禁止访问的路由
const ADMIN_ONLY_PATHS = ['/partners', '/projects', '/expense-categories', '/annual-stats'];

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AppDataProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/partners" element={<RequireAdmin><PartnersPage /></RequireAdmin>} />
                        <Route path="/projects" element={<RequireAdmin><ProjectsPage /></RequireAdmin>} />
                        <Route path="/expense-categories" element={<RequireAdmin><ExpenseCategoriesPage /></RequireAdmin>} />
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
                  </AppDataProvider>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
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
