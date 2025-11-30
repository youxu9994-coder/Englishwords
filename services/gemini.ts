import { GoogleGenAI } from "@google/genai";

// 初始化Google Gemini API客户端
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 获取单词助记符和例句
 * 调用Gemini模型生成针对特定单词的中文助记符和英文例句
 * @param word 目标单词
 * @param definition 单词释义
 * @returns JSON对象包含 mnemonic (助记符) 和 example (例句)
 */
export const getWordMnemonic = async (word: string, definition: string): Promise<{ mnemonic: string; example: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a short, fun mnemonic (memory aid) in Chinese for the English word "${word}" (meaning: ${definition}) and one simple example sentence in English. 
      Return JSON format: { "mnemonic": "...", "example": "..." }`,
      config: {
        responseMimeType: "application/json", // 强制返回JSON格式
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};