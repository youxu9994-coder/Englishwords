
import { Book, Category, Word } from './types';

// 定义所有支持的分类列表，用于首页分类导航渲染
export const CATEGORIES = [
  Category.CET4,
  Category.CET6,
  Category.IELTS,
  Category.TOEFL,
  Category.HS,
  Category.MS
];

// 预置的词书数据列表
export const BOOKS: Book[] = [
  {
    id: 'cet4-core',
    title: '四级核心词汇',
    subTitle: '乱序版',
    wordCount: 3309,
    category: Category.CET4,
    coverColor: 'bg-orange-100'
  },
  {
    id: 'cet4-star',
    title: '星火四级词汇',
    subTitle: '原版',
    wordCount: 2370,
    category: Category.CET4,
    coverColor: 'bg-blue-100'
  },
  {
    id: 'cet6-adv',
    title: '六级进阶词汇',
    subTitle: '高频版',
    wordCount: 2100,
    category: Category.CET6,
    coverColor: 'bg-green-100'
  },
  {
    id: 'ielts-red',
    title: '雅思红宝书',
    subTitle: '完整版',
    wordCount: 4500,
    category: Category.IELTS,
    coverColor: 'bg-red-100'
  }
];

// 模拟单词生成器：用于生成带有基本信息和例句的测试数据
const generateWords = (count: number, prefix: string): Word[] => {
  // 基础单词库，包含详细的元数据
  const baseWords = [
    { 
      en: 'abandon', 
      cn: 'v. 放弃，遗弃；n. 放任', 
      phonetic: '/əˈbændən/',
      example: 'He decided to abandon the sinking ship.',
      example_cn: '他决定弃船而逃。'
    },
    // ... (其他单词数据省略，保持原有结构)
    { 
      en: 'ability', 
      cn: 'n. 能力；本领；才能', 
      phonetic: '/əˈbɪləti/',
      example: 'She has the ability to solve complex problems.',
      example_cn: '她有解决复杂问题的能力。'
    },
    { 
      en: 'abnormal', 
      cn: 'adj. 反常的，异常的', 
      phonetic: '/æbˈnɔːrml/',
      example: 'The test results were abnormal.',
      example_cn: '检测结果异常。'
    },
    { 
      en: 'aboard', 
      cn: 'adv. 在船(车、飞行器)上', 
      phonetic: '/əˈbɔːrd/',
      example: 'Welcome aboard!',
      example_cn: '欢迎登机！'
    },
    { 
      en: 'absence', 
      cn: 'n. 缺席；缺乏', 
      phonetic: '/ˈæbsəns/',
      example: 'Her absence was noticed by everyone.',
      example_cn: '大家都注意到了她的缺席。'
    },
    { 
      en: 'absolute', 
      cn: 'adj. 绝对的，完全的', 
      phonetic: '/ˈæbsəluːt/',
      example: 'I have absolute confidence in him.',
      example_cn: '我对他有绝对的信心。'
    },
    { 
      en: 'absorb', 
      cn: 'v. 吸收；吸引...的注意', 
      phonetic: '/əbˈzɔːrb/',
      example: 'Plants absorb nutrients from the soil.',
      example_cn: '植物从土壤中吸收养分。'
    },
    { 
      en: 'abstract', 
      cn: 'adj. 抽象的 n. 摘要', 
      phonetic: '/ˈæbstrækt/',
      example: 'Happiness is an abstract concept.',
      example_cn: '幸福是一个抽象的概念。'
    },
    { 
      en: 'abundant', 
      cn: 'adj. 丰富的，充裕的', 
      phonetic: '/əˈbʌndənt/',
      example: 'We have abundant proof of his guilt.',
      example_cn: '我们要充分的证据证明他有罪。'
    },
    { 
      en: 'abuse', 
      cn: 'v./n. 滥用；虐待', 
      phonetic: '/əˈbjuːs/',
      example: 'He was accused of abuse of power.',
      example_cn: '他被指控滥用职权。'
    },
    { 
      en: 'academic', 
      cn: 'adj. 学术的；学院的', 
      phonetic: '/ˌækəˈdemɪk/',
      example: 'She has a brilliant academic career.',
      example_cn: '她的学术生涯非常辉煌。'
    },
    { 
      en: 'academy', 
      cn: 'n. 学院，研究院', 
      phonetic: '/əˈkædəmi/',
      example: 'He graduated from the military academy.',
      example_cn: '他毕业于军事学院。'
    },
    { 
      en: 'accelerate', 
      cn: 'v. 加速；促进', 
      phonetic: '/əkˈseləreɪt/',
      example: 'The car accelerated to overtake the truck.',
      example_cn: '汽车加速超车。'
    },
    { 
      en: 'accent', 
      cn: 'n. 口音；重音', 
      phonetic: '/ˈæksent/',
      example: 'He speaks with a slight French accent.',
      example_cn: '他说话带有轻微的法国口音。'
    },
    { 
      en: 'acceptance', 
      cn: 'n. 接受；赞同', 
      phonetic: '/əkˈseptəns/',
      example: 'Her acceptance of the award was gracious.',
      example_cn: '她优雅地接受了奖项。'
    },
    { 
      en: 'access', 
      cn: 'n. 通道；入口 v. 接近', 
      phonetic: '/ˈækses/',
      example: 'Do you have access to the internet?',
      example_cn: '你能上网吗？'
    },
    { 
      en: 'accident', 
      cn: 'n. 意外；事故', 
      phonetic: '/ˈæksɪdənt/',
      example: 'It was just an accident.',
      example_cn: '这只是个意外。'
    },
    { 
      en: 'accompany', 
      cn: 'v. 陪伴，伴随', 
      phonetic: '/əˈkʌmpəni/',
      example: 'May I accompany you home?',
      example_cn: '我可以送你回家吗？'
    },
    { 
      en: 'accomplish', 
      cn: 'v. 完成，实现', 
      phonetic: '/əˈkɑːmplɪʃ/',
      example: 'We have much to accomplish today.',
      example_cn: '我们今天有很多事情要完成。'
    },
    { 
      en: 'accordance', 
      cn: 'n. 一致；和谐', 
      phonetic: '/əˈkɔːrdns/',
      example: 'Act in accordance with the rules.',
      example_cn: '按照规则行事。'
    }
  ];

  // 为每个单词添加ID和默认收藏状态
  return baseWords.map((w, i) => ({
    ...w,
    id: `${prefix}-${i}`,
    isStarred: false
  }));
};

// 导出模拟单词数据
export const MOCK_WORDS = generateWords(20, 'word');