
import React, { useState, useEffect } from 'react';
import { Book, ViewState, Word } from '../types';
import { ArrowLeft, Zap, Clock, Star, TrendingUp, ArrowDownAZ, Shuffle } from 'lucide-react';
import WordListModal from './WordListModal';
import { fetchWordDetail, fetchStudyDetail } from '../services/api';

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
  
  // 学习统计状态
  const [stats, setStats] = useState({
      learned: 0,
      starred: 0,
      accuracy: 0,
      today: 0
  });

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
  }, [book.id]);

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
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.learned}</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">已学习</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-red-400">
                  <Clock size={18} />
              </div>
           </div>
           
           <div className="bg-blue-50 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm border border-blue-100">
              <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 leading-none">{stats.starred}</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">已加星</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-400">
                  <Star size={18} />
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

        {/* 单词列表头 */}
        <div className="flex items-center justify-between mb-6">
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

                   return (
                   <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                          <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg text-gray-800">List {index + 1}</h3>
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-gray-800 transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }}
                                 />
                              </div>
                          </div>
                          <span className="text-xs text-gray-400">{learnedInList}/{listWords.length} 词</span>
                      </div>
                      
                      {/* 单词预览区域 */}
                      <div className="flex gap-2 flex-wrap mb-6 h-12 overflow-hidden content-start">
                          <span className="text-xs text-gray-400 mb-1 w-full block">预览单词</span>
                          {listWords.slice(0, 3).map(w => (
                              <span key={w.id} className="bg-gray-50 text-gray-600 px-3 py-1 rounded text-xs border border-gray-100">
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
                           className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                         >
                             单词闪过
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_DICTATION, listWords)}
                           className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                         >
                             听写大师
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_CHOICE, listWords)}
                           className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
                         >
                             词义选择
                         </button>
                         <button 
                           onClick={() => onSelectMode(ViewState.MODE_MATCH, listWords)}
                           className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold text-gray-600 transition-all active:scale-95"
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
    </div>
  );
};

export default BookDetail;
