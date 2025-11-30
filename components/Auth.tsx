
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { login } from '../services/api';

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

  // 提交表单处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (view === 'login') {
        // 调用登录接口
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
        // 注册逻辑暂时保持模拟 (或者根据后续需求添加注册接口)
        setTimeout(() => {
          if (password !== confirmPassword) {
             setError("两次输入的密码不一致");
             setLoading(false);
             return;
          }
          // 模拟注册成功
          onLogin(phone);
        }, 800);
      }
    } catch (err) {
      setError('网络请求发生错误，请稍后重试');
    } finally {
      if (view === 'login') setLoading(false);
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
              <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-500">
                <AlertCircle size={14} />
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
                <label className="block text-xs font-bold text-gray-700 mb-1">用户名/手机号</label>
                <input
                  type="text"
                  placeholder="请输入用户名"
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
              <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-500">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">用户名/手机号</label>
                <input
                  type="text"
                  placeholder="请输入用户名"
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
