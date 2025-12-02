
import { CATEGORIES, BOOKS, MOCK_WORDS } from '../constants';
import { Word } from '../types';

// 使用相对路径，以便通过 vite.config.ts 中的代理转发请求
export const API_BASE_URL = 'http://localhost:9981';

export interface CategoryData {
  id: number;
  name: string;
}

export interface BookDetailData {
  bookId: number;
  bookName: string;
  totalWords: number;
  learnedWords: number;
  bookIcon: string;
}

export interface WordDetailItem {
  id: number;
  english: string;
  chinese: string;
  phonetic: string;
  sentence: string;
  sentenceTransaction: string;
  wordTypeId: number;
  bookId: number;
  pos: string;
}

export interface StudyDetailItem {
  wordId: number;
  isStarred: boolean;
  isLearned: boolean;
  learningNotes: string | null;
  incorrectCount: number;
  correctCount: number;
  learnCreateTime: string | null;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}

// 登录返回数据结构
export interface LoginResult {
  token: string;
  username: string;
  userId: number;
}

// 获取Token的辅助函数
const getToken = (): string | null => {
  return localStorage.getItem('meow_token');
};

export const fetchCategories = async (): Promise<CategoryData[]> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<CategoryData[]> = await response.json();
    if (json.code === 200) {
      return json.data;
    }
    console.warn('API Error, falling back to mock data:', json.msg);
    return CATEGORIES.map((c, index) => ({ id: index + 1, name: c }));
  } catch (error) {
    console.warn('Network Error or API unavailable, using mock data fallback');
    return CATEGORIES.map((c, index) => ({ id: index + 1, name: c }));
  }
};

export const fetchBooksByCategory = async (categoryId: number): Promise<BookDetailData[]> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/bookDetail?categoryId=${categoryId}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<BookDetailData[]> = await response.json();
    if (json.code === 200) {
      return json.data;
    }
    console.warn('API Error fetching books:', json.msg);
    return [];
  } catch (error) {
    console.warn('Network Error fetching books', error);
    // Fallback logic could go here if needed, but returning empty for now to prefer API data
    return [];
  }
};

export const fetchWordDetail = async (bookId: number | string): Promise<Word[]> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/wordDetail?bookId=${bookId}`, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<WordDetailItem[]> = await response.json();

    if (json.code === 200 && Array.isArray(json.data)) {
        // Map backend data to frontend Word interface
        return json.data.map(item => ({
            id: String(item.id),
            en: item.english,
            cn: item.chinese,
            phonetic: item.phonetic,
            example: item.sentence,
            example_cn: item.sentenceTransaction,
            pos: item.pos,
            isStarred: false // Default, will be updated by study detail later if needed
        }));
    }
    return [];
  } catch (error) {
      console.warn('Network Error fetching words:', error);
      // Fallback to mock words if API fails, just for demo stability
      return MOCK_WORDS; 
  }
};

export const fetchStudyDetail = async (bookId: number | string): Promise<StudyDetailItem[]> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/studyDetail?bookId=${bookId}`, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<StudyDetailItem[]> = await response.json();

    if (json.code === 200 && Array.isArray(json.data)) {
        return json.data;
    }
    return [];
  } catch (error) {
      console.warn('Network Error fetching study details:', error);
      return [];
  }
};

export const login = async (username: string, password: string): Promise<ApiResponse<LoginResult | null>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const json: ApiResponse<LoginResult | null> = await response.json();
    return json;
  } catch (error) {
    console.error('Login API Error Details:', {
      timestamp: new Date().toISOString(),
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: error instanceof Error ? (error as any).cause : 'No cause',
      usernameInput: username,
      targetEndpoint: `${API_BASE_URL}/api/auth/login`,
      networkStatus: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent
      }
    });
    
    throw error;
  }
};

export const register = async (username: string, password: string, activationCode: string): Promise<ApiResponse<LoginResult | null>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, activationCode }), 
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const json: ApiResponse<LoginResult | null> = await response.json();
    return json;
  } catch (error) {
      console.error('Register API Error:', error);
      throw error;
  }
};

export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: headers
    });

    // 即使服务器返回错误（如401），我们也尝试解析JSON，以便调用者可以打印日志
    // 但通常前端无论如何都会清除本地Token
    const json: ApiResponse<null> = await response.json();
    return json;
  } catch (error) {
    console.error('Logout API Error:', error);
    throw error;
  }
};
