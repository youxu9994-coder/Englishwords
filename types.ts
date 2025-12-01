
// 词书分类枚举：定义了应用支持的所有词书类型
export enum Category {
  CET4 = '四级',
  CET6 = '六级',
  IELTS = '雅思',
  TOEFL = '托福',
  HS = '高中',
  MS = '初中'
}

// 单词数据接口：定义单个单词的数据结构
export interface Word {
  id: string;          // 唯一标识符
  en: string;          // 英文单词
  cn: string;          // 中文释义
  phonetic: string;    // 音标
  example?: string;    // 例句 (可选)
  example_cn?: string; // 例句中文翻译 (可选)
  tags?: string[];     // 标签 (可选)
  isStarred?: boolean; // 是否已收藏/标星
}

// 词书数据接口：定义一本词书的基本信息
export interface Book {
  id: string;
  title: string;       // 标题，如"四级核心词汇"
  subTitle: string;    // 副标题，如"乱序版"
  wordCount: number;   // 单词总量
  category: string;    // 所属分类 (Changed from Category enum to string to support API dynamic values)
  coverColor: string;  // 封面背景色 (Tailwind CSS类名)
  learnedCount?: number; // 已学习单词数 (来自API)
}

// 视图状态枚举：用于控制App当前显示的页面/模式
export enum ViewState {
  HOME = 'HOME',                  // 首页
  BOOK_DETAIL = 'BOOK_DETAIL',    // 词书详情页
  MODE_FLASHCARD = 'MODE_FLASHCARD', // 单词闪过模式
  MODE_DICTATION = 'MODE_DICTATION', // 听写大师模式
  MODE_CHOICE = 'MODE_CHOICE',       // 词义选择模式
  MODE_MATCH = 'MODE_MATCH'          // 连连看模式
}

// 学习会话统计信息接口
export interface StudySessionStats {
  correct: number;
  incorrect: number;
  total: number;
}

// 用户信息接口
export interface User {
  username: string; // 用户名 (或手机号)
  email?: string;
}
