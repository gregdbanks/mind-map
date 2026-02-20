import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import type { ISignUpResult } from 'amazon-cognito-identity-js';

const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

let userPool: CognitoUserPool | null = null;

function getUserPool(): CognitoUserPool {
  if (!poolId || !clientId) {
    throw new Error('Cognito is not configured');
  }
  if (!userPool) {
    userPool = new CognitoUserPool({ UserPoolId: poolId, ClientId: clientId });
  }
  return userPool;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  email: string;
}

export const cognitoService = {
  signIn: (credentials: LoginCredentials): Promise<CognitoUserSession> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: credentials.username,
        Password: credentials.password,
      });

      const cognitoUser = new CognitoUser({
        Username: credentials.username,
        Pool: getUserPool(),
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
        newPasswordRequired: (userAttributes) => {
          reject({
            code: 'NewPasswordRequired',
            message: 'New password required',
            userAttributes,
            cognitoUser,
          });
        },
      });
    });
  },

  signUp: (data: SignupData): Promise<ISignUpResult> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: data.email,
        }),
      ];

      getUserPool().signUp(
        data.username,
        data.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        }
      );
    });
  },

  confirmSignUp: (username: string, code: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: getUserPool(),
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  },

  signOut: () => {
    try {
      const cognitoUser = getUserPool().getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
    } catch {
      // Cognito not configured — nothing to sign out
    }
  },

  getCurrentUser: () => {
    try {
      return getUserPool().getCurrentUser();
    } catch {
      return null;
    }
  },

  getSession: (): Promise<CognitoUserSession | null> => {
    return new Promise((resolve) => {
      let cognitoUser;
      try {
        cognitoUser = getUserPool().getCurrentUser();
      } catch {
        resolve(null);
        return;
      }
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: any, session: CognitoUserSession | null) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  },

  forgotPassword: (username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: getUserPool(),
      });

      cognitoUser.forgotPassword({
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
      });
    });
  },

  confirmPassword: (username: string, code: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: getUserPool(),
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
      });
    });
  },
};
