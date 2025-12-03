
import React, { useState, useEffect } from 'react';
import { Book, ViewState, User, Word } from './types';
import { MOCK_WORDS } from './constants';
import Home from './components/Home';
import BookDetail from './components/BookDetail';
import Flashcards from './components/Flashcards';
import Dictation from './components/Dictation';
import MultipleChoice from './components/MultipleChoice';
import MatchGame from './components/MatchGame';
import Auth from './components/Auth';
import { BookOpen, LogOut, User as UserIcon } from 'lucide-react';
import { logout } from './services/api';

const App: React.FC = () => {
  // 全局状态管理
  const [user, setUser] = useState<User | null>(null); // 当前登录用户
  const [view, setView] = useState<ViewState>(ViewState.HOME); // 当前视图
  const [selectedBook, setSelectedBook] = useState<Book | null>(null); // 当前选中的词书
  const [studyWords, setStudyWords] = useState<Word[]>([]); // 当前正在学习的单词列表
  const [isAuthOpen, setIsAuthOpen] = useState(false); // 是否打开登录/注册弹窗
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login'); // 弹窗模式

  // 初始化：检查本地存储的用户会话
  useEffect(() => {
    const storedUser = localStorage.getItem('meow_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 监听 401 未授权事件 (Token过期或无效)
  useEffect(() => {
    const handleUnauthorized = () => {
      // 清除本地状态，类似于登出
      setUser(null);
      setSelectedBook(null);
      setStudyWords([]);
      setView(ViewState.HOME);
      localStorage.removeItem('meow_user');
      localStorage.removeItem('meow_token');
      
      // 打开登录弹窗
      setAuthMode('login');
      setIsAuthOpen(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // 登录处理
  const handleLogin = (username: string) => {
    const newUser = { username };
    setUser(newUser);
    localStorage.setItem('meow_user', JSON.stringify(newUser));
    setIsAuthOpen(false);
  };

  // 登出处理
  const handleLogout = async () => {
    try {
      // 调用服务端登出接口
      await logout();
    } catch (error) {
      console.error("Logout failed on server:", error);
    } finally {
      // 无论服务端是否成功，前端都清除本地状态
      setUser(null);
      setSelectedBook(null);
      setStudyWords([]);
      setView(ViewState.HOME);
      localStorage.removeItem('meow_user');
      localStorage.removeItem('meow_token');
    }
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
    setStudyWords([]);
    setView(ViewState.HOME);
  };

  const handleBackToDetail = () => {
    setView(ViewState.BOOK_DETAIL);
  };

  // 开始学习特定模式，并传入对应的单词列表
  const handleStartStudy = (mode: ViewState, words: Word[]) => {
      setStudyWords(words);
      setView(mode);
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
            onSelectMode={handleStartStudy}
          />
        ) : <Home onSelectBook={handleSelectBook} onRegister={() => openAuth('register')} isLoggedIn={!!user} />;

      case ViewState.MODE_FLASHCARD:
        return <Flashcards words={studyWords} onExit={handleBackToDetail} onSwitchMode={(mode) => handleStartStudy(mode, studyWords)} />;
      
      case ViewState.MODE_DICTATION:
        return <Dictation words={studyWords} onExit={handleBackToDetail} onSwitchMode={(mode) => handleStartStudy(mode, studyWords)} />;
      
      case ViewState.MODE_CHOICE:
        return <MultipleChoice words={studyWords} onExit={handleBackToDetail} onSwitchMode={(mode) => handleStartStudy(mode, studyWords)} />;
      
      case ViewState.MODE_MATCH:
        return <MatchGame words={studyWords} onExit={handleBackToDetail} onSwitchMode={(mode) => handleStartStudy(mode, studyWords)} />;
        
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
