# jsonMdBridge

A lightweight, dependency-free TypeScript library for converting JSON ↔ Markdown. Perfect for documenting JSON structures, generating readable reports, or building tools that bridge structured data and human-readable formats.

## ✨ Features

- 🔄 **Bidirectional conversion**: Convert JSON to Markdown and Markdown back to JSON
- 🎯 **Zero dependencies**: Lightweight and fast
- 📦 **TypeScript**: Fully typed with comprehensive type definitions
- 🌐 **Universal**: Works in Node.js (ESM + CommonJS) and browser environments
- ⚙️ **Configurable**: Customizable formatting options for both directions
- 🧪 **Well-tested**: Comprehensive test suite with snapshot tests
- 📚 **Well-documented**: Full JSDoc comments and API documentation

## 📦 Installation

```bash
pnpm add jsonmd-bridge
```

```bash
npm install jsonmd-bridge
```

```bash
yarn add jsonmd-bridge
```

## 🚀 Quick Start

```typescript
import { jsonToMarkdown, markdownToJson } from 'jsonmd-bridge';

// Convert JSON to Markdown
const json = {
  name: 'John Doe',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: {
    city: 'New York',
    zip: '10001'
  }
};

const markdown = jsonToMarkdown(json);
console.log(markdown);
// Output:
// - **name**: John Doe
// - **age**: 30
// - **hobbies**:
//   - reading
//   - coding
// - **address**:
//   - **city**: New York
//   - **zip**: 10001

// Convert Markdown back to JSON
const result = markdownToJson(markdown);
console.log(result.data);
// Output: { name: 'John Doe', age: '30', hobbies: [...], ... }
```

## 📖 API Reference

### `jsonToMarkdown(data, options?)`

Converts a JSON value (object, array, or primitive) into a Markdown string.

**Parameters:**
- `data` (`unknown`): The JSON value to convert
- `options` (`JsonToMarkdownOptions`, optional): Configuration options

**Returns:** `string` - Markdown representation of the JSON data

**Options:**
```typescript
interface JsonToMarkdownOptions {
  headingLevel?: number;        // Starting heading level (1-6), default: 1
  indentSize?: number;           // Indentation size in spaces, default: 2
  useNumberedLists?: boolean;    // Use numbered lists for arrays, default: false
  arraysAsTables?: boolean;      // Convert object arrays to tables, default: false
  maxDepth?: number;             // Maximum nesting depth, default: 10
}
```

**Examples:**

```typescript
// Simple object
const obj = { name: 'John', age: 30 };
jsonToMarkdown(obj);
// - **name**: John
// - **age**: 30

// Arrays as tables
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' }
];
jsonToMarkdown(users, { arraysAsTables: true });
// | name | role |
// | --- | --- |
// | Alice | admin |
// | Bob | user |

// Custom indentation
jsonToMarkdown(obj, { indentSize: 4 });

// Numbered lists
const items = ['first', 'second', 'third'];
jsonToMarkdown(items, { useNumberedLists: true });
// 1. first
// 2. second
// 3. third
```

### `markdownToJson(markdown, options?)`

Converts a Markdown string back into a JSON structure.

**Parameters:**
- `markdown` (`string`): The Markdown string to parse
- `options` (`MarkdownToJsonOptions`, optional): Configuration options

**Returns:** `MarkdownToJsonResult` - Object containing parsed data and any errors

**Result Structure:**
```typescript
interface MarkdownToJsonResult {
  data: unknown;        // The parsed JSON value
  errors: string[];     // Non-fatal errors encountered during parsing
}
```

**Options:**
```typescript
interface MarkdownToJsonOptions {
  parseNumberedLists?: boolean;  // Parse numbered lists as arrays, default: true
  parseTables?: boolean;          // Parse tables into arrays of objects, default: true
  camelCaseKeys?: boolean;        // Convert keys to camelCase, default: false
}
```

**Examples:**

```typescript
// Parse simple object
const md = `- **name**: John
- **age**: 30`;

const result = markdownToJson(md);
console.log(result.data);
// { name: 'John', age: '30' }

// Parse table
const tableMd = `| name | age |
| --- | --- |
| John | 30 |
| Jane | 25 |`;

const result = markdownToJson(tableMd);
console.log(result.data);
// [
//   { name: 'John', age: 30 },
//   { name: 'Jane', age: 25 }
// ]

// Camel case keys
const md = `- **first_name**: John
- **last_name**: Doe`;

const result = markdownToJson(md, { camelCaseKeys: true });
console.log(result.data);
// { firstName: 'John', lastName: 'Doe' }
```

## 🔧 Supported Markdown Formats

### JSON to Markdown

The library converts:

- **Objects** → Bullet lists with bold keys
- **Arrays** → Bullet or numbered lists (configurable)
- **Object Arrays** → Markdown tables (when `arraysAsTables: true`)
- **Nested Structures** → Nested lists with proper indentation
- **Primitives** → Plain text values

### Markdown to JSON

The library parses:

- **Key-Value Lists** → Objects (`- **key**: value`)
- **Bullet Lists** → Arrays (`- item`)
- **Numbered Lists** → Arrays (`1. item`)
- **Markdown Tables** → Arrays of objects
- **Nested Structures** → Nested objects/arrays

## 💡 Usage Examples

### Document API Responses

```typescript
const apiResponse = {
  status: 'success',
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ],
    total: 2
  }
};

const documentation = jsonToMarkdown(apiResponse, { arraysAsTables: true });
// Perfect for README files or API documentation
```

### Parse Configuration Files

```typescript
const configMd = `- **app**:
  - **name**: MyApp
  - **version**: 1.0.0
- **database**:
  - **host**: localhost
  - **port**: 5432`;

const result = markdownToJson(configMd);
const config = result.data;
// Use config in your application
```

### Generate Reports

```typescript
const report = {
  date: '2023-01-01',
  metrics: {
    users: 1000,
    revenue: 50000,
    growth: 15.5
  },
  topProducts: [
    { name: 'Product A', sales: 100 },
    { name: 'Product B', sales: 80 }
  ]
};

const reportMd = jsonToMarkdown(report, { arraysAsTables: true });
// Generate beautiful Markdown reports
```

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Generate coverage report:

```bash
pnpm test:coverage
```

## 🛠️ Development

### Building

```bash
pnpm build
```

This generates:
- CommonJS output (`dist/index.js`)
- ESM output (`dist/index.mjs`)
- Type definitions (`dist/index.d.ts`)

### Type Checking

```bash
pnpm typecheck
```

## 📝 TypeScript Support

The library is written in TypeScript and provides full type definitions:

```typescript
import type {
  JsonToMarkdownOptions,
  MarkdownToJsonOptions,
  MarkdownToJsonResult
} from 'jsonmd-bridge';
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/jsonmd-bridge.git
cd jsonmd-bridge

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

### Code Style

- Use TypeScript strict mode
- Follow existing code style
- Add tests for new features
- Update documentation as needed

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript for type safety
- Uses Vitest for fast and reliable testing
- Zero dependencies for minimal bundle size

## 📚 Related Projects

- [marked](https://github.com/markedjs/marked) - Markdown parser (with dependencies)
- [remark](https://github.com/remarkjs/remark) - Markdown processor ecosystem
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - Parse front-matter from markdown

---

Made with ❤️ by the jsonMdBridge contributors
