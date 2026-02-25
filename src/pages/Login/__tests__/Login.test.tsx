import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

// Mock useAuth from AuthContext
const mockSignIn = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    signIn: mockSignIn,
    user: null,
    isLoading: false,
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login', () => {
  const renderLogin = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign-in heading', () => {
    renderLogin();

    expect(screen.getByText('Sign in to ThoughtNet')).toBeInTheDocument();
  });

  it('renders username and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('password visibility toggle switches input type', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // Find the toggle button (it's a button inside the password wrapper)
    // The toggle button contains the Eye/EyeOff icon
    const toggleButtons = screen.getAllByRole('button');
    // The toggle is a button with type="button" that is not the submit button
    const toggleButton = toggleButtons.find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    expect(toggleButton).toBeTruthy();

    fireEvent.click(toggleButton!);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton!);
    expect(passwordInput.type).toBe('password');
  });

  it('"Forgot password?" link is present', () => {
    renderLogin();

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('"Create account" link is present', () => {
    renderLogin();

    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('submit button shows loading state during sign-in', async () => {
    // Make signIn hang (never resolve) to observe the loading state
    mockSignIn.mockReturnValue(new Promise(() => {}));

    renderLogin();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Sign in');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  it('error messages display on failed sign-in', async () => {
    mockSignIn.mockRejectedValue({
      code: 'NotAuthorizedException',
      message: 'Incorrect username or password.',
    });

    renderLogin();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByText('Sign in');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Incorrect username or password.')).toBeInTheDocument();
    });
  });
});
