/**
 * Configuration options for Markdown to JSON conversion.
 */
export interface MarkdownToJsonOptions {
  /**
   * Whether to parse arrays as numbered lists (1., 2., etc.).
   * @default true
   */
  parseNumberedLists?: boolean;
  /**
   * Whether to parse Markdown tables into arrays of objects.
   * @default true
   */
  parseTables?: boolean;
  /**
   * Whether to convert keys to camelCase.
   * @default false
   */
  camelCaseKeys?: boolean;
}

/**
 * Result of Markdown to JSON conversion.
 */
export interface MarkdownToJsonResult {
  /**
   * The parsed JSON value.
   */
  data: unknown;
  /**
   * Any errors encountered during parsing (non-fatal).
   */
  errors: string[];
}

/**
 * Converts a Markdown string back into a JSON structure.
 *
 * @param markdown - The Markdown string to convert
 * @param options - Configuration options for the conversion
 * @returns A result object containing the parsed JSON data and any errors
 *
 * @example
 * ```typescript
 * const md = "- **name**: John\n- **age**: 30";
 * const result = markdownToJson(md);
 * // Returns: { data: { name: "John", age: "30" }, errors: [] }
 * ```
 */
export function markdownToJson(
  markdown: string,
  options: MarkdownToJsonOptions = {}
): MarkdownToJsonResult {
  const {
    parseNumberedLists = true,
    parseTables = true,
    camelCaseKeys = false,
  } = options;

  const errors: string[] = [];
  let data: unknown;

  try {
    const lines = markdown.split('\n').map(line => line.trim());
    
    // Check if content is a table
    if (parseTables && isTable(lines)) {
      data = parseTable(lines, errors, camelCaseKeys);
    } else {
      // Parse as structured content (lists, key-value pairs)
      data = parseContent(lines, 0, errors, parseNumberedLists, camelCaseKeys).value;
    }
  } catch (error) {
    errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    data = null;
  }

  return { data, errors };
}

/**
 * Check if lines form a Markdown table.
 */
function isTable(lines: string[]): boolean {
  if (lines.length < 2) {
    return false;
  }

  // Look for table pattern: header | separator | rows
  const headerRow = lines.find(line => line.startsWith('|') && line.endsWith('|'));
  if (!headerRow) {
    return false;
  }

  const headerIndex = lines.indexOf(headerRow);
  if (headerIndex === -1 || headerIndex >= lines.length - 1) {
    return false;
  }

  const separatorRow = lines[headerIndex + 1];
  return separatorRow ? /^\|\s*-+\s*\|/.test(separatorRow) : false;
}

/**
 * Parse a Markdown table into an array of objects.
 */
function parseTable(
  lines: string[],
  errors: string[],
  camelCaseKeys: boolean
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  
  // Find table boundaries
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && lines[i].endsWith('|')) {
      if (startIndex === -1) {
        startIndex = i;
      }
    } else if (startIndex !== -1) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    errors.push('Table header not found');
    return result;
  }

  // Parse header
  const headerLine = lines[startIndex];
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0)
    .map(h => camelCaseKeys ? toCamelCase(h) : h);

  // Skip separator row (startIndex + 1)
  for (let i = startIndex + 2; i < endIndex; i++) {
    const row = lines[i];
    if (!row.startsWith('|') || !row.endsWith('|')) {
      continue;
    }

    const cells = row
      .split('|')
      .map(c => c.trim())
      .filter((_, idx) => idx > 0 && idx <= headers.length); // Skip first empty from split

    if (cells.length !== headers.length) {
      errors.push(`Row ${i - startIndex - 1}: column count mismatch`);
      continue;
    }

    const rowObj: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      let cellValue: unknown = cells[idx];

      // Try to parse cell value
      cellValue = parseCellValue(cells[idx]);

      rowObj[header] = cellValue;
    });

    result.push(rowObj);
  }

  return result;
}

/**
 * Parse a cell value, attempting type inference.
 */
