import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { loadBackup, getBackupInfo } from '@/lib/backup';

const STORAGE_KEY = 'xiaoyan-qianfang-data';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{ date: string; billCount: number } | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getBackupInfo().then(setBackupInfo);
  }, []);

  function handleLogin() {
    setError('');
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!password.trim()) { setError('请输入密码'); return; }
    setLoading(true);
    const result = login(phone.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || '登录失败');
    }
  }

  async function handleRestore() {
    if (!confirm('确定要从备份恢复数据吗？当前浏览器中的数据将被覆盖。')) return;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(240_5%_97%)] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-display font-bold tracking-tight text-foreground">小言千方</div>
          <p className="text-sm text-muted-foreground">三和记账系统</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <Label>手机号</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>密码</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl"
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </div>

        {/* Backup Restore */}
        {backupInfo && (
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              本地备份：{backupInfo.date}（{backupInfo.billCount} 条账单）
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestore}
              disabled={restoring}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {restoring ? '恢复中...' : '从备份恢复数据'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
