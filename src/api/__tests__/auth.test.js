import AUTH from '../auth';
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

jest.mock('aws-amplify/auth');
jest.mock('aws-amplify/utils');

describe('AUTH Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  describe('logIn', () => {
    it('should successfully log in a user and return userId', async () => {
      const mockUser = { userId: 'test-user-123', username: 'testuser' };
      
      signIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: null
      });
      getCurrentUser.mockResolvedValue(mockUser);

      const result = await AUTH.logIn('testuser', 'password123');

      expect(signIn).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      });
      expect(getCurrentUser).toHaveBeenCalled();
      expect(Hub.dispatch).toHaveBeenCalledWith('auth', {
        event: 'signedIn',
        data: mockUser
      });
      expect(result).toBe('test-user-123');
    });

    it('should return username when userId is not available', async () => {
      const mockUser = { username: 'testuser' };
      
      signIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: null
      });
      getCurrentUser.mockResolvedValue(mockUser);

      const result = await AUTH.logIn('testuser', 'password123');

      expect(result).toBe('testuser');
    });

    it('should return null when user is not fully signed in', async () => {
      signIn.mockResolvedValue({
        isSignedIn: false,
        nextStep: { signInStep: 'CONFIRM_SIGN_UP' }
      });

      const result = await AUTH.logIn('testuser', 'password123');

      expect(getCurrentUser).not.toHaveBeenCalled();
      expect(Hub.dispatch).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle login errors gracefully', async () => {
      const error = new Error('Invalid credentials');
      signIn.mockRejectedValue(error);

      const result = await AUTH.logIn('testuser', 'wrongpassword');

      expect(console.error).toHaveBeenCalledWith('Login error:', 'Invalid credentials');
      expect(result).toBeNull();
    });

    it('should handle getCurrentUser errors gracefully', async () => {
      signIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: null
      });
      getCurrentUser.mockRejectedValue(new Error('User fetch failed'));

      const result = await AUTH.logIn('testuser', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockResponse = { userId: 'new-user-456' };
      
      signUp.mockResolvedValue(mockResponse);

      const result = await AUTH.signUp(newUser);

      expect(signUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
        options: {
          autoSignIn: {
            authFlowType: 'USER_PASSWORD_AUTH'
          }
        }
      });
      expect(result).toEqual({
        username: 'test@example.com',
        userSub: 'new-user-456'
      });
    });

    it('should handle signup errors gracefully', async () => {
      const newUser = {
        email: 'invalid@example.com',
        password: 'weak'
      };
      const error = new Error('Password too weak');
      signUp.mockRejectedValue(error);

      const result = await AUTH.signUp(newUser);

      expect(console.log).toHaveBeenCalledWith('Error signing up', error);
      expect(result).toBeNull();
    });

    it('should handle missing user data', async () => {
      const result = await AUTH.signUp({});

      expect(signUp).toHaveBeenCalledWith({
        username: undefined,
        password: undefined,
        options: {
          autoSignIn: {
            authFlowType: 'USER_PASSWORD_AUTH'
          }
        }
      });
    });
  });

  describe('logOut', () => {
    it('should successfully log out a user', async () => {
      signOut.mockResolvedValue();

      const result = await AUTH.logOut();

      expect(signOut).toHaveBeenCalled();
      expect(Hub.dispatch).toHaveBeenCalledWith('auth', {
        event: 'signedOut'
      });
      expect(result).toBe(true);
    });

    it('should handle logout errors gracefully', async () => {
      const error = new Error('Logout failed');
      signOut.mockRejectedValue(error);

      const result = await AUTH.logOut();

      expect(console.error).toHaveBeenCalledWith('Error logging out:', 'Logout failed');
      expect(result).toBe(false);
    });
  });

  describe('isLoggedIn', () => {
    it('should return userId when user is logged in', async () => {
      const mockUser = { userId: 'logged-in-user-789' };
      getCurrentUser.mockResolvedValue(mockUser);

      const result = await AUTH.isLoggedIn();

      expect(getCurrentUser).toHaveBeenCalled();
      expect(result).toBe('logged-in-user-789');
    });

    it('should return null when user is not logged in', async () => {
      getCurrentUser.mockRejectedValue(new Error('No user'));

      const result = await AUTH.isLoggedIn();

      expect(result).toBeNull();
    });

    it('should handle missing userId gracefully', async () => {
      getCurrentUser.mockResolvedValue({});

      const result = await AUTH.isLoggedIn();

      expect(result).toBeUndefined();
    });
  });

  describe('getUsername', () => {
    it('should return the provided userId', () => {
      const result = AUTH.getUsername('test-user-123');
      expect(result).toBe('test-user-123');
    });

    it('should handle undefined input', () => {
      const result = AUTH.getUsername(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle null input', () => {
      const result = AUTH.getUsername(null);
      expect(result).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login flow with Hub events', async () => {
      const mockUser = { userId: 'integration-user', username: 'integrationtest' };
      
      signIn.mockResolvedValue({ isSignedIn: true });
      getCurrentUser.mockResolvedValue(mockUser);

      await AUTH.logIn('integrationtest', 'password');

      expect(Hub.dispatch).toHaveBeenCalledWith('auth', {
        event: 'signedIn',
        data: mockUser
      });
    });

    it('should handle complete logout flow with Hub events', async () => {
      signOut.mockResolvedValue();

      await AUTH.logOut();

      expect(Hub.dispatch).toHaveBeenCalledWith('auth', {
        event: 'signedOut'
      });
    });
  });
});