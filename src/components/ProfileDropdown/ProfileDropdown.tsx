import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
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

  const handleManageSubscription = async () => {
    setIsOpen(false);
    try {
      const { url } = await apiClient.createPortal();
      window.location.href = url;
    } catch {
      // If no Stripe customer, this will fail — that's fine, just ignore
    }
  };

  return (
    <div className={styles.profileDropdown}>
      <button
        ref={buttonRef}
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        title={user?.email || user?.username || 'Profile'}
      >
        <User size={18} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
            {user?.email && <span className={styles.email}>{user.email}</span>}
          </div>
          <button className={styles.menuButton} onClick={handleManageSubscription}>
            <CreditCard size={14} />
            Manage subscription
          </button>
          <button className={styles.signOutButton} onClick={handleSignOut}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
