import { describe, it, expect } from 'vitest';
import { jsonToMarkdown } from '../../src/converters/jsonToMarkdown';

describe('jsonToMarkdown', () => {
  describe('simple objects', () => {
    it('should convert a simple object to markdown', () => {
      const json = { name: 'John', age: 30 };
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('**name**:');
      expect(result).toContain('John');
      expect(result).toContain('**age**:');
      expect(result).toContain('30');
    });

    it('should handle empty objects', () => {
      const json = {};
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('empty object');
    });

    it('should handle primitive values', () => {
      expect(jsonToMarkdown('hello')).toBe('hello');
      expect(jsonToMarkdown(42)).toBe('42');
      expect(jsonToMarkdown(true)).toBe('true');
      expect(jsonToMarkdown(null)).toBe('null');
      expect(jsonToMarkdown(undefined)).toBe('undefined');
    });
  });

  describe('nested structures', () => {
    it('should convert nested objects', () => {
      const json = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      };
      
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('**user**:');
      expect(result).toContain('**name**:');
      expect(result).toContain('John');
      expect(result).toContain('**address**:');
      expect(result).toContain('**city**:');
      expect(result).toContain('New York');
    });

    it('should handle arrays', () => {
      const json = {
        fruits: ['apple', 'banana', 'cherry'],
      };
      
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('**fruits**:');
      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('cherry');
    });

    it('should handle nested arrays', () => {
      const json = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      };
      
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('**matrix**:');
    });

    it('should handle mixed structures', () => {
      const json = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
        metadata: {
          count: 2,
          version: '1.0',
        },
      };
      
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('**users**:');
      expect(result).toContain('**name**:');
      expect(result).toContain('**age**:');
      expect(result).toContain('**metadata**:');
    });
  });

  describe('options', () => {
    it('should respect indentSize option', () => {
      const json = {
        a: {
          b: 'value',
        },
      };
      
      const result2 = jsonToMarkdown(json, { indentSize: 2 });
      const result4 = jsonToMarkdown(json, { indentSize: 4 });
      
      expect(result2).toMatch(/^  -/m);
      expect(result4).toMatch(/^    -/m);
    });

    it('should use numbered lists when useNumberedLists is true', () => {
      const json = ['apple', 'banana', 'cherry'];
      
      const result = jsonToMarkdown(json, { useNumberedLists: true });
      
      expect(result).toContain('1.');
      expect(result).toContain('2.');
      expect(result).toContain('3.');
    });

    it('should convert object arrays to tables when arraysAsTables is true', () => {
      const json = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const result = jsonToMarkdown(json, { arraysAsTables: true });
      
      expect(result).toContain('|');
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).toContain('John');
      expect(result).toContain('30');
    });

    it('should respect maxDepth option', () => {
      const json = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  deep: 'value',
                },
              },
            },
          },
        },
      };
      
      const result = jsonToMarkdown(json, { maxDepth: 3 });
      
      expect(result).toContain('max depth');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const json: unknown[] = [];
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('empty array');
    });

    it('should handle special characters in strings', () => {
      const json = {
        message: 'Hello | world',
      };
      
      const result = jsonToMarkdown(json);
      
      expect(result).toContain('Hello');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = jsonToMarkdown({ createdAt: date });
      
      expect(result).toContain('2023');
    });

    it('should handle very deep nesting gracefully', () => {
      let json: any = {};
      let current = json;
      
      for (let i = 0; i < 15; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`];
      }
      
      const result = jsonToMarkdown(json, { maxDepth: 10 });
      
      expect(result).toContain('max depth');
    });
  });
});

