import React, { useState, useRef, useEffect } from 'react';
import { Search, X, FileText } from 'lucide-react';
import type { Node } from '../../types/mindMap';
import type { NodeNote } from '../../types/notes';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  nodes: Node[];
  onNodeSelect: (nodeId: string) => void;
  isVisible?: boolean;
  notes?: Map<string, NodeNote>;
}

type MatchSource = 'title' | 'note';

interface SearchResult {
  node: Node;
  matchIndex: number;
  matchLength: number;
  matchSource: MatchSource;
  noteSnippet?: string;
  noteMatchIndex?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  nodes,
  onNodeSelect,
  isVisible = true,
  notes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract a short snippet around the match position in note text.
  // Returns { snippet, matchOffset } so highlighting can use the exact offset.
  const getNoteSnippet = (text: string, matchIndex: number, snippetLength: number = 60): { snippet: string; matchOffset: number } => {
    const halfSnippet = Math.floor(snippetLength / 2);
    let start = Math.max(0, matchIndex - halfSnippet);
    const end = Math.min(text.length, matchIndex + halfSnippet);

    // Adjust start to not cut a word
    if (start > 0) {
      const spaceIndex = text.indexOf(' ', start);
      if (spaceIndex !== -1 && spaceIndex < matchIndex) {
        start = spaceIndex + 1;
      }
    }

    let snippet = text.substring(start, end);
    const prefixLen = start > 0 ? 3 : 0;
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return { snippet, matchOffset: matchIndex - start + prefixLen };
  };

  // Get searchable text from a note (prefer plainText, fall back to stripping HTML)
  const getNoteSearchText = (note: NodeNote): string => {
    if (note.plainText) return note.plainText;
    // Strip HTML tags as a fallback
    return note.content.replace(/<[^>]*>/g, '');
  };

  // Search logic: matches node titles and note content
  const searchNodes = (term: string): SearchResult[] => {
    if (!term.trim()) return [];

    const results: SearchResult[] = [];
    const matchedNodeIds = new Set<string>();
    const lowerTerm = term.toLowerCase();

    // First pass: search node titles
    nodes.forEach(node => {
      const lowerText = node.text.toLowerCase();
      const matchIndex = lowerText.indexOf(lowerTerm);

      if (matchIndex !== -1) {
        results.push({
          node,
          matchIndex,
          matchLength: term.length,
          matchSource: 'title'
        });
        matchedNodeIds.add(node.id);
      }
    });

    // Second pass: search note content
    if (notes) {
      nodes.forEach(node => {
        // Skip nodes already matched by title
        if (matchedNodeIds.has(node.id)) return;

        const note = notes.get(node.id);
        if (!note) return;

        const noteText = getNoteSearchText(note);
        const lowerNoteText = noteText.toLowerCase();
        const noteMatchIndex = lowerNoteText.indexOf(lowerTerm);

        if (noteMatchIndex !== -1) {
          const { snippet, matchOffset } = getNoteSnippet(noteText, noteMatchIndex);

          results.push({
            node,
            matchIndex: -1, // No title match
            matchLength: term.length,
            matchSource: 'note',
            noteSnippet: snippet,
            noteMatchIndex: matchOffset
          });
        }
      });
    }

    // Sort by relevance: title matches first, then by position
    return results.sort((a, b) => {
      // Title matches always come before note matches
      if (a.matchSource !== b.matchSource) {
        return a.matchSource === 'title' ? -1 : 1;
      }
      // Within title matches, prioritize matches at the beginning
      if (a.matchSource === 'title' && b.matchSource === 'title') {
        if (a.matchIndex !== b.matchIndex) {
          return a.matchIndex - b.matchIndex;
        }
        // Then by node text length (shorter = more relevant)
        return a.node.text.length - b.node.text.length;
      }
      // Within note matches, sort alphabetically by node title
      return a.node.text.localeCompare(b.node.text);
    }).slice(0, 10); // Limit to 10 results (increased from 8 to accommodate note matches)
  };

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const results = searchNodes(value);
    setSearchResults(results);
    setSelectedIndex(-1);
    setIsDropdownOpen(value.trim().length > 0 && results.length > 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleResultSelect(searchResults[selectedIndex].node);
        } else if (searchResults.length > 0) {
          handleResultSelect(searchResults[0].node);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = (node: Node) => {
    setSearchTerm(node.text);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    onNodeSelect(node.id);
    searchInputRef.current?.blur();
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Element) &&
        !searchInputRef.current?.contains(event.target as Element)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+F)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && isVisible) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isVisible]);

  // Highlight matched text
  const highlightMatch = (text: string, matchIndex: number, matchLength: number) => {
    if (matchIndex === -1) return text;

    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + matchLength);
    const after = text.substring(matchIndex + matchLength);

    return (
      <>
        {before}
        <span className={styles.highlight}>{match}</span>
        {after}
      </>
    );
  };

  if (!isVisible) return null;

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper}>
        <Search className={styles.searchIcon} size={16} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search nodes & notes... (Ctrl+F)"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim() && searchResults.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
              setIsDropdownOpen(false);
              setSelectedIndex(-1);
            }}
            className={styles.clearButton}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isDropdownOpen && searchResults.length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {searchResults.map((result, index) => (
            <div
              key={`${result.node.id}-${result.matchSource}`}
              className={`${styles.dropdownItem} ${
                index === selectedIndex ? styles.selected : ''
              }`}
              onClick={() => handleResultSelect(result.node)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={styles.nodeText}>
                {result.matchSource === 'title'
                  ? highlightMatch(
                      result.node.text,
                      result.matchIndex,
                      result.matchLength
                    )
                  : result.node.text
                }
              </div>
              {result.matchSource === 'note' && result.noteSnippet && (
                <div className={styles.noteMatch}>
                  <FileText size={12} className={styles.noteIcon} />
                  <span className={styles.noteSnippet}>
                    {highlightMatch(
                      result.noteSnippet,
                      result.noteMatchIndex ?? -1,
                      result.matchLength
                    )}
                  </span>
                </div>
              )}
              {result.node.parent && (
                <div className={styles.nodeContext}>
                  in {nodes.find(n => n.id === result.node.parent)?.text || 'Unknown'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};