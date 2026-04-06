import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Receipt,
  BookOpen,
  Scissors,
  Globe,
  PieChart,
  BarChart3,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState, useCallback, useMemo } from "react";
import { useAppData } from "@/hooks/useAppData";

const mainItems = [
  { title: "总览", url: "/", icon: LayoutDashboard },
];

const basicItems = [
  { title: "合伙人", url: "/partners", icon: Users },
  { title: "项目管理", url: "/projects", icon: FolderKanban },
  { title: "支出项目", url: "/expense-categories", icon: Receipt },
];

const otherItems = [
  { title: "分成管理", url: "/sharing", icon: PieChart },
  { title: "年度统计", url: "/annual-stats", icon: BarChart3 },
];

// 根据项目名称/类型匹配图标
const ICON_MAP: Record<string, LucideIcon> = {
  '研习社': BookOpen,
  '三和·小剪刀': Scissors,
};
const TYPE_ICON_MAP: Record<string, LucideIcon> = {
  'internal': FolderKanban,
  'cooperation': Globe,
};

export function AppSidebar() {
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
  const collapsed = sidebarState === "collapsed";
  const location = useLocation();
  const [basicOpen, setBasicOpen] = useState(true);
  const { state: appState } = useAppData();

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // 动态生成业务菜单
  const businessItems = useMemo(() => {
    return appState.projects
      .filter((p) => p.status === 'active')
      .map((p) => ({
        title: p.name,
        url: `/business/${p.id}`,
        icon: ICON_MAP[p.name] || TYPE_ICON_MAP[p.type] || FolderKanban,
      }));
  }, [appState.projects]);

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader className="px-5 pt-6 pb-2">
        {!collapsed && (
          <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
            小言千方
          </h1>
        )}
      </SidebarHeader>
      <SidebarContent className="px-3">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all duration-200 text-[hsl(240_4%_46%)] hover:text-foreground hover:bg-[hsl(240_5%_96%)] ${
                        isActive(item.url) ? "sidebar-pill-active" : ""
                      }`}
                      activeClassName="sidebar-pill-active"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px] font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Basic Info */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-[hsl(240_4%_60%)] text-[11px] uppercase tracking-[0.08em] cursor-pointer flex items-center justify-between px-3 font-semibold"
            onClick={() => setBasicOpen(!basicOpen)}
          >
            {!collapsed && (
              <>
                <span>基础信息</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${basicOpen ? "" : "-rotate-90"}`} />
              </>
            )}
          </SidebarGroupLabel>
          {basicOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {basicItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all duration-200 text-[hsl(240_4%_46%)] hover:text-foreground hover:bg-[hsl(240_5%_96%)] ${
                          isActive(item.url) ? "sidebar-pill-active" : ""
                        }`}
                        activeClassName="sidebar-pill-active"
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="text-[13px] font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Business */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(240_4%_60%)] text-[11px] uppercase tracking-[0.08em] px-3 font-semibold">
            {!collapsed && "业务"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all duration-200 text-[hsl(240_4%_46%)] hover:text-foreground hover:bg-[hsl(240_5%_96%)] ${
                        isActive(item.url) ? "sidebar-pill-active" : ""
                      }`}
                      activeClassName="sidebar-pill-active"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px] font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Other */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(240_4%_60%)] text-[11px] uppercase tracking-[0.08em] px-3 font-semibold">
            {!collapsed && "管理"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all duration-200 text-[hsl(240_4%_46%)] hover:text-foreground hover:bg-[hsl(240_5%_96%)] ${
                        isActive(item.url) ? "sidebar-pill-active" : ""
                      }`}
                      activeClassName="sidebar-pill-active"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px] font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
