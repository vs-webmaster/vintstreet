import { fetchActiveProhibitedWords } from '@/services/prohibitedWords';
import { isFailure } from '@/types/api';

// Cache for prohibited words to avoid repeated database calls
let prohibitedWordsCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchProhibitedWords = async (): Promise<string[]> => {
  // Check if cache is still valid
  const now = Date.now();
  if (prohibitedWordsCache && now - cacheTimestamp < CACHE_DURATION) {
    return prohibitedWordsCache;
  }

  const result = await fetchActiveProhibitedWords();

  if (isFailure(result)) {
    console.error('Error fetching prohibited words:', result.error);
    return [];
  }

  prohibitedWordsCache = result.data;
  cacheTimestamp = now;

  return prohibitedWordsCache;
};

export const clearProhibitedWordsCache = () => {
  prohibitedWordsCache = null;
  cacheTimestamp = 0;
};

export const checkForProhibitedWords = async (text: string): Promise<string[]> => {
  if (!text) return [];

  const prohibitedWords = await fetchProhibitedWords();
  const foundWords: string[] = [];
  const textLower = text.toLowerCase();

  for (const word of prohibitedWords) {
    // Escape special regex characters to prevent ReDoS attacks
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Check for exact whole word matches only
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    if (regex.test(textLower)) {
      foundWords.push(word);
    }
  }

  return foundWords;
};

export const validateProductInput = async (
  productName: string,
  productDescription: string,
): Promise<{ isValid: boolean; foundWords: string[]; message?: string }> => {
  const nameWords = await checkForProhibitedWords(productName);
  const descWords = await checkForProhibitedWords(productDescription);

  const allFoundWords = [...new Set([...nameWords, ...descWords])];

  if (allFoundWords.length > 0) {
    return {
      isValid: false,
      foundWords: allFoundWords,
      message: `Prohibited words detected: ${allFoundWords.join(', ')}. Please remove them and try again.`,
    };
  }

  return {
    isValid: true,
    foundWords: [],
  };
};
