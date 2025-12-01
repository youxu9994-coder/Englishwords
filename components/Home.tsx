
import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BOOKS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { BookOpen, Trophy } from 'lucide-react';
import { fetchCategories, fetchBooksByCategory, CategoryData, BookDetailData } from '../services/api';

interface HomeProps {
  onSelectBook: (book: Book) => void;
  onRegister: () => void;
  isLoggedIn: boolean;
}

// 辅助函数：根据ID生成一个固定的封面颜色
const getCoverColor = (id: number) => {
    const colors = ['bg-orange-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100', 'bg-purple-100', 'bg-yellow-100'];
    return colors[id % colors.length];
};

const Home: React.FC<HomeProps> = ({ onSelectBook, onRegister, isLoggedIn }) => {
  const [activeCategoryName, setActiveCategoryName] = useState<string>('四级'); 
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // 1. Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const apiCategories = await fetchCategories();
        
        if (apiCategories && apiCategories.length > 0) {
          setCategories(apiCategories);
          // Set default active category to the first one available
          if (apiCategories.length > 0) {
             setActiveCategoryName(apiCategories[0].name);
          }
        } else {
          // Fallback
          const mockCats = DEFAULT_CATEGORIES.map((c, i) => ({ id: i + 1, name: c }));
          setCategories(mockCats);
          setActiveCategoryName(mockCats[0].name);
        }
      } catch (e) {
        const mockCats = DEFAULT_CATEGORIES.map((c, i) => ({ id: i + 1, name: c }));
        setCategories(mockCats);
        setActiveCategoryName(mockCats[0].name);
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  // 2. Fetch books whenever active category changes
  useEffect(() => {
    const loadBooks = async () => {
        const activeCat = categories.find(c => c.name === activeCategoryName);
        if (!activeCat) return;

        setLoadingBooks(true);
        try {
            const apiBooks = await fetchBooksByCategory(activeCat.id);
            if (apiBooks && apiBooks.length > 0) {
                const mappedBooks: Book[] = apiBooks.map(b => ({
                    id: String(b.bookId),
                    title: b.bookName,
                    subTitle: '', // 接口无副标题
                    wordCount: b.totalWords,
                    category: activeCategoryName,
                    coverColor: getCoverColor(b.bookId),
                    learnedCount: b.learnedWords
                }));
                setBooks(mappedBooks);
            } else {
                setBooks([]);
            }
        } catch (error) {
            console.error("Failed to load books", error);
            setBooks([]);
        } finally {
            setLoadingBooks(false);
        }
    };
    
    if (categories.length > 0) {
        loadBooks();
    }
  }, [activeCategoryName, categories]);


  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 首页Hero横幅区域 */}
      <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 flex flex-col md:flex-row items-center border border-gray-100">
        <div className="flex-1 text-center md:text-left mb-6 md:mb-0 space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">猛猛背单词!</h1>
          <p className="text-gray-500">背单词也能很开心，和布布一起猛猛提升词汇量吧</p>
          
          {/* 未登录时显示注册按钮 */}
          {!isLoggedIn && (
            <button 
              onClick={onRegister}
              className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95"
            >
              立即注册
            </button>
          )}
        </div>
        <div className="flex-1 flex justify-center">
            {/* 简单的纯CSS插画 */}
            <div className="relative w-48 h-32 bg-yellow-100 rounded-xl flex items-center justify-center border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-6xl">🐱</span>
                <div className="absolute -top-4 -right-4 bg-white px-3 py-1 border-2 border-black rounded-full font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Study!
                </div>
            </div>
        </div>
      </div>

      {/* 分类切换栏 */}
      <div className="flex overflow-x-auto pb-4 gap-2 mb-6 custom-scroll">
        {loadingCats ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse"></div>
             ))
        ) : (
            categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryName(cat.name)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeCategoryName === cat.name 
                    ? 'bg-red-100 text-red-500 shadow-sm border border-red-200' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))
        )}
      </div>

      {/* 词书网格列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[200px]">
        {loadingBooks ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl h-32 animate-pulse border border-gray-100"></div>
             ))
        ) : books.length > 0 ? (
          books.map(book => {
            const progress = book.wordCount > 0 && book.learnedCount 
                ? Math.round((book.learnedCount / book.wordCount) * 100) 
                : 0;

            return (
                <div 
                  key={book.id} 
                  onClick={() => onSelectBook(book)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex gap-4 group"
                >
                  {/* 封面图标 */}
                  <div className={`w-24 h-32 rounded-lg flex-shrink-0 flex items-center justify-center ${book.coverColor} border-2 border-gray-800 shadow-[3px_3px_0px_0px_rgba(31,41,55,0.1)] group-hover:shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] transition-shadow`}>
                     <BookOpen className="text-gray-800" size={32} />
                  </div>
                  
                  {/* 词书信息 */}
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2">{book.title}</h3>
                        {book.subTitle && (
                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded mt-1 inline-block">
                                {book.subTitle}
                            </span>
                        )}
                    </div>
                    <div>
                       <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit mb-2">
                         <span className="mr-1">{book.wordCount} words</span>
                       </div>
                       {/* 进度条 */}
                       <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                       </div>
                       <div className="flex justify-between text-xs text-gray-400 mt-1">
                         <span>Progress</span>
                         <span>{progress}%</span>
                       </div>
                    </div>
                  </div>
                </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-gray-400">
             <Trophy size={48} className="mx-auto mb-4 opacity-30" />
             <p>No books available for this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
