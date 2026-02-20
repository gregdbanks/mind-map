export const cognitoService = {
  signIn: jest.fn().mockResolvedValue(null),
  signUp: jest.fn().mockResolvedValue(null),
  confirmSignUp: jest.fn().mockResolvedValue('SUCCESS'),
  signOut: jest.fn(),
  getCurrentUser: jest.fn().mockReturnValue(null),
  getSession: jest.fn().mockResolvedValue(null),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  confirmPassword: jest.fn().mockResolvedValue(undefined),
};
