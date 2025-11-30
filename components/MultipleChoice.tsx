
import React, { useState, useEffect } from 'react';
import { ViewState, Word } from '../types';
import { Volume2, CheckCircle2, XCircle, RotateCcw, Check, LogOut, X, Star } from 'lucide-react';
import StudyHeader from './StudyHeader';

interface MultipleChoiceProps {
  words: Word[];
  onExit: () => void;
  onSwitchMode: (mode: ViewState) => void;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({ words, onExit, onSwitchMode }) => {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null); // 当前选中的选项索引
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // 是否答对
  const [stats, setStats] = useState({ correct: 0, wrong: 0 }); // 统计数据
  const [isCompleted, setIsCompleted] = useState(false); // 是否完成
  const [results, setResults] = useState<{word: Word, correct: boolean}[]>([]); // 详细记录
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set()); // 收藏状态

  const currentWord = words[index];

  // 初始化收藏状态
  useEffect(() => {
    if (!words) return;
    const initialStars = new Set(words.filter(w => w && w.isStarred).map(w => w.id));
    setStarredWords(initialStars);
  }, [words]);

  // 切换单词收藏状态
  const toggleStar = (wordId: string) => {
    setStarredWords(prev => {
      const next = new Set(prev);
      next.has(wordId) ? next.delete(wordId) : next.add(wordId);
      return next;
    });
  };

  // 生成选项：包含1个正确答案和3个随机干扰项
  const options = React.useMemo(() => {
    if (!currentWord) return [];
    
    const opts = [currentWord.cn]; // 正确答案
    
    // 从其他单词中随机抽取3个干扰项
    const otherWords = words.filter(w => w.id !== currentWord.id);
    for (let i = otherWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherWords[i], otherWords[j]] = [otherWords[j], otherWords[i]];
    }
    opts.push(...otherWords.slice(0, 3).map(w => w.cn));
    
    // 打乱选项顺序
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [currentWord, words]);

  // 处理选项选择
  const handleSelect = (option: string, idx: number) => {
    if (selectedOption !== null) return; // 防止重复点击
    
    setSelectedOption(idx);
    const correct = option === currentWord.cn;
    setIsCorrect(correct);
    
    // 更新统计
    setStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1)
    }));
    
    // 记录结果
    setResults(prev => [...prev, { word: currentWord, correct }]);
    
    // 如果答错，自动加入错题本(收藏)
    if (!correct) {
        setStarredWords(prev => new Set(prev).add(currentWord.id));
    }

    // 朗读单词
    const utterance = new SpeechSynthesisUtterance(currentWord.en);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);

    // 1.5秒后切换下一题
    setTimeout(() => {
        if (index < words.length - 1) {
            setIndex(i => i + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setIsCompleted(true);
        }
    }, 1500);
  };
  
  const handleRestart = () => {
      setIndex(0);
      setStats({ correct: 0, wrong: 0 });
      setResults([]);
      setIsCompleted(false);
      setSelectedOption(null);
      setIsCorrect(null);
  };
  
  const handleEndTest = () => {
      setIsCompleted(true);
  };

  // 安全检查
  if (!currentWord && !isCompleted) return null;

  const totalAnswered = stats.correct + stats.wrong;
  const accuracy = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;

  // 结果页面
  if (isCompleted) {
      return (
        <div className="flex flex-col min-h-screen bg-[#FDFDFD]">
          <StudyHeader currentMode={ViewState.MODE_CHOICE} onSwitchMode={onSwitchMode} onExit={onExit} />
          
          <div className="flex-1 flex flex-col items-center p-6 md:p-12 max-w-3xl mx-auto w-full animate-fade-in pb-24">
             <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ring-gray-50">
                <Check size={40} className="text-white" strokeWidth={3} />
             </div>
             <h2 className="text-3xl font-extrabold text-gray-900 mb-2">测试完成!</h2>
             <p className="text-gray-500 mb-10 font-medium">词义辨析能力不错哦</p>
  
             {/* 统计数据卡片 */}
             <div className="grid grid-cols-3 gap-4 w-full mb-10">
                {[
                    { label: '正确', val: stats.correct, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: '错误', val: stats.wrong, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: '正确率', val: `${accuracy}%`, color: 'text-gray-800', bg: 'bg-gray-100' }
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-6 rounded-3xl flex flex-col items-center justify-center`}>
                        <span className={`text-3xl md:text-4xl font-black ${stat.color} mb-1`}>{stat.val}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</span>
                    </div>
                ))}
             </div>
             
             {/* 错题回顾 */}
             <div className="w-full bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden mb-8 flex-1 min-h-[200px]">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800">错题回顾</h3>
                   <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{results.filter(r => !r.correct).length} words</span>
                </div>
                
                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scroll">
                   {results.filter(r => !r.correct).length === 0 ? (
                     <div className="p-12 text-center text-gray-400 font-medium">Perfect Score! 🎉</div>
                   ) : (
                     results.filter(r => !r.correct).map((res, idx) => (
                         <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 text-red-500 font-bold text-xs">
                                <X size={18} strokeWidth={3} />
                                </div>
                                <div>
                                <div className="font-bold text-gray-900 text-lg">{res.word.en}</div>
                                <div className="text-sm text-gray-500">{res.word.cn}</div>
                                </div>
                            </div>
                            <button onClick={() => toggleStar(res.word.id)} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all group/btn">
                                <Star size={20} className={starredWords.has(res.word.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 group-hover/btn:text-gray-300"} />
                            </button>
                         </div>
                     ))
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

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] relative">
        <StudyHeader 
            currentMode={ViewState.MODE_CHOICE} 
            onSwitchMode={onSwitchMode} 
            onExit={onExit} 
        />

        <div className="flex-1 flex flex-col max-w-xl mx-auto p-4 md:p-6 w-full pb-32">
            {/* 进度条区域 - 统一样式 */}
            <div className="w-full max-w-xl mx-auto mb-2">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{index + 1} / {words.length}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                    className="bg-gray-900 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${((index + 1) / words.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start items-center mt-10">
                {/* 单词展示区 */}
                <div className="text-center mb-6 group cursor-pointer" onClick={() => {
                        const u = new SpeechSynthesisUtterance(currentWord.en);
                        window.speechSynthesis.speak(u);
                    }}>
                    <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight group-hover:scale-105 transition-transform">{currentWord.en}</h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                        <Volume2 size={14} />
                        <span className="text-[10px] font-bold">Listen</span>
                    </div>
                </div>

                {/* 选项卡片区 */}
                <div className="grid gap-3 w-full max-w-md">
                    {options.map((opt, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrectOption = opt === currentWord.cn;
                        
                        // 动态样式计算
                        let cardClass = "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200 font-bold text-base flex items-center justify-between group ";
                        
                        if (selectedOption === null) {
                            // 默认状态
                            cardClass += "border-gray-100 bg-white text-gray-600 shadow-sm hover:border-gray-200 hover:shadow-md hover:-translate-y-1";
                        } else if (isSelected) {
                            // 选中状态：正确(绿) / 错误(红)
                            if (isCorrectOption) {
                                cardClass += "border-green-500 bg-green-50 text-green-700 shadow-md";
                            } else {
                                cardClass += "border-red-500 bg-red-50 text-red-700 shadow-md";
                            }
                        } else if (isCorrectOption) {
                            // 显示正确答案 (即使用户选错了)
                            cardClass += "border-green-500 bg-green-50 text-green-700 shadow-md";
                        } else {
                            // 其他未选且非正确选项，变淡
                            cardClass += "border-gray-50 bg-gray-50 text-gray-300 opacity-50";
                        }

                        return (
                            <button 
                                key={idx}
                                onClick={() => handleSelect(opt, idx)}
                                disabled={selectedOption !== null}
                                className={cardClass}
                            >
                                <span>{opt}</span>
                                {selectedOption !== null && isCorrectOption && <CheckCircle2 className="text-green-500" size={20} />}
                                {isSelected && !isCorrectOption && <XCircle className="text-red-500" size={20} />}
                            </button>
                        );
                    })}
                </div>
            </div>
            
        </div>
        
        {/* 底部固定数据栏 */}
        <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-gray-100 p-4 pb-6 flex items-center justify-between z-30 shadow-lg">
          <div className="flex gap-6 md:gap-8 px-4">
             <div className="flex flex-col items-center">
               <span className="text-lg font-black text-blue-500 leading-none">{stats.correct}</span>
               <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">正确</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-lg font-black text-red-500 leading-none">{stats.wrong}</span>
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

export default MultipleChoice;
