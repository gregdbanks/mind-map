import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { detectCodeLanguage } from '../../utils/codeLanguageDetector';

/**
 * Enhanced CodeBlock extension with automatic language detection
 */
export const EnhancedCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const { languageClassPrefix } = this.options;
          if (!languageClassPrefix) return null;
          
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter(className => className.startsWith(languageClassPrefix))
            .map(className => className.replace(languageClassPrefix, ''));
          const language = languages[0];
          if (!language) {
            return null;
          }
          return language;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.language) {
            return null;
          }
          const { languageClassPrefix } = this.options;
          return {
            class: languageClassPrefix ? languageClassPrefix + attributes.language : undefined,
            'data-language': attributes.language,
          };
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Override the default behavior to add language detection
      'Mod-Alt-c': () => {
        const { selection, doc } = this.editor.state;
        const { from, to } = selection;
        const text = doc.textBetween(from, to, ' ');
        
        // Detect language from selected text
        const detectedLang = detectCodeLanguage(text);
        
        return this.editor.commands.toggleCodeBlock({
          language: detectedLang || '',
        });
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCodeBlockWithAutoDetect: (content: string) => ({ commands }: { commands: any }) => {
        const detectedLang = detectCodeLanguage(content);
        return commands.setCodeBlock({
          language: detectedLang || '',
        });
      },
    };
  },
});