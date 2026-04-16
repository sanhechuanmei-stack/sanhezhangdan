import { useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Cpu,
  PieChart,
  BarChart3,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  '研习社': BookOpen,
  '线下课': Users,
  'AI网站': Cpu,
};

export function FinexySidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAppData();
  const { user, logout } = useAuth();
  const currentPartner = state.partners.find(p => p.name === user?.name);

  const businessItems: NavItem[] = state.projects
    .filter(p => p.status === 'active')
    .filter(p => currentPartner && p.partnerIds.includes(currentPartner.id))
    .map(p => ({
      title: p.name,
      url: `/business/${p.id}`,
      icon: ICON_MAP[p.name] || Cpu,
    }));

  const navItems: NavItem[] = [
    { title: '总览', url: '/', icon: LayoutDashboard },
    ...businessItems,
    { title: '分成管理', url: '/sharing', icon: PieChart },
    { title: '年度统计', url: '/annual-stats', icon: BarChart3 },
  ];

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fx-sidebar">
        <div className="fx-sidebar-logo">
          <span>千</span>
        </div>

        <nav className="fx-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.url}
              className={`fx-sidebar-item ${isActive(item.url) ? 'active' : ''}`}
              onClick={() => navigate(item.url)}
            >
              <item.icon size={20} strokeWidth={1.8} />
              <span className="fx-sidebar-tooltip">{item.title}</span>
            </button>
          ))}
        </nav>

        <div className="fx-sidebar-bottom">
          <button className="fx-sidebar-item" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={1.8} />
            <span className="fx-sidebar-tooltip">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fx-mobile-tab-bar">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.url}
            className={`fx-tab-item ${isActive(item.url) ? 'active' : ''}`}
            onClick={() => navigate(item.url)}
          >
            <item.icon size={22} strokeWidth={1.8} />
            <span>{item.title}</span>
            <div className="fx-tab-dot" />
          </button>
        ))}
      </nav>
    </>
  );
}
