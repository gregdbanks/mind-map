/**
 * Utility to detect programming language from code content
 */

interface LanguagePattern {
  language: string;
  patterns: RegExp[];
  keywords?: string[];
  priority?: number;
}

const languagePatterns: LanguagePattern[] = [
  // JSON - High priority
  {
    language: 'json',
    priority: 10,
    patterns: [
      /^\s*\{[\s\S]*\}\s*$/,
      /^\s*\[[\s\S]*\]\s*$/,
      /"[^"]+"\s*:\s*["{[0-9]/,
    ],
  },
  // YAML
  {
    language: 'yaml',
    priority: 8,
    patterns: [
      /^---/m,
      /^[a-zA-Z_-]+:\s*$/m,
      /^-\s+[a-zA-Z_-]+:/m,
      /^[a-zA-Z_-]+:\s*\|/m,
    ],
    keywords: ['apiVersion:', 'kind:', 'metadata:', 'spec:'],
  },
  // JavaScript/TypeScript
  {
    language: 'javascript',
    patterns: [
      /\b(const|let|var|function|class|import|export|from|require)\b/,
      /\b(async|await|return|if|else|for|while|try|catch)\b/,
      /\b(console\.log|document\.|window\.)/,
      /\b(useState|useEffect|useCallback|useMemo)\b/, // React hooks
    ],
    keywords: ['const', 'let', 'var', 'function', 'class', 'import', 'export'],
  },
  {
    language: 'typescript',
    patterns: [
      /\b(interface|type|enum|namespace|declare|implements)\b/,
      /:\s*(string|number|boolean|void|any|unknown|never)\b/,
      /<[A-Z]\w*>/,
      /\b(public|private|protected|readonly)\b/,
    ],
  },
  // Python
  {
    language: 'python',
    patterns: [
      /\b(def|class|import|from|if|elif|else|for|while|try|except|finally)\b/,
      /\b(print|len|range|str|int|list|dict|set)\b/,
      /__[a-zA-Z]+__/,
      /^\s*@\w+/m,
    ],
    keywords: ['def', 'class', 'import', 'from', 'if', 'elif', 'else'],
  },
  // SQL
  {
    language: 'sql',
    patterns: [
      /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i,
      /\b(TABLE|DATABASE|INDEX|VIEW|PROCEDURE|FUNCTION)\b/i,
      /\b(JOIN|INNER|LEFT|RIGHT|OUTER|ON|AS|GROUP BY|ORDER BY|HAVING)\b/i,
    ],
  },
  // HTML/XML
  {
    language: 'xml',
    patterns: [
      /^<\?xml/,
      /<[a-zA-Z][\w-]*[^>]*>/,
      /<\/[a-zA-Z][\w-]*>/,
      /<!DOCTYPE/i,
      /xmlns=/,
    ],
  },
  // Bash/Shell
  {
    language: 'bash',
    patterns: [
      /^#!/,
      /\b(echo|cd|ls|mkdir|rm|cp|mv|grep|sed|awk|curl|wget)\b/,
      /\$\{?[A-Z_]+\}?/,
      /\b(if|then|else|elif|fi|for|do|done|while|case|esac)\b/,
    ],
  },
  // Markdown
  {
    language: 'markdown',
    patterns: [
      /^#{1,6}\s+/m,
      /^\*\s+/m,
      /^-\s+/m,
      /^\d+\.\s+/m,
      /\[.*\]\(.*\)/,
      /^```/m,
      /^\|.*\|/m,
    ],
  },
];

export function detectCodeLanguage(code: string): string | null {
  if (!code || code.trim().length === 0) {
    return null;
  }

  const trimmedCode = code.trim();
  const codeLines = trimmedCode.split('\n');
  const firstLine = codeLines[0]?.trim() || '';

  // Check for shebang
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node')) return 'javascript';
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
  }

  // Score each language
  const scores: { [key: string]: number } = {};

  languagePatterns.forEach(({ language, patterns, keywords, priority = 1 }) => {
    let score = 0;

    // Check patterns
    patterns.forEach((pattern) => {
      if (pattern.test(trimmedCode)) {
        score += priority;
      }
    });

    // Check keywords
    if (keywords) {
      keywords.forEach((keyword) => {
        if (trimmedCode.includes(keyword)) {
          score += 0.5;
        }
      });
    }

    if (score > 0) {
      scores[language] = score;
    }
  });

  // Special checks for ambiguous cases
  if (scores.javascript && scores.typescript) {
    // If we have TypeScript-specific patterns, prefer TypeScript
    if (scores.typescript > scores.javascript) {
      delete scores.javascript;
    } else {
      delete scores.typescript;
    }
  }

  // Get the language with the highest score
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function formatCode(code: string, _language: string | null): string {
  // Basic formatting - just trim and ensure consistent line endings
  let formatted = code.trim();
  
  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n');
  
  // Remove trailing whitespace from each line
  formatted = formatted.split('\n')
    .map(line => line.trimEnd())
    .join('\n');
  
  // Remove multiple consecutive empty lines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted;
}