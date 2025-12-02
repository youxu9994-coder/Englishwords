
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { login, register } from '../services/api';

interface AuthProps {
  onLogin: (username: string) => void;
  onClose: () => void;
  initialMode: 'login' | 'register';
}

// 登录/注册弹窗组件
const Auth: React.FC<AuthProps> = ({ onLogin, onClose, initialMode }) => {
  const [view, setView] = useState<'login' | 'register'>(initialMode);
  
  // 表单状态
  const [phone, setPhone] = useState(''); // 这里用作 username
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    setView(initialMode);
    setError('');
  }, [initialMode]);

  // 验证手机号格式 (中国大陆手机号)
  const isValidPhone = (p: string) => {
    return /^1[3-9]\d{9}$/.test(p);
  };

  // 提交表单处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (view === 'login') {
        // --- 登录逻辑 ---
        const res = await login(phone, password);
        
        if (res.code === 200 && res.data) {
          // 登录成功
          localStorage.setItem('meow_token', res.data.token);
          onLogin(res.data.username);
        } else {
          // 登录失败
          setError(res.msg || '登录失败，请检查用户名或密码');
        }
      } else {
        // --- 注册逻辑 ---
        
        // 1. 验证手机号
        if (!isValidPhone(phone)) {
            setError("请输入有效的手机号");
            setLoading(false);
            return;
        }

        // 2. 验证密码长度 (>8位)
        if (password.length <= 8) {
            setError("密码长度必须大于8位");
            setLoading(false);
            return;
        }

        // 3. 验证两次密码一致
        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            setLoading(false);
            return;
        }

        // 4. 验证邀请码不为空
        if (!inviteCode.trim()) {
            setError("请输入邀请码（激活码）");
            setLoading(false);
            return;
        }

        // 调用注册接口
        const res = await register(phone, password, inviteCode);
        
        if (res.code === 200 && res.data) {
             // 注册成功并自动登录
             localStorage.setItem('meow_token', res.data.token);
             onLogin(res.data.username);
        } else {
            setError(res.msg || '注册失败，请检查信息后重试');
        }
      }
    } catch (err) {
      console.error("Auth Component Error:", err);
      // 这里处理具体的网络错误对象
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Failed to fetch')) {
        setError('无法连接到服务器，请检查网络或稍后重试');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        setError('请求超时，请检查网络');
      } else {
        setError('发生未知错误，请稍后重试');
      }
    } finally {
      // 只有在没有成功跳转（组件未卸载/模式未切换）时才取消loading，
      // 但这里onLogin会触发父组件更新导致此组件卸载，所以如果是成功的，setLoading可能在卸载组件上调用警告，
      // 不过React 18会自动处理这个，或者我们可以保留这个清理逻辑
      setLoading(false);
    }
  };

  // 切换登录/注册模式
  const toggleView = () => {
    setView(v => v === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[360px] p-6 animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {view === 'register' ? (
          // 注册表单
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">注册</h2>
            <p className="text-gray-500 mb-5 text-xs">创建账户，邀请码将与您的手机号绑定</p>

            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-500 break-words">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">邀请码（兑换码）</label>
                <input
                  type="text"
                  placeholder="请输入邀请码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">邀请码与您的手机号永久绑定</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">手机号</label>
                <input
                  type="text"
                  placeholder="请输入手机号"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  placeholder="请输入密码（>8位）"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">确认密码</label>
                <input
                  type="password"
                  placeholder="请再次输入密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-2.5 rounded-lg shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all mt-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '注册并绑定邀请码'}
              </button>

              <div className="text-center mt-3">
                <span className="text-gray-500 text-xs">已有账户？ </span>
                <button type="button" onClick={toggleView} className="text-[#FF5858] font-bold text-xs hover:underline">
                  返回登录
                </button>
              </div>
            </div>
          </form>
        ) : (
          // 登录表单
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">登录</h2>
            <p className="text-gray-500 mb-6 text-xs">欢迎回来！请登录您的账户</p>

            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-500 break-words">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">手机号</label>
                <input
                  type="text"
                  placeholder="请输入手机号"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  placeholder="请输入密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-2.5 rounded-lg shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all mt-4 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="text-center mt-4">
                <span className="text-gray-500 text-xs">还没有账户？ </span>
                <button type="button" onClick={toggleView} className="text-[#FF5858] font-bold text-xs hover:underline">
                  立即注册
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
