
import React, { useState, useEffect } from 'react';
import { ViewState, Word } from '../types';
import { Volume2, Star, ChevronLeft, ChevronRight, RotateCw, Trophy, BookOpen, Sparkles } from 'lucide-react';
import StudyHeader from './StudyHeader';

interface FlashcardsProps {
  words: Word[];
  onExit: () => void;
  onSwitchMode: (mode: ViewState) => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ words, onExit, onSwitchMode }) => {
  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(0); // 当前单词索引
  const [isFlipped, setIsFlipped] = useState(false);   // 卡片是否翻转
  const [isCompleted, setIsCompleted] = useState(false); // 是否完成所有学习
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set()); // 本地收藏状态

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false); // 控制飞出动画期间禁止交互

  const currentWord = words && words.length > 0 ? words[currentIndex] : undefined;
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  // 初始化收藏状态
  useEffect(() => {
    if (!words || words.length === 0) return;
    const initialStars = new Set(words.filter(w => w && w.isStarred).map(w => w.id));
    setStarredWords(initialStars);
  }, [words]);

  // 切换收藏
  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    const id = currentWord.id;
    setStarredWords(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  // Safe access for isStarred
  const isStarred = currentWord ? starredWords.has(currentWord.id) : false;

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isCompleted || isAnimating) return;
        switch(e.key) {
            case 'ArrowLeft':
                handlePrev();
                break;
            case 'ArrowRight':
                handleNext();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                setIsFlipped(prev => !prev);
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isCompleted, isAnimating]);

  // 播放发音
  const playAudio = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // 切换下一个单词
  const handleNext = () => {
    if (isAnimating) return;
    if (currentIndex < words.length - 1) {
      animateSwitch('next');
    } else {
      setIsCompleted(true);
    }
  };

  // 切换上一个单词
  const handlePrev = () => {
    if (isAnimating || currentIndex === 0) return;
    animateSwitch('prev');
  };

  // 执行切换动画逻辑
  const animateSwitch = (direction: 'next' | 'prev') => {
      setIsAnimating(true);
      
      // 如果不是拖拽触发的（点击按钮触发），先执行一个飞出动画
      if (!isDragging && dragOffset === 0) {
          setDragOffset(direction === 'next' ? -500 : 500); // 注意：Next是往左飞(-500)，Prev是往右飞(500)
      }

      setTimeout(() => {
          setIsFlipped(false);
          setDragOffset(0); // 重置位置
          setIsAnimating(false);
          
          if (direction === 'next') {
              setCurrentIndex(curr => curr + 1);
          } else {
              setCurrentIndex(curr => curr - 1);
          }
      }, 300); // 这里的300ms对应CSS transition duration
  };

  // 重新开始
  const handleRestart = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setDragOffset(0);
  };

  // --- 统一的拖拽处理逻辑 (鼠标 + 触摸) ---

  const handleDragStart = (clientX: number) => {
      if (isAnimating || isCompleted) return;
      setIsDragging(true);
      setStartX(clientX);
  };

  const handleDragMove = (clientX: number) => {
      if (!isDragging) return;
      // 增加阻尼系数 0.6，让拖动更"重"一点，不会乱飞
      const currentOffset = (clientX - startX) * 0.6;
      setDragOffset(currentOffset);
  };

  const handleDragEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const threshold = 20; // 降低触发阈值，使切换更灵敏 (原为40)

      if (dragOffset > threshold) {
          // 向右拖动 (Positive) -> 上一个 (Prev)
          handlePrev();
          setDragOffset(500); // 飞出距离
      } else if (dragOffset < -threshold) {
          // 向左拖动 (Negative) -> 下一个 (Next)
          handleNext();
          setDragOffset(-500); // 飞出距离
      } else {
          // 未达到阈值，回弹
          setDragOffset(0);
      }
  };

  // 触摸事件适配
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.targetTouches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.targetTouches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  // 鼠标事件适配
  const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault(); // 关键修复：防止浏览器默认拖拽行为（如选中文本或拖动图片），解决拖拽不灵敏问题
      handleDragStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => {
      if (isDragging) handleDragEnd();
  };

  // 渲染释义：尝试提取词性 (v., n., adj.)
  const renderDefinitionWithPOS = (text: string) => {
      const match = text.match(/^([a-z]+\.)\s+(.*)/);
      if (match) {
          return (
              <div className="flex flex-col items-center gap-1 text-sm text-gray-800">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-serif italic font-bold">
                      {match[1]}
                  </span>
                  <span className="leading-snug text-center font-medium">{match[2]}</span>
              </div>
          );
      }
      return <div className="text-sm text-gray-800 leading-snug font-medium text-center">{text}</div>;
  };

  // 高亮例句中的单词
  const highlightWord = (sentence: string, word: string) => {
      if (!sentence || !word) return sentence;
      const parts = sentence.split(new RegExp(`(${word}\\w*)`, 'gi'));
      return (
          <>
            {parts.map((part, i) => 
                part.toLowerCase().startsWith(word.toLowerCase()) 
                ? <span key={i} className="text-red-500 font-bold">{part}</span> 
                : part
            )}
          </>
      );
  };

  // 完成页视图
  if (isCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <StudyHeader currentMode={ViewState.MODE_FLASHCARD} onSwitchMode={onSwitchMode} onExit={onExit} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-yellow-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-100 relative z-10">
              <Trophy size={48} className="text-yellow-500 fill-yellow-500" />
            </div>
            <div className="absolute -top-2 -right-2">
                <Sparkles className="text-yellow-400 animate-bounce" size={24} />
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">太棒了!</h2>
          <p className="text-gray-500 mb-10 text-center max-w-xs font-medium text-sm">
            您已完成本组单词的学习<br/>今天的进步看得见！
          </p>
          
          <div className="flex flex-col w-full max-w-[240px] gap-3">
             <button 
              onClick={handleRestart}
              className="w-full py-3 bg-black text-white rounded-xl font-bold shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group text-sm"
            >
              <RotateCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              再学一遍
            </button>
            <button 
              onClick={onExit}
              className="w-full py-3 bg-white text-gray-700 border-2 border-gray-100 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <BookOpen size={16} />
              返回单词表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check
  if (!currentWord) return null;

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD]">
      <StudyHeader currentMode={ViewState.MODE_FLASHCARD} onSwitchMode={onSwitchMode} onExit={onExit} />

      {/* 主内容区域 - 统一样式 */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full p-4 md:p-6 pb-32 justify-start overflow-hidden pt-8">
        
        {/* 进度条区域 - 统一样式 */}
        <div className="w-full max-w-xl mx-auto mb-2">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{currentIndex + 1} / {words.length}</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                className="bg-gray-900 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>

        {/* 卡片容器 */}
        <div className="w-full max-w-sm mx-auto relative mb-4 min-h-[200px] flex-grow-0 aspect-[5/4]">
            {/* 卡片堆叠装饰 */}
            <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] bg-gray-900/5 rounded-[20px] -z-10 transform rotate-2"></div>
            <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] bg-gray-900/5 rounded-[20px] -z-10 transform rotate-1"></div>

            {/* 核心交互区域 (3D翻转 + 拖拽动画) */}
            <div 
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onClick={(e) => {
                    // 防止在拖拽结束时触发翻转
                    // 严格限制点击判断：只有位移非常小 (<2) 时才认为是点击
                    if (!isDragging && Math.abs(dragOffset) < 2) {
                        setIsFlipped(!isFlipped);
                    }
                }}
                className="w-full h-full relative cursor-grab active:cursor-grabbing [perspective:1000px] z-10 select-none touch-none"
                style={{
                    // 动态应用拖拽位移和旋转
                    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
                    // 渐变透明度：拖动距离 divisor 设为 800 (原500)，使卡片在拖动时消失得更慢
                    opacity: Math.max(1 - Math.abs(dragOffset) / 800, 0)
                }}
            >
                <div className={`w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                    
                    {/* --- 正面：极简模式 --- */}
                    <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-[20px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center justify-center p-4 group select-none">
                         
                        <div className="absolute top-4 right-4 z-20" onClick={toggleStar}>
                             <button className="text-gray-300 hover:text-yellow-400 hover:scale-110 transition-all p-1.5">
                                <Star size={18} className={isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} strokeWidth={2} />
                             </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tight text-center">
                                {currentWord.en}
                            </h2>
                            <button 
                                onClick={(e) => { e.stopPropagation(); playAudio(currentWord.en); }} 
                                className="text-gray-400 hover:text-black transition-colors p-1"
                            >
                                <Volume2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* --- 背面：详细模式 --- */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-[20px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden select-none">
                         <div className="absolute top-4 right-4 z-20" onClick={toggleStar}>
                             <button className="text-gray-300 hover:text-yellow-400 hover:scale-110 transition-all p-1.5">
                                <Star size={18} className={isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} strokeWidth={2} />
                             </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scroll p-4 flex flex-col items-center justify-center min-h-0">
                            
                            {/* 头部：单词与音标 */}
                            <div className="text-center mb-3">
                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                    <h2 className="text-xl font-black text-gray-900">{currentWord.en}</h2>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); playAudio(currentWord.en); }} 
                                        className="text-gray-400 hover:text-black transition-colors"
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                </div>
                                <div className="text-gray-500 font-serif italic text-xs">{currentWord.phonetic}</div>
                            </div>

                            {/* 释义 */}
                            <div className="w-full mb-4">
                                {renderDefinitionWithPOS(currentWord.cn)}
                            </div>

                            {/* 例句 */}
                            {currentWord.example && (
                                <div className="w-full bg-gray-50 rounded-lg p-3 text-left border border-gray-100 mt-auto">
                                     <div className="flex items-start justify-between gap-2 mt-0.5">
                                         <p className="text-xs text-gray-800 leading-snug font-medium mt-0.5">
                                            {highlightWord(currentWord.example, currentWord.en)}
                                         </p>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); playAudio(currentWord.example || ''); }}
                                            className="text-gray-400 hover:text-black transition-colors shrink-0"
                                         >
                                            <Volume2 size={14} />
                                         </button>
                                     </div>
                                     <p className="text-gray-500 text-[10px] mt-1">
                                         {currentWord.example_cn}
                                     </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 底部导航按钮区域 - 限制宽度 */}
        <div className="flex items-center justify-between gap-3 w-full max-w-sm mx-auto">
             <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 font-bold hover:text-black hover:border-black hover:shadow-md transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400 disabled:shadow-none text-xs"
            >
                <ChevronLeft size={16} strokeWidth={3} />
                <span className="uppercase tracking-wider">Prev</span>
            </button>
            <button 
                onClick={handleNext}
                className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1 shadow-md shadow-gray-200 text-xs"
            >
                <span className="uppercase tracking-wider">Next</span>
                <ChevronRight size={16} strokeWidth={3} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
