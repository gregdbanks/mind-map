import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EnhancedCodeBlock } from './EnhancedCodeBlock';
import { common, createLowlight } from 'lowlight';
// Import additional languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';

import {
  FiBold,
  FiItalic,
  FiCode,
  FiList,
  FiAlignLeft,
} from 'react-icons/fi';
import styles from './RichTextEditor.module.css';
import { detectCodeLanguage, formatCode } from '../../utils/codeLanguageDetector';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Register additional languages if available (not in test environment)
if (typeof lowlight.register === 'function') {
  lowlight.register('javascript', javascript);
  lowlight.register('typescript', typescript);
  lowlight.register('json', json);
  lowlight.register('yaml', yaml);
  lowlight.register('python', python);
  lowlight.register('bash', bash);
  lowlight.register('sql', sql);
  lowlight.register('xml', xml);
  lowlight.register('markdown', markdown);

  // Add aliases for better detection
  if (typeof lowlight.registerAlias === 'function') {
    lowlight.registerAlias('yaml', ['yml']);
    lowlight.registerAlias('javascript', ['js']);
    lowlight.registerAlias('typescript', ['ts']);
    lowlight.registerAlias('bash', ['shell', 'sh']);
  }
}

interface RichTextEditorProps {
  content?: any;
  contentType?: 'html' | 'tiptap' | 'markdown' | 'plain';
  onChange: (content: any, html: string, plainText?: string) => void;
  placeholder?: string;
  className?: string;
  minimal?: boolean;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  contentType = 'tiptap',
  onChange,
  placeholder = 'Write something...',
  className = '',
  minimal = false,
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use EnhancedCodeBlock instead
      }),
      Placeholder.configure({
        placeholder,
      }),
      EnhancedCodeBlock.configure({
        lowlight,
        defaultLanguage: null,
        languageClassPrefix: 'language-',
        HTMLAttributes: {
          class: 'hljs',
          spellcheck: 'false',
        },
      }),
    ],
    content: contentType === 'tiptap' ? content : content || '',
    editable: !readOnly,
    onUpdate: ({ editor }: { editor: any }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      const plainText = editor.getText();
      onChange(json, html, plainText);
    },
    editorProps: {
      attributes: {
        class: styles.content,
      },
      handlePaste: (view: any, event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const pastedText = clipboardData.getData('text/plain');
        if (!pastedText) return false;

        // Only auto-detect code if it has multiple lines and strong code indicators
        const lines = pastedText.split('\n');
        const hasMultipleLines = lines.length > 1;
        
        // Check for very strong code patterns
        const hasStrongCodePattern = 
          // JSON object or array
          (pastedText.trim().startsWith('{') && pastedText.trim().endsWith('}') && pastedText.includes('"')) ||
          (pastedText.trim().startsWith('[') && pastedText.trim().endsWith(']') && pastedText.includes('"')) ||
          // Function definitions
          /^(function|def|class|import|export|const|let|var)\s+/m.test(pastedText) ||
          // HTML/XML
          (pastedText.includes('<') && pastedText.includes('>') && pastedText.includes('</'));
        
        if (hasMultipleLines && hasStrongCodePattern) {
          const detectedLang = detectCodeLanguage(pastedText);
          
          if (detectedLang) {
            // Prevent default paste
            event.preventDefault();
            
            // Format the code
            const formattedCode = formatCode(pastedText, detectedLang);
            
            // Insert as code block with detected language
            const { state, dispatch } = view;
            
            const codeBlock = state.schema.nodes.codeBlock.create(
              { language: detectedLang },
              state.schema.text(formattedCode)
            );
            
            const tr = state.tr.replaceSelectionWith(codeBlock);
            dispatch(tr);
            
            return true;
          }
        }
        
        return false;
      },
    },
  });

  // Update editor content when props change
  React.useEffect(() => {
    if (editor && content !== undefined) {
      if (contentType === 'tiptap' && content) {
        const currentJSON = JSON.stringify(editor.getJSON());
        const newJSON = JSON.stringify(content);
        if (currentJSON !== newJSON) {
          editor.commands.setContent(content);
        }
      } else if (contentType === 'html' && content) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== content) {
          editor.commands.setContent(content);
        }
      } else if (contentType === 'plain' && content) {
        const currentText = editor.getText();
        if (currentText !== content) {
          editor.commands.setContent(content);
        }
      } else if (!content) {
        // Clear the editor if no content
        editor.commands.clearContent();
      }
    }
  }, [content, contentType, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }> = ({ onClick, active, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${active ? styles.buttonActive : ''}`}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className={`${styles.editor} ${minimal ? styles.minimal : ''} ${readOnly ? styles.readOnly : ''} ${className}`}>
      {!readOnly && (
        <div className={styles.toolbar}>
          <div className={styles.group}>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <FiBold />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <FiItalic />
            </MenuButton>
            <MenuButton
              onClick={() => {
                const { from, to } = editor.state.selection;
                // If there's a selection, toggle code on it
                if (from !== to) {
                  editor.chain().focus().toggleCode().run();
                } else {
                  // If no selection, insert a zero-width space with code mark
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: 'text',
                      text: '\u200B', // Zero-width space
                      marks: [{ type: 'code' }]
                    })
                    .run();
                }
              }}
              active={editor.isActive('code')}
              title="Inline Code (Ctrl+E)"
            >
              <FiCode />
            </MenuButton>
          </div>

          <div className={styles.separator} />

          <div className={styles.group}>
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'paragraph') {
                  editor.chain().focus().setParagraph().run();
                } else if (value.startsWith('heading')) {
                  const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3;
                  editor.chain().focus().toggleHeading({ level }).run();
                }
              }}
              value={
                editor.isActive('heading', { level: 1 })
                  ? 'heading1'
                  : editor.isActive('heading', { level: 2 })
                  ? 'heading2'
                  : editor.isActive('heading', { level: 3 })
                  ? 'heading3'
                  : 'paragraph'
              }
              className={styles.select}
            >
              <option value="paragraph">Normal</option>
              <option value="heading1">Heading 1</option>
              <option value="heading2">Heading 2</option>
              <option value="heading3">Heading 3</option>
            </select>
          </div>

          <div className={styles.separator} />

          <div className={styles.group}>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <FiList />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>1.</span>
            </MenuButton>
          </div>

          <div className={styles.separator} />

          <div className={styles.group}>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Code Block"
            >
              {'</>'}
            </MenuButton>
          </div>

          {editor.isActive('codeBlock') && (
            <>
              <div className={styles.separator} />
              <div className={styles.group}>
                <select
                  onChange={(e) => {
                    editor.chain().focus().setCodeBlock({ language: e.target.value }).run();
                  }}
                  className={styles.select}
                  value={editor.getAttributes('codeBlock').language || ''}
                >
                  <option value="">Auto-detect</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                  <option value="python">Python</option>
                  <option value="bash">Bash/Shell</option>
                  <option value="sql">SQL</option>
                  <option value="xml">HTML/XML</option>
                  <option value="markdown">Markdown</option>
                </select>
                
                <MenuButton
                  onClick={() => {
                    // Get current code block content
                    const { selection } = editor.state;
                    const node = selection.$from.parent;
                    if (node.type.name === 'codeBlock') {
                      const currentCode = node.textContent;
                      const language = editor.getAttributes('codeBlock').language || null;
                      
                      // Auto-detect language if not set
                      const detectedLang = language || detectCodeLanguage(currentCode);
                      const formattedCode = formatCode(currentCode, detectedLang);
                      
                      // Replace the code block with formatted version
                      editor.chain()
                        .focus()
                        .clearNodes()
                        .setCodeBlock({ language: detectedLang })
                        .insertContent(formattedCode)
                        .run();
                    }
                  }}
                  title="Format code"
                >
                  <FiAlignLeft />
                </MenuButton>
              </div>
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;