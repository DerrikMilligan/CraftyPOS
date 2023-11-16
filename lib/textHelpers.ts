
/**
 * Convert a string to title case
 *
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word .replace(word[0], word[0].toUpperCase()))
    .join(' ');
}

