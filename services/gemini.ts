// Google GenAI 服务已移除，以避免在特定地区无法访问的问题。
// 此文件保留作为占位符，防止导入报错。

/**
 * 获取单词助记符和例句 (Mock实现)
 * 原功能调用Gemini模型，现已禁用。
 */
export const getWordMnemonic = async (word: string, definition: string): Promise<{ mnemonic: string; example: string } | null> => {
  // 返回 null，表示未启用 AI 功能
  return Promise.resolve(null);
};