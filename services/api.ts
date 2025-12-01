
import { CATEGORIES, BOOKS } from '../constants';

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

export const login = async (username: string, password: string): Promise<ApiResponse<LoginResult | null>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s Timeout

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
    
    // Mock Fallback for Login to allow app usage if backend is down
    return {
      code: 200,
      data: {
        token: "mock_token_" + Date.now(),
        username: username,
        userId: 888888
      },
      msg: "登录成功 (离线模式)"
    };
  }
};

export const register = async (username: string, password: string): Promise<ApiResponse<LoginResult | null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, activationCode: 'DEFAULT_CODE' }), 
    });

    const json: ApiResponse<LoginResult | null> = await response.json();
    return json;
  } catch (error) {
      console.error('Register API Error:', error);
      return {
          code: 200,
          data: {
              token: "mock_token_" + Date.now(),
              username: username,
              userId: 999999
          },
          msg: "注册成功 (离线模式)"
      };
  }
}
