import { describe, it, expect } from 'vitest';
import { markdownToJson, type MarkdownToJsonOptions } from '../../src/converters/markdownToJson';
import { jsonToMarkdown } from '../../src/converters/jsonToMarkdown';

describe('markdownToJson', () => {
  describe('simple objects', () => {
    it('should convert simple key-value markdown to JSON', () => {
      const md = `- **name**: John
- **age**: 30`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual({
        name: 'John',
        age: '30',
      });
    });

    it('should handle numeric values', () => {
      const md = `- **count**: 42
- **price**: 19.99
- **active**: true
- **disabled**: false`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual({
        count: 42,
        price: 19.99,
        active: true,
        disabled: false,
      });
    });

    it('should handle null values', () => {
      const md = `- **value**: null
- **empty**: _null_`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual({
        value: null,
        empty: null,
      });
    });
  });

  describe('tables', () => {
    it('should parse markdown tables', () => {
      const md = `| name | age | role |
| --- | --- | --- |
| John | 30 | admin |
| Jane | 25 | user |`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
      
      const data = result.data as Array<Record<string, unknown>>;
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        name: 'John',
        age: 30,
        role: 'admin',
      });
      expect(data[1]).toEqual({
        name: 'Jane',
        age: 25,
        role: 'user',
      });
    });

    it('should handle empty table', () => {
      const md = `| col1 | col2 |
| --- | --- |`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as unknown[]).length).toBe(0);
    });
  });

  describe('lists', () => {
    it('should parse bullet lists', () => {
      const md = `- apple
- banana
- cherry`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should parse numbered lists when enabled', () => {
      const md = `1. first
2. second
3. third`;

      const result = markdownToJson(md, { parseNumberedLists: true });
      
      expect(result.errors).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toEqual(['first', 'second', 'third']);
    });
  });

  describe('nested structures', () => {
    it('should parse nested objects', () => {
      const md = `- **user**:
  - **name**: John
  - **age**: 30`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(typeof result.data).toBe('object');
      expect(result.data).toHaveProperty('user');
    });

    it('should handle complex nested structures', () => {
      const md = `- **title**: My Document
- **author**:
  - **name**: John Doe
  - **email**: john@example.com
- **tags**: typescript, markdown, json`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('author');
    });
  });

  describe('options', () => {
    it('should convert keys to camelCase when enabled', () => {
      const md = `- **first_name**: John
- **last_name**: Doe`;

      const result = markdownToJson(md, { camelCaseKeys: true });
      
      expect(result.errors).toEqual([]);
      expect(result.data).toHaveProperty('firstName');
      expect(result.data).toHaveProperty('lastName');
    });

    it('should skip numbered lists when parseNumberedLists is false', () => {
      const md = `1. first
2. second`;

      const result = markdownToJson(md, { parseNumberedLists: false });
      
      // Should not parse as array when disabled
      expect(result.data).not.toEqual(['first', 'second']);
    });

    it('should skip tables when parseTables is false', () => {
      const md = `| name | age |
| --- | --- |
| John | 30 |`;

      const result = markdownToJson(md, { parseTables: false });
      
      // Should not parse as table when disabled
      expect(Array.isArray(result.data)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed markdown gracefully', () => {
      const md = `This is not valid markdown structure
- **incomplete**:`;

      const result = markdownToJson(md);
      
      // Should not throw, but may have errors
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
    });

    it('should handle empty string', () => {
      const result = markdownToJson('');
      
      expect(result.errors).toEqual([]);
      expect(result.data).toBeNull();
    });

    it('should handle table with mismatched columns', () => {
      const md = `| col1 | col2 |
| --- | --- |
| value1 | value2 | value3 |`;

      const result = markdownToJson(md);
      
      // Should report error but continue
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid markdown syntax', () => {
      const md = `- **key**: value
### Heading (not supported)
**bold** (not a key-value)`;

      const result = markdownToJson(md);
      
      // Should still parse what it can
      expect(result).toHaveProperty('data');
    });
  });

  describe('round-trip tests', () => {
    it('should maintain data structure for simple object', () => {
      const original = { name: 'John', age: 30 };
      
      const md = jsonToMarkdown(original);
      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('age');
    });

    it('should handle arrays with objects', () => {
      const original = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const md = jsonToMarkdown(original);
      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in values', () => {
      const md = `- **message**: Hello | world
- **path**: /usr/local/bin`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toHaveProperty('message');
    });

    it('should handle boolean strings', () => {
      const md = `- **isActive**: true
- **isDeleted**: false`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual({
        isActive: true,
        isDeleted: false,
      });
    });

    it('should handle numeric strings', () => {
      const md = `- **count**: 42
- **id**: 12345`;

      const result = markdownToJson(md);
      
      expect(result.errors).toEqual([]);
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBe(42);
      expect(data.id).toBe(12345);
    });
  });
});

