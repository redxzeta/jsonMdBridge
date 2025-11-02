/**
 * jsonMdBridge - A lightweight TypeScript library for converting JSON ↔ Markdown
 * 
 * @packageDocumentation
 */

export {
  jsonToMarkdown,
  type JsonToMarkdownOptions,
} from './converters/jsonToMarkdown';

export {
  markdownToJson,
  type MarkdownToJsonOptions,
  type MarkdownToJsonResult,
} from './converters/markdownToJson';

