
import React, { useState } from 'react';
import { Book, ViewState, Word } from '../types';
import { ArrowLeft, Zap, PenTool, ListChecks, Grid3X3, Clock, Star, TrendingUp } from 'lucide-react';
import WordListModal from './WordListModal';

interface BookDetailProps {
  book: Book;
  words: Word[];
  onBack: () => void;
  onSelectMode: (mode: ViewState) => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ book, words, onBack, onSelectMode }) => {
  const [viewingListId, setViewingListId] = useState<number | null>(null); // 当前查看全部单词的列表ID

  // 模拟获取特定List的单词数据
  const getWordsForList = (listNum: number) => {
      // 真实场景下应根据listNum筛选，这里简化为返回所有模拟数据
      return words;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 顶部自定义黑色导航栏 */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold">返回首页</span>
        </button>
        
        <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
          {book.title}
        </h1>
        
        <div className="w-20"></div> {/* 占位符，保持flex布局平衡 */}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 学习数据统计看板 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
           <div className="bg-red-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-red-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">7</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">已学习</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-red-400">
                  <Clock size={18} />
              </div>
           </div>
           
           <div className="bg-blue-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-blue-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">12</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">已加星</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-400">
                  <Star size={18} />
              </div>
           </div>
           
           <div className="bg-purple-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-purple-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">82%</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">正确率</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-400">
                  <TrendingUp size={18} />
              </div>
           </div>
           
           <div className="bg-green-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-green-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">45</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">今日已学</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-green-400">
                  <Clock size={18} />
              </div>
           </div>
        </div>

        {/* 单词列表头 */}
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">单词列表</h2>
            <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition-colors">
                    <Zap size={12} /> 乱序
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition-colors">
                    A-Z
                </button>
            </div>
        </div>

        {/* 列表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* 模拟多个List */}
           {[1, 2, 3, 4].map(listNum => (
               <div key={listNum} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-gray-800">List {listNum}</h3>
                          <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-gray-800 w-0" />
                          </div>
                      </div>
                      <span className="text-xs text-gray-400">0/50 词</span>
                  </div>
                  
                  {/* 单词预览区域 */}
                  <div className="flex gap-2 flex-wrap mb-6 h-12 overflow-hidden content-start">
                      <span className="text-xs text-gray-400 mb-1 w-full block">预览单词</span>
                      {words.slice((listNum-1)*3, (listNum-1)*3 + 3).map(w => (
                          <span key={w.id} className="bg-gray-50 text-gray-600 px-3 py-1 rounded text-xs border border-gray-100">
                              {w.en}
                          </span>
                      ))}
                      <button 
                        onClick={() => setViewingListId(listNum)} 
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        查看全部
                      </button>
                  </div>

                  {/* 功能按钮组：跳转不同模式 */}
                  <div className="grid grid-cols-4 gap-3">
                     <button 
                       onClick={() => onSelectMode(ViewState.MODE_FLASHCARD)}
                       className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                     >
                         单词闪过
                     </button>
                     <button 
                       onClick={() => onSelectMode(ViewState.MODE_DICTATION)}
                       className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                     >
                         听写大师
                     </button>
                     <button 
                       onClick={() => onSelectMode(ViewState.MODE_CHOICE)}
                       className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                     >
                         词义选择
                     </button>
                     <button 
                       onClick={() => onSelectMode(ViewState.MODE_MATCH)}
                       className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                     >
                         连连看
                     </button>
                  </div>
               </div>
           ))}
        </div>
      </div>

      {/* 查看全部单词弹窗 */}
      {viewingListId !== null && (
        <WordListModal
          listName={`List ${viewingListId}`}
          words={getWordsForList(viewingListId)}
          onClose={() => setViewingListId(null)}
        />
      )}
    </div>
  );
};

export default BookDetail;
