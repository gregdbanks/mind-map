import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Signup } from '../Signup';
import { apiClient } from '../../../services/apiClient';

// Mock useAuth from AuthContext
const mockSignUp = jest.fn();
const mockConfirmSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    signUp: mockSignUp,
    confirmSignUp: mockConfirmSignUp,
    signIn: mockSignIn,
    user: null,
    isLoading: false,
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
  }),
}));

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    checkEmailExists: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Signup', () => {
  const renderSignup = () =>
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Create your account" heading', () => {
    renderSignup();

    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders username, email, password, confirm password fields', () => {
    renderSignup();

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('password validation: too short', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Ab1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Ab1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });
  });

  it('password validation: no uppercase', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'abcdefgh1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain an uppercase letter.')).toBeInTheDocument();
    });
  });

  it('password validation: no lowercase', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'ABCDEFGH1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'ABCDEFGH1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain a lowercase letter.')).toBeInTheDocument();
    });
  });

  it('password validation: no number', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Abcdefgh!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain a number.')).toBeInTheDocument();
    });
  });

  it('password validation: no special character', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh1' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Abcdefgh1' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain a special character.')).toBeInTheDocument();
    });
  });

  it('password mismatch shows error', async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  it('submit calls signUp with correct args', async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser', 'new@example.com', 'StrongPass1!');
    });
  });

  it('after signup, shows verification step', async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Verify your email')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
    expect(screen.getByText(/new@example\.com/)).toBeInTheDocument();
  });

  it('verification code input and submit', async () => {
    mockSignUp.mockResolvedValue(undefined);
    mockConfirmSignUp.mockResolvedValue(undefined);
    mockSignIn.mockResolvedValue(undefined);

    renderSignup();

    // Complete signup form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass1!' } });

    fireEvent.click(screen.getByText('Create account'));

    // Wait for verification step
    await waitFor(() => {
      expect(screen.getByText('Verify your email')).toBeInTheDocument();
    });

    // Enter verification code
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });

    fireEvent.click(screen.getByText('Verify & sign in'));

    await waitFor(() => {
      expect(mockConfirmSignUp).toHaveBeenCalledWith('newuser', '123456');
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('newuser', 'StrongPass1!');
    });
  });

  it('"Already have an account?" link to /login', () => {
    renderSignup();

    expect(screen.getByText('Already have an account?')).toBeInTheDocument();

    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows error when email already exists', async () => {
    (apiClient.checkEmailExists as jest.Mock).mockResolvedValueOnce(true);

    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('error display on failure (UsernameExistsException)', async () => {
    mockSignUp.mockRejectedValue({
      code: 'UsernameExistsException',
      message: 'User already exists',
    });

    renderSignup();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass1!' } });

    fireEvent.click(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('That username is already taken.')).toBeInTheDocument();
    });
  });
});
