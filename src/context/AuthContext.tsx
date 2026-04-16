import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'admin' | 'partner';

export interface User {
  phone: string;
  name: string;
  role: UserRole;
}

interface Account {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
}

// 硬编码账号
const ACCOUNTS: Account[] = [
  { phone: '15981397178', password: 'magic888', name: '老李', role: 'admin' },
  { phone: '18520169783', password: 'a378320396', name: '橙子', role: 'partner' },
  { phone: '19523902269', password: 'cjq9311', name: '小靓', role: 'partner' },
];

const AUTH_STORAGE_KEY = 'sanhe-auth-user';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  function login(phone: string, password: string): { success: boolean; error?: string } {
    const account = ACCOUNTS.find((a) => a.phone === phone);
    if (!account) return { success: false, error: '手机号未注册' };
    if (account.password !== password) return { success: false, error: '密码错误' };
    setUser({ phone: account.phone, name: account.name, role: account.role });
    return { success: true };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
