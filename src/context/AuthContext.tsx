import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cognitoService } from '../services/cognitoService';

export interface AuthUser {
  username: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => void;
  forgotPassword: (username: string) => Promise<void>;
  confirmPassword: (username: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await cognitoService.getSession();
        if (session && session.isValid()) {
          const idToken = session.getIdToken().decodePayload();
          setUser({
            username: idToken['cognito:username'] || idToken['sub'],
            email: idToken['email'] || '',
          });
        }
      } catch {
        // No valid session — user stays null
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const session = await cognitoService.signIn({ username, password });
    const idToken = session.getIdToken().decodePayload();
    setUser({
      username: idToken['cognito:username'] || idToken['sub'],
      email: idToken['email'] || '',
    });
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    await cognitoService.signUp({ username, password, email });
  }, []);

  const confirmSignUp = useCallback(async (username: string, code: string) => {
    await cognitoService.confirmSignUp(username, code);
  }, []);

  const signOut = useCallback(() => {
    cognitoService.signOut();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (username: string) => {
    await cognitoService.forgotPassword(username);
  }, []);

  const confirmPassword = useCallback(async (username: string, code: string, newPassword: string) => {
    await cognitoService.confirmPassword(username, code, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
        forgotPassword,
        confirmPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
