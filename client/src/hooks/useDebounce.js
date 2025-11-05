import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value to prevent excessive function calls
 * Useful for expensive operations like validation, API calls, or complex calculations
 * that should not run on every keystroke.
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (recommended: 300-500ms)
 * @returns {any} The debounced value that only updates after the delay period
 * 
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * // API call will only trigger 300ms after user stops typing
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if the value changes before the delay
    // This prevents the debounced value from updating until user stops typing
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;