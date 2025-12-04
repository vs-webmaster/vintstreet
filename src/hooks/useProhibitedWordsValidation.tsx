import { useState, useCallback, useEffect } from 'react';
import { checkForProhibitedWords } from '@/lib/prohibitedWordsValidation';

interface UseProhibitedWordsValidationProps {
  productName: string;
  productDescription: string;
}

export const useProhibitedWordsValidation = ({
  productName,
  productDescription,
}: UseProhibitedWordsValidationProps) => {
  const [nameErrors, setNameErrors] = useState<string[]>([]);
  const [descriptionErrors, setDescriptionErrors] = useState<string[]>([]);

  const validateField = useCallback(async (field: 'name' | 'description', value: string) => {
    if (!value.trim()) {
      if (field === 'name') setNameErrors([]);
      if (field === 'description') setDescriptionErrors([]);
      return;
    }

    const foundWords = await checkForProhibitedWords(value);
    if (field === 'name') {
      setNameErrors(foundWords);
    } else {
      setDescriptionErrors(foundWords);
    }
  }, []);

  // Debounced validation for product name
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productName) {
        validateField('name', productName);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productName, validateField]);

  // Debounced validation for product description
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productDescription) {
        validateField('description', productDescription);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productDescription, validateField]);

  return { nameErrors, descriptionErrors, validateField };
};
