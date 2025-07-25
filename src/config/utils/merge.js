/**
 * Deep merge utility for configuration objects
 * Priority: Later sources override earlier ones
 * @param {...Object} sources
 * @returns {Object}
 */
export const deepMerge = (...sources) => {
  const result = {};

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const resultValue = result[key];

      if (sourceValue === undefined || sourceValue === null) {
        // Skip undefined/null values
        return;
      }

      if (Array.isArray(sourceValue)) {
        // Arrays are replaced, not merged
        result[key] = [...sourceValue];
      } else if (typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        // Recursively merge objects
        result[key] = deepMerge(resultValue || {}, sourceValue);
      } else {
        // Primitive values are replaced
        result[key] = sourceValue;
      }
    });
  }

  return result;
};

/**
 * Removes undefined values from an object recursively
 * @param {Object} obj
 * @returns {Object}
 */
export const removeUndefined = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (value === undefined) {
      return;
    }
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = removeUndefined(value);
    } else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};