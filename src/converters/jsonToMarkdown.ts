/**
 * Configuration options for JSON to Markdown conversion.
 */
export interface JsonToMarkdownOptions {
  /**
   * Starting heading level (1-6).
   * @default 1
   */
  headingLevel?: number;
  /**
   * Indentation size for nested structures (spaces).
   * @default 2
   */
  indentSize?: number;
  /**
   * Whether to use numbered lists for arrays.
   * @default false
   */
  useNumberedLists?: boolean;
  /**
   * Whether to convert arrays to tables when possible.
   * @default false
   */
  arraysAsTables?: boolean;
  /**
   * Maximum depth for nested structures before truncation.
   * @default 10
   */
  maxDepth?: number;
}

/**
 * Converts a JSON value to a Markdown string representation.
 *
 * @param data - The JSON value to convert (object, array, or primitive)
 * @param options - Configuration options for the conversion
 * @returns A Markdown string representation of the JSON data
 *
 * @example
 * ```typescript
 * const json = { name: "John", age: 30 };
 * const md = jsonToMarkdown(json);
 * // Returns: "- **name**: John\n- **age**: 30
 * ```
 */
export function jsonToMarkdown(
  data: unknown,
  options: JsonToMarkdownOptions = {}
): string {
  const {
    headingLevel = 1,
    indentSize = 2,
    useNumberedLists = false,
    arraysAsTables = false,
    maxDepth = 10,
  } = options;

  return convertValue(data, 0, headingLevel, indentSize, useNumberedLists, arraysAsTables, maxDepth);
}

/**
 * Internal function to convert a value recursively.
 */
function convertValue(
  value: unknown,
  depth: number,
  headingLevel: number,
  indentSize: number,
  useNumberedLists: boolean,
  arraysAsTables: boolean,
  maxDepth: number
): string {
  if (depth > maxDepth) {
    return `_... (max depth reached)_`;
  }

  const indent = ' '.repeat(depth * indentSize);

  // Handle null and undefined
  if (value === null || value === undefined) {
    return String(value);
  }

  // Handle primitives
  if (typeof value !== 'object') {
    if (typeof value === 'string') {
      // Escape special Markdown characters in strings
      return escapeMarkdown(value);
    }
    return String(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (arraysAsTables && value.length > 0 && isObjectArray(value)) {
      return arrayToTable(value, depth, indentSize, maxDepth);
    }

    if (value.length === 0) {
      return `${indent}- _empty array_`;
    }

    const items = value.map((item, index) => {
      const prefix = useNumberedLists ? `${index + 1}.` : '-';
      const itemContent = convertValue(
        item,
        depth + 1,
        headingLevel,
        indentSize,
        useNumberedLists,
        arraysAsTables,
        maxDepth
      );
      return `${indent}${prefix} ${itemContent}`;
    });

    return items.join('\n');
  }

  // Handle objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    
    if (entries.length === 0) {
      return `${indent}_empty object_`;
    }

    const items = entries.map(([key, val]) => {
      const keyStr = `**${escapeMarkdown(key)}**:`;
      const valStr = convertValue(
        val,
        depth + 1,
        headingLevel,
        indentSize,
        useNumberedLists,
        arraysAsTables,
        maxDepth
      );

      // If value is a primitive, put it on the same line
      if (isPrimitive(val)) {
        return `${indent}- ${keyStr} ${valStr}`;
      }

      // If value is an object or array, put key on first line, value indented below
      if (typeof val === 'object' && val !== null) {
        return `${indent}- ${keyStr}\n${valStr}`;
      }

      return `${indent}- ${keyStr} ${valStr}`;
    });

    return items.join('\n');
  }

  return String(value);
}

/**
 * Check if an array contains only objects (suitable for table conversion).
 */
function isObjectArray(arr: unknown[]): boolean {
  return arr.length > 0 && arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
}

/**
 * Convert an array of objects to a Markdown table.
 */
function arrayToTable(
  arr: Record<string, unknown>[],
  depth: number,
  indentSize: number,
  _maxDepth: number
): string {
  if (arr.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  arr.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  const keys = Array.from(allKeys);

  if (keys.length === 0) {
    return '';
  }

  const indent = ' '.repeat(depth * indentSize);
  const headerRow = `| ${keys.map(k => escapeMarkdown(String(k))).join(' | ')} |`;
  const separatorRow = `| ${keys.map(() => '---').join(' | ')} |`;
  
  const rows = arr.map(obj => {
    const cells = keys.map(key => {
      const value = obj[key];
      let cellValue: string;
      
      if (value === null || value === undefined) {
        cellValue = '_null_';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        cellValue = '_object_';
      } else if (Array.isArray(value)) {
        cellValue = `_array[${value.length}]_`;
      } else {
        cellValue = escapeMarkdown(String(value));
      }
      
      return cellValue;
    });
    return `| ${cells.join(' | ')} |`;
  });

  return [headerRow, separatorRow, ...rows].map(row => indent + row).join('\n');
}

/**
 * Check if a value is a primitive type.
 */
function isPrimitive(value: unknown): boolean {
  return value === null || 
         value === undefined || 
         typeof value === 'string' || 
         typeof value === 'number' || 
         typeof value === 'boolean';
}

/**
 * Escape special Markdown characters in strings.
 */
function escapeMarkdown(text: string): string {
  // Escape pipe characters (used in tables)
  return text.replace(/\|/g, '\\|');
}

