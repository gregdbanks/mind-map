import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './ProfileDropdown.module.css';

export const ProfileDropdown: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  return (
    <div className={styles.profileDropdown}>
      <button
        ref={buttonRef}
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        title={user?.email || user?.username || 'Profile'}
      >
        <FiUser size={18} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
            {user?.email && <span className={styles.email}>{user.email}</span>}
          </div>
          <button className={styles.signOutButton} onClick={handleSignOut}>
            <FiLogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
