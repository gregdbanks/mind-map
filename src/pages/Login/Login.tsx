import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';

interface CognitoError {
  code?: string;
  message?: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(username, password);
      navigate('/');
    } catch (err: unknown) {
      setIsLoading(false);
      const cognitoErr = err as CognitoError;
      if (cognitoErr.code === 'NotAuthorizedException') {
        setError('Incorrect username or password.');
      } else if (cognitoErr.code === 'UserNotFoundException') {
        setError('No account found with that username.');
      } else if (cognitoErr.code === 'UserNotConfirmedException') {
        setError('Please verify your email first.');
      } else {
        setError(cognitoErr.message || 'Sign in failed. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in to ThoughtNet</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>Forgot password?</Link>
          <span className={styles.separator}>|</span>
          <Link to="/signup" className={styles.link}>Create account</Link>
        </div>

        <Link to="/" className={styles.continueLink}>
          Continue without account
        </Link>
      </div>
    </div>
  );
};

export default Login;
