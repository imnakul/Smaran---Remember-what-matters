export interface RichTextToken {
  text: string;
  bold?: boolean;
  italic?: boolean;
  highlight?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

interface MarkRule {
  name: keyof Omit<RichTextToken, 'text'>;
  regex: RegExp;
}

const MARK_RULES: MarkRule[] = [
  // Highlight: ==text== or ::text:: or <mark>text</mark>
  { name: 'highlight', regex: /==([\s\S]+?)==/ },
  { name: 'highlight', regex: /::([\s\S]+?)::/ },
  { name: 'highlight', regex: /<mark>([\s\S]+?)<\/mark>/i },

  // Bold: **text** or <b>text</b> or <strong>text</strong>
  { name: 'bold', regex: /\*\*([\s\S]+?)\*\*/ },
  { name: 'bold', regex: /<b>([\s\S]+?)<\/b>/i },
  { name: 'bold', regex: /<strong>([\s\S]+?)<\/strong>/i },

  // Inline Code: `code` or <code>code</code>
  { name: 'code', regex: /`([^`]+?)`/ },
  { name: 'code', regex: /<code>([\s\S]+?)<\/code>/i },

  // Underline: <u>text</u> or __text__
  { name: 'underline', regex: /<u>([\s\S]+?)<\/u>/i },
  { name: 'underline', regex: /__([\s\S]+?)__/ },

  // Strikethrough: ~~text~~ or ~text~ or <s>text</s> or <del>text</del>
  { name: 'strikethrough', regex: /~~([\s\S]+?)~~/ },
  { name: 'strikethrough', regex: /~([\s\S]+?)~/ },
  { name: 'strikethrough', regex: /<s>([\s\S]+?)<\/s>/i },
  { name: 'strikethrough', regex: /<del>([\s\S]+?)<\/del>/i },

  // Italic: *text* or _text_ or <i>text</i> or <em>text</em>
  { name: 'italic', regex: /\*([^*]+?)\*/ },
  { name: 'italic', regex: /_([^_]+?)_/ },
  { name: 'italic', regex: /<i>([\s\S]+?)<\/i>/i },
  { name: 'italic', regex: /<em>([\s\S]+?)<\/em>/i },
];

/**
 * Recursively parses raw text containing markdown/HTML formatting marks
 * into an array of styled tokens.
 */
export function parseRichText(
  rawText: string,
  inheritedMarks: Omit<RichTextToken, 'text'> = {}
): RichTextToken[] {
  if (!rawText) return [];

  // Find the earliest matching mark across all rules
  let earliestMatch: {
    rule: MarkRule;
    match: RegExpExecArray;
    index: number;
  } | null = null;

  for (const rule of MARK_RULES) {
    const match = rule.regex.exec(rawText);
    if (match && match.index !== undefined) {
      if (!earliestMatch || match.index < earliestMatch.index) {
        earliestMatch = {
          rule,
          match,
          index: match.index,
        };
      }
    }
  }

  // If no marks found, return plain text with whatever marks were inherited
  if (!earliestMatch) {
    return [{ text: rawText, ...inheritedMarks }];
  }

  const { rule, match, index } = earliestMatch;
  const fullMatchText = match[0];
  const innerContent = match[1] || '';

  const tokens: RichTextToken[] = [];

  // Text before the match
  if (index > 0) {
    const prefix = rawText.slice(0, index);
    tokens.push(...parseRichText(prefix, inheritedMarks));
  }

  // Parse inner content with the new mark applied
  const nextMarks: Omit<RichTextToken, 'text'> = {
    ...inheritedMarks,
    [rule.name]: true,
  };
  tokens.push(...parseRichText(innerContent, nextMarks));

  // Text after the match
  const afterIndex = index + fullMatchText.length;
  if (afterIndex < rawText.length) {
    const suffix = rawText.slice(afterIndex);
    tokens.push(...parseRichText(suffix, inheritedMarks));
  }

  return tokens;
}

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'bullet'
  | 'quote';

/**
 * Wraps or inserts formatting syntax around a selection range in text.
 */
export function applyFormatting(
  text: string,
  selection: { start: number; end: number },
  action: FormatAction
): { newText: string; newSelection: { start: number; end: number } } {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const selectedText = text.slice(start, end);

  let prefix = '';
  let suffix = '';
  let defaultPlaceholder = '';

  switch (action) {
    case 'bold':
      prefix = '**';
      suffix = '**';
      defaultPlaceholder = 'bold text';
      break;
    case 'italic':
      prefix = '*';
      suffix = '*';
      defaultPlaceholder = 'italic text';
      break;
    case 'highlight':
      prefix = '==';
      suffix = '==';
      defaultPlaceholder = 'highlighted';
      break;
    case 'underline':
      prefix = '<u>';
      suffix = '</u>';
      defaultPlaceholder = 'underlined';
      break;
    case 'strikethrough':
      prefix = '~~';
      suffix = '~~';
      defaultPlaceholder = 'strikethrough';
      break;
    case 'code':
      prefix = '`';
      suffix = '`';
      defaultPlaceholder = 'code';
      break;
    case 'bullet':
      prefix = '• ';
      suffix = '';
      defaultPlaceholder = 'list item';
      break;
    case 'quote':
      prefix = '“';
      suffix = '”';
      defaultPlaceholder = 'quote';
      break;
  }

  if (selectedText.length > 0) {
    // If selected text already starts and ends with the exact prefix and suffix, toggle it off!
    if (
      suffix &&
      selectedText.startsWith(prefix) &&
      selectedText.endsWith(suffix) &&
      selectedText.length >= prefix.length + suffix.length
    ) {
      const unwrapped = selectedText.slice(prefix.length, selectedText.length - suffix.length);
      const newText = text.slice(0, start) + unwrapped + text.slice(end);
      return {
        newText,
        newSelection: {
          start,
          end: start + unwrapped.length,
        },
      };
    }

    // Wrap the selected text
    const wrapped = `${prefix}${selectedText}${suffix}`;
    const newText = text.slice(0, start) + wrapped + text.slice(end);
    return {
      newText,
      newSelection: {
        start,
        end: start + wrapped.length,
      },
    };
  }

  // No text selected: insert placeholder and select it
  const insertion = `${prefix}${defaultPlaceholder}${suffix}`;
  const newText = text.slice(0, start) + insertion + text.slice(start);
  return {
    newText,
    newSelection: {
      start: start + prefix.length,
      end: start + prefix.length + defaultPlaceholder.length,
    },
  };
}
