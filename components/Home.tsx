
import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BOOKS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { BookOpen, Trophy } from 'lucide-react';
import { fetchCategories, CategoryData } from '../services/api';

interface HomeProps {
  onSelectBook: (book: Book) => void;
  onRegister: () => void;
  isLoggedIn: boolean;
}

const Home: React.FC<HomeProps> = ({ onSelectBook, onRegister, isLoggedIn }) => {
  // Use string type for activeCategory to support both enum values and API strings
  const [activeCategory, setActiveCategory] = useState<string>('四级'); 
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const apiCategories = await fetchCategories();
        
        if (apiCategories && apiCategories.length > 0) {
          setCategories(apiCategories);
          
          // If the currently active category (default '四级') is not in the API list, switch to the first one
          if (!apiCategories.find(c => c.name === activeCategory)) {
             setActiveCategory(apiCategories[0].name);
          }
        } else {
          // Fallback to local constants if API returns empty
          setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ id: i, name: c })));
        }
      } catch (e) {
        // Fallback on error
        setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ id: i, name: c })));
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter books based on active category
  // book.category is an Enum value (string), activeCategory is string. Comparison works as expected.
  const filteredBooks = BOOKS.filter(b => b.category === activeCategory);

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
        {loading ? (
             // Loading state skeleton
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse"></div>
             ))
        ) : (
            categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeCategory === cat.name 
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
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
              <div className="flex flex-col justify-between py-1">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{book.title}</h3>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded mt-1 inline-block">
                        {book.subTitle}
                    </span>
                </div>
                <div>
                   <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit mb-2">
                     <span className="mr-1">{book.wordCount} words</span>
                   </div>
                   {/* 进度条 (Mock) */}
                   <div className="w-full bg-gray-100 h-1.5 rounded-full">
                      <div className="w-[0%] h-full bg-blue-500 rounded-full"></div>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400 mt-1">
                     <span>Progress</span>
                     <span>0%</span>
                   </div>
                </div>
              </div>
            </div>
          ))
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
