
import React, { useState } from 'react';
import { Word, ViewState } from '../types';
import { ArrowLeft, Trash2, Volume2, Star, GalleryVerticalEnd, FileEdit, ListChecks, Grid3X3 } from 'lucide-react';
import { updateStudyStatus } from '../services/api';

interface StarredBookProps {
  words: Word[];
  onBack: () => void;
  onUnstar: (wordId: string) => void;
  onClearAll: () => void;
  onSelectMode: (mode: ViewState, words: Word[]) => void;
}

const StarredBook: React.FC<StarredBookProps> = ({ words, onBack, onUnstar, onClearAll, onSelectMode }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const playAudio = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  // 处理单个取消收藏
  const handleUnstar = async (word: Word) => {
    // 乐观更新：立即通知父组件移除
    onUnstar(word.id);

    // 调用接口
    try {
      const wordIdNum = Number(word.id);
      if (!isNaN(wordIdNum)) {
        await updateStudyStatus([{
          wordId: wordIdNum,
          updateModules: [2], // 2-标星
          isStarred: false
        }]);
      }
    } catch (error) {
      console.error("Failed to unstar word:", error);
      // 实际场景可能需要回滚，但这里简化处理
    }
  };

  // 处理清空收藏
  const handleClearAll = async () => {
    setShowClearConfirm(false);
    
    // 构造批量请求
    const requests = words.map(w => {
        const wordIdNum = Number(w.id);
        return !isNaN(wordIdNum) ? {
            wordId: wordIdNum,
            updateModules: [2],
            isStarred: false
        } : null;
    }).filter(Boolean) as any[];

    if (requests.length === 0) {
        onClearAll();
        return;
    }

    // 乐观更新
    onClearAll();

    try {
        await updateStudyStatus(requests);
    } catch (error) {
        console.error("Failed to clear all starred words:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* 顶部黑色导航栏 */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold">返回</span>
        </button>
        
        <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
          星标单词本
        </h1>
        
        <div className="w-16"></div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-32">
        {/* 顶部操作栏 */}
        <div className="flex justify-between items-center mb-6">
            <div className="text-gray-500 text-sm font-bold">
                共 {words.length} 个单词
            </div>
            
            {words.length > 0 && (
                <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                    <Trash2 size={14} />
                    取消所有星标
                </button>
            )}
        </div>

        {/* 单词列表 */}
        {words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {words.map(word => (
                    <div key={word.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-gray-900">{word.en}</h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); playAudio(word.en); }}
                                    className="text-gray-400 hover:text-black transition-colors"
                                >
                                    <Volume2 size={16} />
                                </button>
                            </div>
                            <button 
                                onClick={() => handleUnstar(word)}
                                className="text-yellow-400 hover:scale-110 transition-transform"
                            >
                                <Star size={20} className="fill-yellow-400" />
                            </button>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-start gap-2">
                                {word.pos && (
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-serif mt-0.5">
                                        {word.pos}.
                                    </span>
                                )}
                                <p className="text-sm text-gray-600 font-medium leading-snug">{word.cn}</p>
                            </div>
                            <div className="text-xs text-gray-400 font-serif italic pl-1">
                                {word.phonetic}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Star size={48} className="mb-4 text-gray-200" />
                <p>暂无星标单词</p>
                <button onClick={onBack} className="mt-4 text-blue-500 font-bold hover:underline">去背单词</button>
            </div>
        )}
      </div>

      {/* 底部悬浮学习模式栏 */}
      {words.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-gray-100 p-2 flex gap-2 z-40 animate-slide-up">
              <button 
                onClick={() => onSelectMode(ViewState.MODE_FLASHCARD, words)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-full hover:bg-gray-50 transition-colors group"
              >
                  <GalleryVerticalEnd size={20} className="text-gray-600 group-hover:text-black mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-black">单词闪过</span>
              </button>
              <div className="w-px bg-gray-100 my-2"></div>
              <button 
                onClick={() => onSelectMode(ViewState.MODE_DICTATION, words)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-full hover:bg-gray-50 transition-colors group"
              >
                  <FileEdit size={20} className="text-gray-600 group-hover:text-black mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-black">听写大师</span>
              </button>
              <div className="w-px bg-gray-100 my-2"></div>
              <button 
                onClick={() => onSelectMode(ViewState.MODE_CHOICE, words)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-full hover:bg-gray-50 transition-colors group"
              >
                  <ListChecks size={20} className="text-gray-600 group-hover:text-black mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-black">释义选择</span>
              </button>
              <div className="w-px bg-gray-100 my-2"></div>
              <button 
                onClick={() => onSelectMode(ViewState.MODE_MATCH, words)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-full hover:bg-gray-50 transition-colors group"
              >
                  <Grid3X3 size={20} className="text-gray-600 group-hover:text-black mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-black">连连看</span>
              </button>
          </div>
      )}

      {/* 清空确认弹窗 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-2">确认清空星标?</h3>
                <p className="text-gray-500 text-sm mb-6">
                    这将取消本书中所有单词的星标状态，此操作无法撤销。
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleClearAll}
                        className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm shadow-md shadow-red-200"
                    >
                        确认清空
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StarredBook;
