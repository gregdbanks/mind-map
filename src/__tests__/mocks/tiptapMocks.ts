import React from 'react';

export const mockEditor = {
  chain: jest.fn().mockReturnThis(),
  focus: jest.fn().mockReturnThis(),
  toggleBold: jest.fn().mockReturnThis(),
  toggleItalic: jest.fn().mockReturnThis(),
  toggleCode: jest.fn().mockReturnThis(),
  toggleBulletList: jest.fn().mockReturnThis(),
  toggleOrderedList: jest.fn().mockReturnThis(),
  toggleCodeBlock: jest.fn().mockReturnThis(),
  run: jest.fn(),
  isActive: jest.fn().mockReturnValue(false),
  getJSON: jest.fn().mockReturnValue({}),
  getHTML: jest.fn().mockReturnValue(''),
  getText: jest.fn().mockReturnValue(''),
  setContent: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Mock TipTap components
jest.mock('@tiptap/react', () => ({
  useEditor: () => mockEditor,
  EditorContent: ({ editor }: any) => {
    return editor ? React.createElement('div', { 'data-testid': 'editor-content' }) : null;
  },
}));

// Mock TipTap extensions
jest.mock('@tiptap/starter-kit', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@tiptap/extension-placeholder', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@tiptap/extension-code-block-lowlight', () => ({
  CodeBlockLowlight: {
    extend: jest.fn(() => ({
      name: 'codeBlock',
      addAttributes: jest.fn(() => ({})),
      addNodeView: jest.fn(),
      addCommands: jest.fn(() => ({})),
      addKeyboardShortcuts: jest.fn(() => ({})),
      addInputRules: jest.fn(() => []),
    })),
    configure: jest.fn().mockReturnThis(),
  },
}));

jest.mock('lowlight', () => ({
  createLowlight: jest.fn(() => ({
    registerLanguage: jest.fn(),
    highlight: jest.fn(),
    highlightAuto: jest.fn(),
    listLanguages: jest.fn(() => []),
  })),
  common: {},
}));

jest.mock('highlight.js/lib/languages/javascript', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/typescript', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/json', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/python', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/rust', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/go', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/cpp', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/java', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/bash', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/yaml', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/sql', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/markdown', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/ruby', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/swift', () => ({}), { virtual: true });
jest.mock('highlight.js/lib/languages/kotlin', () => ({}), { virtual: true });

// Export to make it available to tests
export default {};