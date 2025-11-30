import React, { useState, useEffect } from 'react';
import { Book, ViewState, User } from './types';
import { MOCK_WORDS } from './constants';
import Home from './components/Home';
import BookDetail from './components/BookDetail';
import Flashcards from './components/Flashcards';
import Dictation from './components/Dictation';
import MultipleChoice from './components/MultipleChoice';
import MatchGame from './components/MatchGame';
import Auth from './components/Auth';
import { BookOpen, LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  // 全局状态管理
  const [user, setUser] = useState<User | null>(null); // 当前登录用户
  const [view, setView] = useState<ViewState>(ViewState.HOME); // 当前视图
  const [selectedBook, setSelectedBook] = useState<Book | null>(null); // 当前选中的词书
  const [isAuthOpen, setIsAuthOpen] = useState(false); // 是否打开登录/注册弹窗
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login'); // 弹窗模式

  // 初始化：检查本地存储的用户会话
  useEffect(() => {
    const storedUser = localStorage.getItem('meow_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 登录处理
  const handleLogin = (username: string) => {
    const newUser = { username };
    setUser(newUser);
    localStorage.setItem('meow_user', JSON.stringify(newUser));
    setIsAuthOpen(false);
  };

  // 登出处理
  const handleLogout = () => {
    setUser(null);
    setSelectedBook(null);
    setView(ViewState.HOME);
    localStorage.removeItem('meow_user');
  };

  // 打开认证弹窗
  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // 选择词书并进入详情页
  const handleSelectBook = (book: Book) => {
    // 检查登录状态
    if (!user) {
      openAuth('login');
      return;
    }
    setSelectedBook(book);
    setView(ViewState.BOOK_DETAIL);
  };

  // 导航处理函数
  const handleBackToHome = () => {
    setSelectedBook(null);
    setView(ViewState.HOME);
  };

  const handleBackToDetail = () => {
    setView(ViewState.BOOK_DETAIL);
  };

  // 根据当前 view 状态渲染对应的组件
  const renderContent = () => {
    switch (view) {
      case ViewState.HOME:
        return (
          <Home 
            onSelectBook={handleSelectBook} 
            onRegister={() => openAuth('register')}
            isLoggedIn={!!user}
          />
        );
      
      case ViewState.BOOK_DETAIL:
        return selectedBook ? (
          <BookDetail 
            book={selectedBook} 
            words={MOCK_WORDS} 
            onBack={handleBackToHome} 
            onSelectMode={setView}
          />
        ) : <Home onSelectBook={handleSelectBook} onRegister={() => openAuth('register')} isLoggedIn={!!user} />;

      case ViewState.MODE_FLASHCARD:
        return <Flashcards words={MOCK_WORDS} onExit={handleBackToDetail} onSwitchMode={setView} />;
      
      case ViewState.MODE_DICTATION:
        return <Dictation words={MOCK_WORDS} onExit={handleBackToDetail} onSwitchMode={setView} />;
      
      case ViewState.MODE_CHOICE:
        return <MultipleChoice words={MOCK_WORDS} onExit={handleBackToDetail} onSwitchMode={setView} />;
      
      case ViewState.MODE_MATCH:
        return <MatchGame words={MOCK_WORDS} onExit={handleBackToDetail} onSwitchMode={setView} />;
        
      default:
        return (
          <Home 
            onSelectBook={handleSelectBook} 
            onRegister={() => openAuth('register')}
            isLoggedIn={!!user}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* 顶部导航栏 - 仅在首页显示，保持其他沉浸式学习页面的整洁 */}
      {view === ViewState.HOME && (
        <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={handleBackToHome}>
             <BookOpen size={24} />
             <span>布布单词</span>
           </div>
           
           <div className="flex items-center gap-4">
             {user ? (
               <>
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                   <UserIcon size={16} />
                   <span>{user.username}</span>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                    title="Logout"
                 >
                    <LogOut size={18} />
                 </button>
               </>
             ) : (
               <button 
                 onClick={() => openAuth('login')}
                 className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-colors"
               >
                 登录
               </button>
             )}
           </div>
        </nav>
      )}

      {/* 主视图渲染区域 */}
      <main className="h-full">
        {renderContent()}
      </main>

      {/* 全局认证弹窗 */}
      {isAuthOpen && (
        <Auth 
          onLogin={handleLogin} 
          onClose={() => setIsAuthOpen(false)} 
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default App;