import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Signup.module.css';

interface CognitoError {
  code?: string;
  message?: string;
}

type Step = 'signup' | 'verify';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signUp, confirmSignUp, signIn } = useAuth();
  const [step, setStep] = useState<Step>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validatePassword = (): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
    if (password !== confirmPw) return 'Passwords do not match.';
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(username, email, password);
      setIsLoading(false);
      setStep('verify');
    } catch (err: unknown) {
      setIsLoading(false);
      const cognitoErr = err as CognitoError;
      if (cognitoErr.code === 'UsernameExistsException') {
        setError('That username is already taken.');
      } else if (cognitoErr.code === 'InvalidPasswordException') {
        setError(cognitoErr.message || 'Password does not meet requirements.');
      } else {
        setError(cognitoErr.message || 'Sign up failed. Please try again.');
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await confirmSignUp(username, code);
      try {
        await signIn(username, password);
        navigate('/');
      } catch {
        setIsLoading(false);
        setError('Account verified. Auto-login failed — please sign in manually.');
        navigate('/login');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const cognitoErr = err as CognitoError;
      if (cognitoErr.code === 'CodeMismatchException') {
        setError('Invalid verification code.');
      } else if (cognitoErr.code === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(cognitoErr.message || 'Verification failed. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {step === 'signup' ? 'Create your account' : 'Verify your email'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        {step === 'signup' ? (
          <form onSubmit={handleSignup} className={styles.form}>
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
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
              <span className={styles.hint}>8+ characters, uppercase, lowercase, number, special character</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                className={styles.input}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <p className={styles.verifyMessage}>
              We sent a verification code to <strong>{email}</strong>
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

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & sign in'}
            </button>
          </form>
        )}

        <div className={styles.links}>
          <span className={styles.linkText}>Already have an account?</span>
          <Link to="/login" className={styles.link}>Sign in</Link>
        </div>

        <Link to="/" className={styles.continueLink}>
          Continue without account
        </Link>
      </div>
    </div>
  );
};

export default Signup;
