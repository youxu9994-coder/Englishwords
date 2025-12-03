
import React, { useState, useEffect } from 'react';
import { ViewState, Word } from '../types';
import { Volume2, Star, ChevronLeft, ChevronRight, RotateCw, Trophy, BookOpen, Sparkles, PenLine } from 'lucide-react';
import StudyHeader from './StudyHeader';
import { updateStudyStatus } from '../services/api';

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
  
  // 笔记状态
  const [wordNotes, setWordNotes] = useState<Map<string, string>>(new Map()); // 本地笔记存储
  const [isEditingNote, setIsEditingNote] = useState(false); // 是否处于编辑笔记模式
  const [noteInput, setNoteInput] = useState(''); // 笔记输入内容

  // 学习状态追踪 (本次会话已标记为已学的单词ID)
  const [learnedSessionIds, setLearnedSessionIds] = useState<Set<string>>(new Set());

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false); // 控制飞出动画期间禁止交互

  const currentWord = words && words.length > 0 ? words[currentIndex] : undefined;
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  // 初始化数据
  useEffect(() => {
    if (!words || words.length === 0) return;
    
    // 初始化收藏状态
    const initialStars = new Set(words.filter(w => w && w.isStarred).map(w => w.id));
    setStarredWords(initialStars);
    
    // 初始化笔记状态
    const initialNotes = new Map<string, string>();
    words.forEach(w => {
        if (w.note) initialNotes.set(w.id, w.note);
    });
    setWordNotes(initialNotes);
    
    // 重置会话学习记录
    setLearnedSessionIds(new Set());

  }, [words]);

  // 当切换单词时，重置笔记编辑状态并更新输入框
  useEffect(() => {
    if (currentWord) {
        setNoteInput(wordNotes.get(currentWord.id) || '');
        setIsEditingNote(false);
    }
  }, [currentIndex, currentWord, wordNotes]);

  // 检查并标记当前单词为已学
  const checkAndMarkLearned = () => {
    if (!currentWord) return;

    // 如果服务端数据已经是已学，或者本次会话已经标记过，则跳过
    if (currentWord.isLearned || learnedSessionIds.has(currentWord.id)) {
        return;
    }

    // 更新本地会话记录，防止重复调用
    setLearnedSessionIds(prev => new Set(prev).add(currentWord.id));

    // 调用API
    const wordIdNum = Number(currentWord.id);
    if (!isNaN(wordIdNum)) {
        updateStudyStatus([{
            wordId: wordIdNum,
            updateModules: [1], // 1代表更新已学习状态
            isLearned: true
        }]).catch(error => {
            console.error("Failed to mark word as learned:", error);
            // 如果API调用失败，可以选择从learnedSessionIds中移除，以便下次重试
            // 但为了避免网络不稳定时的频繁请求，这里暂不做移除
        });
    }
  };

  // 保存笔记
  const handleSaveNote = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentWord) return;
      
      const noteContent = noteInput.trim();
      const newNotes = new Map(wordNotes);
      
      // 更新本地状态
      if (noteContent) {
          newNotes.set(currentWord.id, noteContent);
      } else {
          newNotes.delete(currentWord.id);
      }
      setWordNotes(newNotes);
      setIsEditingNote(false);
      
      // 调用API保存笔记 (仅当笔记不为空时)
      if (noteContent) {
          try {
              const wordIdNum = Number(currentWord.id);
              if (!isNaN(wordIdNum)) {
                  await updateStudyStatus([{
                      wordId: wordIdNum,
                      updateModules: [3], // 3代表更新学习笔记
                      learningNotes: noteContent
                  }]);
              }
          } catch (error) {
              console.error("Failed to save note:", error);
              // 可以在这里添加 Toast 提示用户保存失败
          }
      }
  };

  // 切换收藏
  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    const id = currentWord.id;
    const wordIdNum = Number(id);

    const isStarred = starredWords.has(id);
    const newStatus = !isStarred;

    // 乐观UI更新
    setStarredWords(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });

    // 调用API更新服务端状态
    try {
        if (!isNaN(wordIdNum)) {
            await updateStudyStatus([{
                wordId: wordIdNum,
                updateModules: [2], // 2代表更新标星状态
                isStarred: newStatus
            }]);
        }
    } catch (error) {
        console.error("Failed to sync star status:", error);
        // 如果失败，回滚状态
        setStarredWords(prev => {
             const next = new Set(prev);
             if (isStarred) next.add(id);
             else next.delete(id);
             return next;
        });
    }
  };

  // Safe access for isStarred
  const isStarred = currentWord ? starredWords.has(currentWord.id) : false;
  // Get current note
  const currentNote = currentWord ? wordNotes.get(currentWord.id) : undefined;

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // 如果正在编辑笔记，不响应快捷键
        if (isCompleted || isAnimating || isEditingNote) return;
        
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
  }, [currentIndex, isCompleted, isAnimating, isEditingNote]);

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
    
    // 切换前标记当前单词为已学
    checkAndMarkLearned();

    if (currentIndex < words.length - 1) {
      animateSwitch('next');
    } else {
      setIsCompleted(true);
    }
  };

  // 切换上一个单词
  const handlePrev = () => {
    if (isAnimating || currentIndex === 0) return;
    
    // 切换前标记当前单词为已学
    checkAndMarkLearned();

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
    setLearnedSessionIds(new Set()); // 重置会话记录，允许重新标记
  };

  // --- 统一的拖拽处理逻辑 (鼠标 + 触摸) ---

  const handleDragStart = (clientX: number) => {
      // 编辑笔记时禁止拖拽
      if (isAnimating || isCompleted || isEditingNote) return;
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
      // 检查是否点击了输入框或按钮，如果是则不触发拖拽
      if ((e.target as HTMLElement).closest('input, textarea, button')) return;
      
      e.preventDefault(); 
      handleDragStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => {
      if (isDragging) handleDragEnd();
  };

  // 渲染释义：尝试提取词性 (v., n., adj.)
  const renderDefinitionWithPOS = (word: Word) => {
      // 优先使用 API 提供的 pos 字段
      if (word.pos) {
          return (
              <div className="flex flex-col items-center gap-1 text-gray-800">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-serif italic font-bold">
                      {word.pos}.
                  </span>
                  <span className="leading-snug text-center font-medium text-xs">{word.cn}</span>
              </div>
          );
      }
      
      // 回退逻辑：尝试从中文释义中解析
      const match = word.cn.match(/^([a-z]+\.)\s+(.*)/);
      if (match) {
          return (
              <div className="flex flex-col items-center gap-1 text-gray-800">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-serif italic font-bold">
                      {match[1]}
                  </span>
                  <span className="leading-snug text-center font-medium text-xs">{match[2]}</span>
              </div>
          );
      }
      return <div className="text-xs text-gray-800 leading-snug font-medium text-center">{word.cn}</div>;
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
  if (!currentWord && !isCompleted) return null;

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
        <div className="w-full max-w-[280px] mx-auto relative mb-3 min-h-[210px] flex-grow-0 aspect-[4/3]">
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
                    // 防止在拖拽结束时触发翻转，也防止在编辑笔记时触发翻转
                    // 严格限制点击判断：只有位移非常小 (<2) 时才认为是点击
                    if (!isDragging && Math.abs(dragOffset) < 2 && !isEditingNote && !(e.target as HTMLElement).closest('button, textarea')) {
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
                    <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-[20px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center justify-center p-3 group select-none">
                         
                        <div className="absolute top-4 right-4 z-20" onClick={toggleStar}>
                             <button className="text-gray-300 hover:text-yellow-400 hover:scale-110 transition-all p-1.5">
                                <Star size={18} className={isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} strokeWidth={2} />
                             </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight text-center">
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

                        <div className="flex-1 overflow-y-auto custom-scroll p-3 flex flex-col items-center justify-start min-h-0 gap-2">
                            
                            {/* 头部：单词与音标 */}
                            <div className="text-center mt-1 shrink-0">
                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                    <h2 className="text-lg font-black text-gray-900">{currentWord.en}</h2>
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
                            <div className="w-full shrink-0">
                                {renderDefinitionWithPOS(currentWord)}
                            </div>

                            {/* 例句 */}
                            {currentWord.example && (
                                <div className="w-full bg-gray-50 rounded-lg p-2 text-left border border-gray-100 shrink-0">
                                     <div className="flex items-start justify-between gap-2 mt-0.5">
                                         <p className="text-[10px] text-gray-800 leading-snug font-medium mt-0.5">
                                            {highlightWord(currentWord.example, currentWord.en)}
                                         </p>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); playAudio(currentWord.example || ''); }}
                                            className="text-gray-400 hover:text-black transition-colors shrink-0"
                                         >
                                            <Volume2 size={12} />
                                         </button>
                                     </div>
                                     <p className="text-gray-500 text-[10px] mt-1">
                                         {currentWord.example_cn}
                                     </p>
                                </div>
                            )}

                            {/* 笔记区域 */}
                            <div className="w-full mt-auto pt-1 pb-1">
                                {isEditingNote ? (
                                    <div className="relative animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <textarea
                                            value={noteInput}
                                            onChange={(e) => setNoteInput(e.target.value)}
                                            placeholder="写下你的理解..."
                                            className="w-full h-16 p-2 text-xs bg-gray-50 border border-black rounded-lg outline-none resize-none text-gray-700"
                                            autoFocus
                                        />
                                        <div className="flex justify-end mt-1">
                                             <button 
                                                onClick={handleSaveNote}
                                                className="px-3 py-1 bg-black text-white text-[10px] rounded-full font-bold hover:bg-gray-800"
                                             >
                                                完成
                                             </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full" onClick={e => e.stopPropagation()}>
                                        {currentNote ? (
                                            <div 
                                                onClick={() => setIsEditingNote(true)}
                                                className="w-full bg-yellow-50 border border-yellow-100 rounded-lg p-2 relative group cursor-pointer hover:bg-yellow-100/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-1 mb-1">
                                                    <PenLine size={10} className="text-yellow-600" />
                                                    <span className="text-[10px] font-bold text-yellow-600">笔记</span>
                                                </div>
                                                <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-tight">{currentNote}</p>
                                                <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <PenLine size={10} className="text-gray-400" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsEditingNote(true)}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full text-[10px] text-gray-500 hover:bg-gray-100 hover:text-black transition-colors border border-gray-100"
                                            >
                                                <PenLine size={10} />
                                                <span className="font-bold">记笔记</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 底部导航按钮区域 - 限制宽度 */}
        <div className="flex items-center justify-between gap-3 w-full max-w-[280px] mx-auto">
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
