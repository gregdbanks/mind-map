import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPassword } from '../ForgotPassword';

const mockForgotPassword = jest.fn();
const mockConfirmPassword = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: mockForgotPassword,
    confirmPassword: mockConfirmPassword,
  }),
}));

describe('ForgotPassword', () => {
  const renderForgotPassword = () =>
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading for password reset', () => {
    renderForgotPassword();

    expect(screen.getByText('Reset your password')).toBeInTheDocument();
  });

  it('renders username field', () => {
    renderForgotPassword();

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('submit calls forgotPassword with username', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    renderForgotPassword();

    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByText('Send reset code');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('testuser');
    });
  });

  it('after request, shows code and new password step', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    renderForgotPassword();

    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  it('password validation rejects passwords shorter than 8 characters', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    renderForgotPassword();

    // Move to reset step
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Reset password'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });

    expect(mockConfirmPassword).not.toHaveBeenCalled();
  });

  it('submit calls confirmPassword with correct args', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockConfirmPassword.mockResolvedValue(undefined);

    renderForgotPassword();

    // Move to reset step
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByText('Reset password'));

    await waitFor(() => {
      expect(mockConfirmPassword).toHaveBeenCalledWith('testuser', '123456', 'newpassword123');
    });
  });

  it('success message shown after reset', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockConfirmPassword.mockResolvedValue(undefined);

    renderForgotPassword();

    // Move to reset step
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    // Complete reset
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByText('Reset password'));

    await waitFor(() => {
      expect(screen.getByText('Your password has been updated.')).toBeInTheDocument();
    });
  });

  it('displays UserNotFoundException error', async () => {
    mockForgotPassword.mockRejectedValue({ code: 'UserNotFoundException' });

    renderForgotPassword();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('No account found with that username.')).toBeInTheDocument();
    });
  });

  it('displays CodeMismatchException error', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockConfirmPassword.mockRejectedValue({ code: 'CodeMismatchException' });

    renderForgotPassword();

    // Move to reset step
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: 'badcode' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByText('Reset password'));

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code.')).toBeInTheDocument();
    });
  });

  it('displays ExpiredCodeException error', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockConfirmPassword.mockRejectedValue({ code: 'ExpiredCodeException' });

    renderForgotPassword();

    // Move to reset step
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByText('Send reset code'));

    await waitFor(() => {
      expect(screen.getByText('Enter new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByText('Reset password'));

    await waitFor(() => {
      expect(screen.getByText('Code has expired. Please request a new one.')).toBeInTheDocument();
    });
  });

  it('"Back to sign in" link is present', () => {
    renderForgotPassword();

    expect(screen.getByText('Back to sign in')).toBeInTheDocument();
  });
});
