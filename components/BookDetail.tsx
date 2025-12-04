
import React, { useState, useEffect } from 'react';
import { Book, ViewState, Word } from '../types';
import { ArrowLeft, Zap, Clock, Star, TrendingUp, ArrowDownAZ, Shuffle, RotateCcw } from 'lucide-react';
import WordListModal from './WordListModal';
import StarredBook from './StarredBook';
import { fetchWordDetail, fetchStudyDetail, clearStudyRecord } from '../services/api';

interface BookDetailProps {
  book: Book;
  words: Word[]; // 这里的 words props 暂时保留，但我们会优先使用 API 获取的数据
  onBack: () => void;
  onSelectMode: (mode: ViewState, words: Word[]) => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ book, onBack, onSelectMode }) => {
  const [viewingListIndex, setViewingListIndex] = useState<number | null>(null); // 当前查看全部单词的列表索引
  const [allWords, setAllWords] = useState<Word[]>([]); // 书籍所有单词 (原始顺序)
  const [wordLists, setWordLists] = useState<Word[][]>([]); // 切分后的单词列表
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'default' | 'az'>('default'); // 排序模式：默认(乱序) 或 A-Z
  const [showStarredList, setShowStarredList] = useState(false); // 是否显示星标单词本
  
  // 学习统计状态
  const [stats, setStats] = useState({
      learned: 0,
      starred: 0,
      accuracy: 0,
      today: 0
  });

  // 重置进度相关状态
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 用于触发重新加载

  // 禁止背景滚动
  useEffect(() => {
    if (showResetConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showResetConfirm]);

  // 加载单词数据和学习详情
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // 并行请求：获取单词列表和学习记录
            const [fetchedWords, studyDetails] = await Promise.all([
                fetchWordDetail(book.id),
                fetchStudyDetail(book.id)
            ]);

            // 1. 处理统计数据
            let learnedCount = 0;
            let starredCount = 0;
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let todayCount = 0;

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            // 创建一个映射以便快速查找单词的学习状态
            const studyMap = new Map();

            studyDetails.forEach(item => {
                studyMap.set(String(item.wordId), item);

                if (item.isLearned) learnedCount++;
                if (item.isStarred) starredCount++;
                
                totalCorrect += item.correctCount || 0;
                totalIncorrect += item.incorrectCount || 0;

                // 计算今日已学 (learnCreateTime > 今日0点)
                if (item.learnCreateTime) {
                    const learnDate = new Date(item.learnCreateTime);
                    if (!isNaN(learnDate.getTime()) && learnDate >= startOfToday) {
                        todayCount++;
                    }
                }
            });

            const accuracy = (totalCorrect + totalIncorrect) > 0 
                ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) 
                : 0;

            setStats({
                learned: learnedCount,
                starred: starredCount,
                accuracy: accuracy,
                today: todayCount
            });

            // 2. 合并单词数据与学习状态 (包括 isStarred, isLearned, note)
            const mergedWords = fetchedWords.map(word => {
                const detail = studyMap.get(word.id);
                return {
                    ...word,
                    isStarred: detail ? detail.isStarred : false,
                    isLearned: detail ? detail.isLearned : false,
                    note: detail ? detail.learningNotes : undefined // Map note from learningNotes
                };
            });
            
            setAllWords(mergedWords);
            // wordLists calculation moved to separate useEffect dependent on sortMode

        } catch (error) {
            console.error("Failed to fetch book data", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [book.id, refreshKey]);

  // 处理排序和列表切分
  useEffect(() => {
    if (allWords.length === 0) return;

    let processedWords = [...allWords];

    if (sortMode === 'az') {
        processedWords.sort((a, b) => a.en.localeCompare(b.en));
    }
    // 'default' mode keeps the original API order (which we assume represents "Random" or the book's default order)

    // 将单词切分为 50 个一组
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < processedWords.length; i += chunkSize) {
        chunks.push(processedWords.slice(i, i + chunkSize));
    }
    setWordLists(chunks);
  }, [allWords, sortMode]);


  // 获取特定List的单词数据
  const getWordsForList = (index: number) => {
      return wordLists[index] || [];
  };

  // 处理重置进度
  const handleResetProgress = async () => {
      try {
          const res = await clearStudyRecord(book.id);
          if (res.code === 200) {
              setShowResetConfirm(false);
              setRefreshKey(prev => prev + 1); // 触发数据重新加载
          } else {
              alert(res.msg || '重置失败');
          }
      } catch (error) {
          alert('操作失败，请检查网络');
          console.error(error);
      }
  };

  // 处理星标本中的取消星标操作
  const handleUnstarFromBook = (wordId: string) => {
      setAllWords(prev => prev.map(w => w.id === wordId ? { ...w, isStarred: false } : w));
      setStats(prev => ({ ...prev, starred: Math.max(0, prev.starred - 1) }));
  };

  // 处理清空所有星标
  const handleClearAllStarred = () => {
      setAllWords(prev => prev.map(w => ({ ...w, isStarred: false })));
      setStats(prev => ({ ...prev, starred: 0 }));
  };

  // 如果显示星标单词本
  if (showStarredList) {
      const starredWords = allWords.filter(w => w.isStarred);
      return (
          <StarredBook 
            words={starredWords} 
            onBack={() => setShowStarredList(false)}
            onUnstar={handleUnstarFromBook}
            onClearAll={handleClearAllStarred}
            onSelectMode={onSelectMode}
          />
      );
  }

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
        
        {/* 右侧占位，保持标题居中 */}
        <div className="w-20"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 学习数据统计看板 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
           <div className="bg-red-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-red-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.learned}</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">已学习</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-red-400">
                  <Clock size={18} />
              </div>
           </div>
           
           <div 
             onClick={() => setShowStarredList(true)}
             className="bg-blue-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group"
           >
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.starred}</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium group-hover:text-blue-600 transition-colors">已加星 &gt;</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-400 group-hover:scale-110 transition-transform">
                  <Star size={18} className="fill-blue-100 text-blue-500" />
              </div>
           </div>
           
           <div className="bg-purple-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-purple-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.accuracy}%</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">正确率</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-400">
                  <TrendingUp size={18} />
              </div>
           </div>
           
           <div className="bg-green-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-green-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.today}</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">今日已学</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-green-400">
                  <Clock size={18} />
              </div>
           </div>
        </div>

        {/* 单词列表头 - 修改布局 */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">单词列表</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setSortMode('default')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            sortMode === 'default' 
                            ? 'bg-black text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Shuffle size={12} /> 乱序
                    </button>
                    <button 
                        onClick={() => setSortMode('az')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            sortMode === 'az' 
                            ? 'bg-black text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ArrowDownAZ size={14} /> A-Z
                    </button>
                </div>
            </div>

            {/* 重置进度按钮移到此处 */}
            <button 
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg text-xs font-bold"
                title="重置本词书进度"
            >
                <RotateCcw size={14} />
                <span>重置进度</span>
            </button>
        </div>

        {/* 列表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 h-48 animate-pulse border border-gray-100"></div>
                ))
           ) : wordLists.length > 0 ? (
               wordLists.map((listWords, index) => {
                   const learnedInList = listWords.filter(w => w.isLearned).length;
                   const progressPercent = (learnedInList / listWords.length) * 100;
                   const hasStarted = learnedInList > 0;

                   return (
                   <div 
                      key={index} 
                      className={`rounded-2xl p-6 border transition-all duration-300 ${
                          hasStarted 
                          ? 'bg-white border-gray-100 shadow-sm hover:shadow-md' 
                          : 'bg-[#fafafa] border-gray-100 shadow-sm opacity-90 hover:opacity-100 hover:bg-white hover:shadow-md'
                      }`}
                   >
                      <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                          <div className="flex items-center gap-3">
                              <h3 className={`font-bold text-lg ${hasStarted ? 'text-gray-800' : 'text-gray-600'}`}>List {index + 1}</h3>
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full transition-all duration-500 ${hasStarted ? 'bg-gray-900' : 'bg-gray-300'}`}
                                    style={{ width: `${progressPercent}%` }}
                                 />
                              </div>
                          </div>
                          <span className={`text-xs ${hasStarted ? 'text-gray-500 font-bold' : 'text-gray-400'}`}>
                              {learnedInList}/{listWords.length} 词
                          </span>
                      </div>
                      
                      {/* 单词预览区域 */}
                      <div className="flex gap-2 flex-wrap mb-6 h-12 overflow-hidden content-start">
                          <span className="text-xs text-gray-400 mb-1 w-full block">预览单词</span>
                          {listWords.slice(0, 3).map(w => (
                              <span key={w.id} className={`px-3 py-1 rounded text-xs border ${
                                  hasStarted 
                                  ? 'bg-gray-50 text-gray-600 border-gray-100' 
                                  : 'bg-white text-gray-400 border-gray-100'
                              }`}>
                                  {w.en}
                              </span>
                          ))}
                          <button 
                            onClick={() => setViewingListIndex(index)} 
                            className="text-xs text-gray-400 hover:text-gray-600 px-1"
                          >
                            查看全部
                          </button>
                      </div>
    
                      {/* 功能按钮组：跳转不同模式 */}
                      <div className="grid grid-cols-4 gap-3">
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_FLASHCARD, listWords)}
                           className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                               hasStarted 
                               ? 'bg-gray-50 hover:bg-black hover:text-white text-gray-600' 
                               : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-100'
                           }`}
                         >
                             单词闪过
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_DICTATION, listWords)}
                           className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                               hasStarted 
                               ? 'bg-gray-50 hover:bg-black hover:text-white text-gray-600' 
                               : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-100'
                           }`}
                         >
                             听写大师
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_CHOICE, listWords)}
                           className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                               hasStarted 
                               ? 'bg-gray-50 hover:bg-black hover:text-white text-gray-600' 
                               : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-100'
                           }`}
                         >
                             词义选择
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_MATCH, listWords)}
                           className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                               hasStarted 
                               ? 'bg-gray-50 hover:bg-black hover:text-white text-gray-600' 
                               : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-100'
                           }`}
                         >
                             连连看
                         </button>
                      </div>
                   </div>
                   );
               })
           ) : (
             <div className="col-span-full py-12 text-center text-gray-400">
               该词书暂无单词数据
             </div>
           )}
        </div>
      </div>

      {/* 查看全部单词弹窗 */}
      {viewingListIndex !== null && (
        <WordListModal
          listName={`List ${viewingListIndex + 1}`}
          words={getWordsForList(viewingListIndex)}
          onClose={() => setViewingListIndex(null)}
        />
      )}

      {/* 重置进度确认弹窗 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-2">确认重置进度?</h3>
                <p className="text-gray-500 text-sm mb-6">
                    这将清除您在这本书中的所有学习记录（包括已学、标星、错题等），此操作无法撤销。
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleResetProgress}
                        className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm shadow-md shadow-red-200"
                    >
                        确认重置
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;
