
import React, { useState, useEffect } from 'react';
import { ViewState, Word } from '../types';
import { RefreshCw, Trophy, Sparkles } from 'lucide-react';
import StudyHeader from './StudyHeader';

interface MatchGameProps {
  words: Word[];
  onExit: () => void;
  onSwitchMode: (mode: ViewState) => void;
}

// 连连看卡片接口
interface Tile {
  id: string;      // 唯一ID
  text: string;    // 显示文本（英文单词或中文释义）
  wordId: string;  // 关联的单词ID（用于判断配对）
  type: 'en' | 'cn'; // 类型标识
  matched: boolean; // 是否已匹配消除
}

const MatchGame: React.FC<MatchGameProps> = ({ words, onExit, onSwitchMode }) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<string[]>([]); // 记录当前错误的配对，用于显示红色抖动效果
  const [completed, setCompleted] = useState(false);
  
  // 游戏设置状态
  const [pairCount, setPairCount] = useState<6 | 10>(10); // 默认10组
  
  // 统计状态
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, pairCount]);

  // 初始化新游戏
  const startNewGame = () => {
    if (!words || words.length === 0) return;

    // 随机打乱源单词列表
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    // 根据设置取前N个单词
    const count = Math.min(words.length, pairCount);
    const gameWords = shuffledWords.slice(0, count);
    
    const newTiles: Tile[] = [];
    gameWords.forEach(w => {
      // Check if word exists before accessing id
      if (w) {
        // 分别生成英文卡片和中文卡片
        newTiles.push({ id: `en-${w.id}`, text: w.en, wordId: w.id, type: 'en', matched: false });
        newTiles.push({ id: `cn-${w.id}`, text: w.cn.split(' ')[1] || w.cn, wordId: w.id, type: 'cn', matched: false });
      }
    });

    // Fisher-Yates 洗牌算法打乱卡片顺序
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }

    setTiles(newTiles);
    setSelectedTileId(null);
    setWrongPair([]);
    setCompleted(false);
    setMistakes(0);
  };

  // 处理卡片点击事件
  const handleTileClick = (tile: Tile) => {
    // 如果已匹配或正在显示错误动画，则忽略
    if (tile.matched || wrongPair.length > 0) return;
    
    // 如果点击已选中的卡片，取消选中
    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
      return;
    }

    if (!selectedTileId) {
      // 选中第一张卡片
      setSelectedTileId(tile.id);
    } else {
      // 选中第二张卡片，进行配对检查
      const firstTile = tiles.find(t => t.id === selectedTileId);
      if (!firstTile) return;

      if (firstTile.wordId === tile.wordId && firstTile.id !== tile.id) {
        // 配对成功：更新状态为matched
        setTiles(prev => prev.map(t => 
          (t.id === firstTile.id || t.id === tile.id) ? { ...t, matched: true } : t
        ));
        setSelectedTileId(null);
        
        // 检查是否所有卡片都已匹配
        const remaining = tiles.filter(t => !t.matched && t.id !== firstTile.id && t.id !== tile.id).length;
        if (remaining === 0) setCompleted(true);
      } else {
        // 配对失败：记录错误，显示错误动画，延时后重置
        setMistakes(prev => prev + 1);
        setWrongPair([firstTile.id, tile.id]);
        setTimeout(() => {
          setWrongPair([]);
          setSelectedTileId(null);
        }, 800);
      }
    }
  };

  // 统计计算
  const matchedPairs = tiles.length > 0 ? tiles.filter(t => t.matched).length / 2 : 0;
  // 这里的 accuracy 计算简单定义为： 匹配数 / (匹配数 + 错误尝试数)
  const totalMoves = matchedPairs + mistakes;
  const accuracy = totalMoves > 0 ? Math.round((matchedPairs / totalMoves) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] relative">
      {/* 顶部导航栏 */}
      <StudyHeader 
        currentMode={ViewState.MODE_MATCH} 
        onSwitchMode={onSwitchMode} 
        onExit={onExit} 
      />

      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full p-4 md:p-6 pb-32">
        {/* 进度条区域 - 统一样式 */}
        <div className="w-full max-w-xl mx-auto mb-2">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{completed ? '已完成' : '进行中'}</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                className="bg-gray-900 h-full rounded-full transition-all duration-500" 
                style={{ width: completed ? '100%' : `${(tiles.filter(t => t.matched).length / tiles.length) * 100}%` }}
                ></div>
            </div>
        </div>

        {/* 难度/组数切换 - 仅在未完成时显示 */}
        {!completed && (
            <div className="flex justify-start mb-6">
                <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold shadow-inner">
                    <button 
                        onClick={() => setPairCount(6)}
                        className={`px-6 py-1.5 rounded-lg transition-all ${pairCount === 6 ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        6 组
                    </button>
                    <button 
                        onClick={() => setPairCount(10)}
                        className={`px-6 py-1.5 rounded-lg transition-all ${pairCount === 10 ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        10 组
                    </button>
                </div>
            </div>
        )}

        {completed ? (
            // 游戏完成界面
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in -mt-20">
              <div className="relative">
                 <div className="absolute -inset-8 bg-purple-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                 <div className="w-24 h-24 bg-purple-500 rounded-[32px] flex items-center justify-center mb-6 shadow-xl transform rotate-3 relative z-10">
                    <Trophy size={48} className="text-white" />
                 </div>
                 <Sparkles className="absolute -top-4 -right-4 text-purple-400 animate-bounce" size={24} />
              </div>
              
              <h2 className="text-4xl font-black text-gray-900 mb-2">本轮完成!</h2>
              <p className="text-gray-500 mb-10 font-medium">恭喜你完成了本轮练习</p>
              
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-10">
                 <div className="bg-purple-50 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-purple-500">{matchedPairs}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">配对</div>
                 </div>
                 <div className="bg-red-50 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-red-500">{mistakes}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">失误</div>
                 </div>
                 <div className="bg-gray-100 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-gray-800">{accuracy}%</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">正确率</div>
                 </div>
              </div>
              
              <button 
                  onClick={startNewGame}
                  className="px-10 py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                  <RefreshCw size={20} />
                  再玩一轮
              </button>
            </div>
        ) : (
            // 游戏区域：网格布局
            <div className="grid grid-cols-4 gap-2 flex-1 content-start max-w-xl mx-auto w-full">
                {tiles.map(tile => {
                    const isSelected = selectedTileId === tile.id;
                    const isWrong = wrongPair.includes(tile.id);
                    
                    // 基础卡片样式 (3D按钮效果)
                    let baseClass = "relative aspect-[3/2] rounded-xl flex items-center justify-center p-1.5 text-center text-xs md:text-sm font-bold cursor-pointer transition-all duration-100 select-none ";
                    
                    if (tile.matched) {
                        return <div key={tile.id} className="invisible"></div>; // 匹配后隐藏占位
                    } 
                    
                    // 样式逻辑：错误(红色)，选中(黑色)，默认(白色/灰色)
                    if (isWrong) {
                        baseClass += "bg-red-500 text-white border-b-4 border-red-700 animate-shake";
                    } else if (isSelected) {
                        baseClass += "bg-black text-white border-b-4 border-gray-700 -translate-y-1";
                    } else {
                        // 根据中英文类型使用微小的颜色差异
                        if (tile.type === 'en') {
                           baseClass += "bg-white text-gray-700 border border-gray-100 border-b-4 border-b-gray-200 hover:-translate-y-0.5 hover:border-b-purple-200 active:border-b-0 active:translate-y-1 active:border-t-2 active:border-t-transparent shadow-sm";
                        } else {
                           baseClass += "bg-white text-gray-700 border border-gray-100 border-b-4 border-b-gray-200 hover:-translate-y-0.5 hover:border-b-orange-200 active:border-b-0 active:translate-y-1 active:border-t-2 active:border-t-transparent shadow-sm";
                        }
                    }

                    return (
                    <div 
                        key={tile.id} 
                        onClick={() => handleTileClick(tile)}
                        className={baseClass}
                    >
                        {tile.text}
                    </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 底部固定数据栏 - 仅在未完成时显示 */}
      {!completed && (
        <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-gray-100 p-4 pb-6 flex items-center justify-center z-30 shadow-lg">
            <div className="flex gap-8 md:gap-12 px-4">
               <div className="flex flex-col items-center">
                 <span className="text-lg font-black text-blue-500 leading-none">{matchedPairs}</span>
                 <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">正确</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-lg font-black text-red-500 leading-none">{mistakes}</span>
                 <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">错误</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-lg font-black text-gray-800 leading-none">{accuracy}%</span>
                 <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">正确率</span>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MatchGame;
