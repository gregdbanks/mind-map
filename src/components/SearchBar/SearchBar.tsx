import React, { useState, useRef, useEffect } from 'react';
import type { Node } from '../../types/mindMap';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  nodes: Node[];
  onNodeSelect: (nodeId: string) => void;
  isVisible?: boolean;
}

interface SearchResult {
  node: Node;
  matchIndex: number;
  matchLength: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  nodes,
  onNodeSelect,
  isVisible = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fuzzy search logic
  const searchNodes = (term: string): SearchResult[] => {
    if (!term.trim()) return [];

    const results: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    nodes.forEach(node => {
      const lowerText = node.text.toLowerCase();
      const matchIndex = lowerText.indexOf(lowerTerm);
      
      if (matchIndex !== -1) {
        results.push({
          node,
          matchIndex,
          matchLength: term.length
        });
      }
    });

    // Sort by relevance: exact matches first, then by position
    return results.sort((a, b) => {
      // Prioritize matches at the beginning
      if (a.matchIndex !== b.matchIndex) {
        return a.matchIndex - b.matchIndex;
      }
      // Then by node text length (shorter = more relevant)
      return a.node.text.length - b.node.text.length;
    }).slice(0, 8); // Limit to 8 results
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
        !dropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
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
        <svg 
          className={styles.searchIcon} 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search nodes... (Ctrl+F)"
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
            ×
          </button>
        )}
      </div>

      {isDropdownOpen && searchResults.length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {searchResults.map((result, index) => (
            <div
              key={result.node.id}
              className={`${styles.dropdownItem} ${
                index === selectedIndex ? styles.selected : ''
              }`}
              onClick={() => handleResultSelect(result.node)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={styles.nodeText}>
                {highlightMatch(
                  result.node.text,
                  result.matchIndex,
                  result.matchLength
                )}
              </div>
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