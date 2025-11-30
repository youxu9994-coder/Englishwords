import React from 'react';
import { ViewState } from '../types';
import { ArrowLeft, GalleryVerticalEnd, FileEdit, ListChecks, Grid3X3 } from 'lucide-react';

interface StudyHeaderProps {
  currentMode: ViewState;
  onSwitchMode: (mode: ViewState) => void;
  onExit: () => void;
}

// 学习模式顶部导航栏
// 包含：返回按钮、模式切换Tab
export const StudyHeader: React.FC<StudyHeaderProps> = ({ currentMode, onSwitchMode, onExit }) => {
  // 定义所有支持的学习模式及其图标
  const modes = [
    { id: ViewState.MODE_FLASHCARD, icon: GalleryVerticalEnd, label: '单词闪过' },
    { id: ViewState.MODE_DICTATION, icon: FileEdit, label: '听写大师' },
    { id: ViewState.MODE_CHOICE, icon: ListChecks, label: '词义选择' },
    { id: ViewState.MODE_MATCH, icon: Grid3X3, label: '连连看' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* 返回按钮 */}
      <button 
        onClick={onExit}
        className="flex items-center text-gray-500 hover:text-black font-bold text-sm transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-gray-200 transition-colors">
            <ArrowLeft size={16} />
        </div>
        <span className="hidden md:inline">返回列表</span>
      </button>

      {/* 模式切换 Tab栏 */}
      <div className="flex gap-2 md:gap-4 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50">
        {modes.map(mode => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSwitchMode(mode.id)}
              className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-white text-black shadow-sm font-bold scale-100' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50 scale-95'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs md:text-sm whitespace-nowrap hidden sm:inline">
                {mode.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="w-10"></div> {/* 视觉平衡占位符 */}
    </div>
  );
};

export default StudyHeader;