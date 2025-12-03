
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Word } from '../types';
import { HelpCircle, Check, X, Star, RotateCcw, LogOut } from 'lucide-react';
import StudyHeader from './StudyHeader';
import { updateStudyStatus, UpdateStudyStatusRequest } from '../services/api';

interface DictationProps {
  words: Word[];
  onExit: () => void;
  onSwitchMode: (mode: ViewState) => void;
}

// 记录每次听写尝试的数据结构
interface Attempt {
  wordId: string;
  isCorrect: boolean;
  userAnswer: string;
}

const Dictation: React.FC<DictationProps> = ({ words, onExit, onSwitchMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0); // 当前单词索引
  const [input, setInput] = useState(''); // 用户输入内容
  const [showHint, setShowHint] = useState(false); // 是否显示提示
  const [showErrorAnswer, setShowErrorAnswer] = useState(false); // 是否显示错误时的正确答案
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle'); // 输入框状态
  const [attempts, setAttempts] = useState<Attempt[]>([]); // 答题记录
  const [isCompleted, setIsCompleted] = useState(false); // 是否完成
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set()); // 错题本/收藏本

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  
  // Safe access to current word
  const currentWord = words && words.length > 0 ? words[currentIndex] : undefined;

  // 实时统计数据
  const correctCount = attempts.filter(a => a.isCorrect).length;
  const wrongCount = attempts.filter(a => !a.isCorrect).length;
  const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

  // 初始化错题本状态
  useEffect(() => {
    if (!words) return;
    const initialStars = new Set(words.filter(w => w && w.isStarred).map(w => w.id));
    setStarredWords(initialStars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换单词时重置状态
  useEffect(() => {
    if (!isCompleted && currentWord) {
      resetState();
      // playAudio(currentWord.en); // 移除自动播放
    }
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isCompleted, currentWord]);

  // 监听完成状态，批量上传结果
  useEffect(() => {
    if (isCompleted && attempts.length > 0) {
      const requests: UpdateStudyStatusRequest[] = [];
      
      attempts.forEach(attempt => {
        const wordIdNum = Number(attempt.wordId);
        // 确保ID是有效数字（过滤掉模拟数据的ID）
        if (!isNaN(wordIdNum)) {
           requests.push({
             wordId: wordIdNum,
             updateModules: [2, 4], // 2-标星, 4-正确率
             // 错误时标星(true)，正确时不标星(false)
             isStarred: !attempt.isCorrect,
             // 累加正确/错误次数
             correctCount: attempt.isCorrect ? 1 : 0,
             incorrectCount: attempt.isCorrect ? 0 : 1
           });
        }
      });

      if (requests.length > 0) {
        updateStudyStatus(requests).catch(err => {
          console.error("Failed to batch save dictation results:", err);
        });
      }
    }
  }, [isCompleted, attempts]);

  // 清除定时器
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 重置输入状态
  const resetState = () => {
    setInput('');
    setShowHint(false);
    setShowErrorAnswer(false);
    setStatus('idle');
    setTimeout(() => inputRef.current?.focus(), 50); // 自动聚焦
  };

  // 播放音频
  const playAudio = (text: string, onEnd?: () => void) => {
    // 停止之前的播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd; // Handle error gracefully
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // 移动到下一个单词
  const moveToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // 记录答题结果，错题自动加入收藏
  const recordAttempt = (isCorrect: boolean, answer: string) => {
    if (!currentWord) return;
    // 检查该单词是否已记录过（只记录第一次尝试的结果）
    const hasRecorded = attempts.some(a => a.wordId === currentWord.id);
    if (hasRecorded) return;

    setAttempts(prev => [...prev, { wordId: currentWord.id, isCorrect, userAnswer: answer }]);
    if (!isCorrect) setStarredWords(prev => new Set(prev).add(currentWord.id));
  };

  // 提交答案处理
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status === 'correct' || !currentWord) return;

    const cleanInput = input.trim().toLowerCase();
    const cleanTarget = currentWord.en.toLowerCase();

    if (cleanInput === cleanTarget) {
      // 2. 答对：显示绿色状态，播放读音，延时跳转
      setStatus('correct');
      recordAttempt(true, input);
      playAudio(currentWord.en);
      timerRef.current = window.setTimeout(moveToNext, 800);
    } else {
      // 3. 答错：显示红色状态，清除输入，显示正确答案
      setStatus('wrong');
      recordAttempt(false, input);
      setInput('');
      inputRef.current?.focus();
      
      // 显示正确答案
      setShowErrorAnswer(true);

      // 播放读音，读音结束后隐藏答案并重置状态
      playAudio(currentWord.en, () => {
        setShowErrorAnswer(false);
        setStatus(prev => prev === 'wrong' ? 'idle' : prev);
      });
      
      // Clear legacy timer logic if any
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 重新开始测试
  const handleRestart = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setAttempts([]);
    resetState();
  };

  // 提前结束测试
  const handleEndTest = () => {
      setIsCompleted(true);
  };

  // 切换单词收藏状态
  const toggleStar = (wordId: string) => {
    setStarredWords(prev => {
      const next = new Set(prev);
      next.has(wordId) ? next.delete(wordId) : next.add(wordId);
      return next;
    });
  };

  // 如果单词未加载或不存在，显示加载状态或返回null
  if (!currentWord && !isCompleted) return null;

  // 结果统计页面
  if (isCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFDFD]">
        <StudyHeader currentMode={ViewState.MODE_DICTATION} onSwitchMode={onSwitchMode} onExit={onExit} />
        
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 max-w-3xl mx-auto w-full animate-fade-in pb-24">
           <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ring-gray-50">
              <Check size={40} className="text-white" strokeWidth={3} />
           </div>
           <h2 className="text-3xl font-extrabold text-gray-900 mb-2">听写完成!</h2>
           <p className="text-gray-500 mb-10 font-medium">收获满满的一次练习</p>

           {/* 统计数据卡片 */}
           <div className="grid grid-cols-3 gap-4 w-full mb-10">
              {[
                  { label: '正确', val: correctCount, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: '错误', val: wrongCount, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: '正确率', val: `${accuracy}%`, color: 'text-gray-800', bg: 'bg-gray-100' }
              ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} p-6 rounded-3xl flex flex-col items-center justify-center`}>
                      <span className={`text-3xl md:text-4xl font-black ${stat.color} mb-1`}>{stat.val}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</span>
                  </div>
              ))}
           </div>

           {/* 单词回顾列表 (包含所有尝试的单词) */}
           <div className="w-full bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden mb-8 flex-1 min-h-[200px]">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800">单词回顾</h3>
                 <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{attempts.length} words</span>
              </div>
              
              <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scroll">
                 {attempts.length === 0 ? (
                   <div className="p-12 text-center text-gray-400 font-medium">No words attempted yet.</div>
                 ) : (
                   attempts.map((attempt, idx) => {
                     const word = words.find(w => w.id === attempt.wordId);
                     if (!word) return null;
                     const isCorrect = attempt.isCorrect;
                     
                     return (
                       <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-4">
                             {/* 状态图标：绿色对号 或 红色叉号 */}
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                isCorrect ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                             }`}>
                                {isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                             </div>
                             <div>
                                <div className="font-bold text-gray-900 text-lg">{word.en}</div>
                                <div className="text-sm text-gray-500">{word.cn}</div>
                             </div>
                          </div>
                          <button onClick={() => toggleStar(word.id)} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all">
                             <Star size={20} className={starredWords.has(word.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 group-hover:text-gray-300"} />
                          </button>
                       </div>
                     );
                   })
                 )}
              </div>
           </div>

           <button 
             onClick={handleRestart}
             className="w-full max-w-sm py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <RotateCcw size={20} />
             重新测试
           </button>
        </div>
      </div>
    );
  }

  // 听写主界面
  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] relative">
      <StudyHeader currentMode={ViewState.MODE_DICTATION} onSwitchMode={onSwitchMode} onExit={onExit} />

      <div className="flex-1 flex flex-col h-full max-w-xl mx-auto p-4 md:p-6 w-full pb-32 overflow-y-auto custom-scroll">
         {/* 进度条区域 - 统一样式 */}
        <div className="w-full max-w-xl mx-auto mb-2">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{currentIndex + 1} / {words.length}</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                className="bg-gray-900 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                ></div>
            </div>
        </div>

        {/* 听写核心区域 */}
        <div className="flex-1 flex flex-col items-center justify-start mt-8">
            <div className="mb-6 text-center w-full relative">
                {/* 单词释义和提示按钮 */}
                <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-xl md:text-2xl font-bold text-gray-700">{currentWord.cn.replace(/^[\u4e00-\u9fa5]+\s/, '')}</span>
                    <button 
                        onClick={() => setShowHint(!showHint)} 
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showHint ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        <HelpCircle size={12} />
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                </div>
                
                {/* 手动提示内容 */}
                {showHint && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-lg text-sm font-bold text-orange-400 animate-scale-in z-10 whitespace-nowrap">
                        提示：{currentWord.en}
                    </div>
                )}
            </div>

            {/* 输入框表单 */}
            <form onSubmit={handleSubmit} className="w-full max-w-md relative mb-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                        if (status === 'wrong' && !showErrorAnswer) setStatus('idle');
                        setInput(e.target.value);
                    }}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className={`w-full text-center text-4xl font-black bg-transparent border-b-2 outline-none transition-all py-4 ${
                        status === 'correct' ? 'border-green-500 text-green-500' : 
                        status === 'wrong' ? 'border-red-500 text-red-500 animate-shake' : 
                        'border-gray-200 focus:border-black text-gray-900'
                    } placeholder-gray-200`}
                    placeholder="Type here..."
                    disabled={status === 'correct'}
                />
            </form>

            {/* 错误答案展示区域 */}
            <div className="h-8">
                {showErrorAnswer && (
                    <div className="text-red-500 font-bold text-lg animate-fade-in flex items-center gap-2">
                        <X size={18} strokeWidth={3} />
                        <span>{currentWord.en}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 底部固定数据栏 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-gray-100 p-4 pb-6 flex items-center justify-between z-30 shadow-lg">
          <div className="flex gap-6 md:gap-8 px-4">
             <div className="flex flex-col items-center">
               <span className="text-lg font-black text-blue-500 leading-none">{correctCount}</span>
               <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">正确</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-lg font-black text-red-500 leading-none">{wrongCount}</span>
               <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">错误</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-lg font-black text-gray-800 leading-none">{accuracy}%</span>
               <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">正确率</span>
             </div>
          </div>
          
          <button 
            onClick={handleEndTest} 
            className="mr-2 px-5 py-2.5 border border-red-100 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
          >
            <LogOut size={14} />
            结束测试
          </button>
      </div>
    </div>
  );
};

export default Dictation;
