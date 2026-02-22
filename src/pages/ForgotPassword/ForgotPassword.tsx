import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './ForgotPassword.module.css';

interface CognitoError {
  code?: string;
  message?: string;
}

type Step = 'request' | 'reset';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword, confirmPassword } = useAuth();
  const [step, setStep] = useState<Step>('request');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword(username);
      setIsLoading(false);
      setStep('reset');
    } catch (err: unknown) {
      setIsLoading(false);
      const cognitoErr = err as CognitoError;
      if (cognitoErr.code === 'UserNotFoundException') {
        setError('No account found with that username.');
      } else if (cognitoErr.code === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(cognitoErr.message || 'Failed to send reset code.');
      }
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPassword(username, code, newPassword);
      setIsLoading(false);
      setSuccess(true);
    } catch (err: unknown) {
      setIsLoading(false);
      const cognitoErr = err as CognitoError;
      if (cognitoErr.code === 'CodeMismatchException') {
        setError('Invalid verification code.');
      } else if (cognitoErr.code === 'ExpiredCodeException') {
        setError('Code has expired. Please request a new one.');
      } else {
        setError(cognitoErr.message || 'Password reset failed.');
      }
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password reset</h1>
          <p className={styles.message}>Your password has been updated.</p>
          <Link to="/login" className={styles.successLink}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {step === 'request' ? 'Reset your password' : 'Enter new password'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className={styles.form}>
            <p className={styles.message}>
              Enter your username and we'll send a verification code to your email.
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                className={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Sending code...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className={styles.form}>
            <p className={styles.message}>
              Check your email for a verification code.
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="code">Verification code</label>
              <input
                id="code"
                className={styles.input}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="newPassword">New password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="newPassword"
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
