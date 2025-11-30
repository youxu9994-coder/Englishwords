
import React from 'react';
import { Word } from '../types';
import { X } from 'lucide-react';

interface WordListModalProps {
  listName: string;
  words: Word[];
  onClose: () => void;
}

// "查看全部"单词列表弹窗
const WordListModal: React.FC<WordListModalProps> = ({ listName, words, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-scale-in">
        
        {/* 头部：标题 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{listName} 全部单词</h2>
            <div className="text-sm text-gray-500 mt-1">共 {words.length} 个单词</div>
          </div>
        </div>

        {/* 可滚动的单词列表区域 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {words.map((word, index) => (
              <div 
                key={`${word.id}-${index}`}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-sm text-gray-700 border border-gray-100 transition-colors cursor-default"
              >
                {word.en}
              </div>
            ))}
          </div>
        </div>

        {/* 底部关闭按钮 */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            关闭
          </button>
        </div>

        {/* 移动端右上角关闭图标 */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 sm:hidden"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default WordListModal;