function parseCellValue(cell: string): unknown {
  const trimmed = cell.trim();
  
  // Check for null/undefined indicators
  if (trimmed === '_null_' || trimmed === 'null' || trimmed === '') {
    return null;
  }

  // Check for boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Check for number
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^-?\d*\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Check for special markers
  if (trimmed.startsWith('_') && trimmed.endsWith('_')) {
    const inner = trimmed.slice(1, -1);
    if (inner === 'object') return {};
    if (inner === 'empty array') return [];
    if (inner === 'empty object') return {};
    if (/^array\[\d+\]$/.test(inner)) {
      return [];
    }
  }

  // Return as string (remove markdown emphasis if present)
  return trimmed.replace(/^_|_$/g, '');
}

/**
 * Parse structured content (lists, key-value pairs).
 */
function parseContent(
  lines: string[],
  startIndex: number,
  errors: string[],
  parseNumberedLists: boolean,
  camelCaseKeys: boolean
): { value: unknown; nextIndex: number } {
  if (startIndex >= lines.length) {
    return { value: null, nextIndex: startIndex };
  }

  const line = lines[startIndex];
  
  // Check for bullet list item
  if (line.startsWith('- ')) {
    const content = line.slice(2).trim();
    
    // Check if it's a key-value pair
    if (content.includes('**') && content.includes(':')) {
      const keyValueMatch = content.match(/\*\*(.+?)\*\*:\s*(.+)/);
      if (keyValueMatch) {
        const key = camelCaseKeys ? toCamelCase(keyValueMatch[1]) : keyValueMatch[1];
        let value: unknown = keyValueMatch[2].trim();
        
        // Try to parse the value
        value = parseCellValue(String(value));
        
        // Check if next lines belong to this value (nested structure)
        let nextIndex = startIndex + 1;
        if (nextIndex < lines.length && lines[nextIndex].startsWith('  ')) {
          const nested = parseContent(lines, nextIndex, errors, parseNumberedLists, camelCaseKeys);
          if (nested.value !== null) {
            value = nested.value;
            nextIndex = nested.nextIndex;
          }
        }
        
        const obj: Record<string, unknown> = { [key]: value };
        
        // Check if there are more items at the same level
        if (nextIndex < lines.length && lines[nextIndex].startsWith('- ')) {
          const more = parseContent(lines, nextIndex, errors, parseNumberedLists, camelCaseKeys);
          if (typeof more.value === 'object' && more.value !== null && !Array.isArray(more.value)) {
            Object.assign(obj, more.value);
            nextIndex = more.nextIndex;
          }
        }
        
        return { value: obj, nextIndex };
      }
    }
    
    // Regular list item
    let value: unknown = parseCellValue(content);
    
    // Collect consecutive list items
    const items: unknown[] = [value];
    let nextIndex = startIndex + 1;
    
    while (nextIndex < lines.length && lines[nextIndex].startsWith('- ')) {
      const itemContent = lines[nextIndex].slice(2).trim();
      items.push(parseCellValue(itemContent));
      nextIndex++;
    }
    
    return { value: items.length === 1 ? items[0] : items, nextIndex };
  }
  
  // Check for numbered list item
  if (parseNumberedLists && /^\d+\.\s/.test(line)) {
    const content = line.replace(/^\d+\.\s+/, '').trim();
    let value: unknown = parseCellValue(content);
    
    const items: unknown[] = [value];
    let nextIndex = startIndex + 1;
    
    while (nextIndex < lines.length && /^\d+\.\s/.test(lines[nextIndex])) {
      const itemContent = lines[nextIndex].replace(/^\d+\.\s+/, '').trim();
      items.push(parseCellValue(itemContent));
      nextIndex++;
    }
    
    return { value: items, nextIndex };
  }
  
  // Empty or unrecognized line
  return { value: null, nextIndex: startIndex + 1 };
}

/**
 * Convert a string to camelCase.
 */
function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '');
}

