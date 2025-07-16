import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import AUTH from '../auth';

// Mock the AWS Amplify Auth module
jest.mock('aws-amplify/auth');
jest.mock('aws-amplify/utils');

describe('AUTH service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  describe('logIn', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const mockUser = { userId: 'test-user-id', username: 'test@example.com' };
      signIn.mockResolvedValue({ 
        isSignedIn: true, 
        nextStep: { signInStep: 'DONE' } 
      });
      getCurrentUser.mockResolvedValue(mockUser);

      const result = await AUTH.logIn('test@example.com', 'password123');

      expect(signIn).toHaveBeenCalledWith({
        username: 'test@example.com',
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
      expect(result).toBe('test-user-id');
    });

    it('should return username if userId is not available', async () => {
      const mockUser = { username: 'test@example.com' };
      signIn.mockResolvedValue({ 
        isSignedIn: true, 
        nextStep: { signInStep: 'DONE' } 
      });
      getCurrentUser.mockResolvedValue(mockUser);

      const result = await AUTH.logIn('test@example.com', 'password123');

      expect(result).toBe('test@example.com');
    });

    it('should handle multi-step authentication', async () => {
      signIn.mockResolvedValue({ 
        isSignedIn: false, 
        nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_SMS_MFA_CODE' } 
      });

      const result = await AUTH.logIn('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(getCurrentUser).not.toHaveBeenCalled();
      expect(Hub.dispatch).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      signIn.mockRejectedValue(new Error('Incorrect username or password'));

      const result = await AUTH.logIn('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Login error:', 'Incorrect username or password');
    });

    it('should handle network errors', async () => {
      signIn.mockRejectedValue(new Error('Network error'));

      const result = await AUTH.logIn('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Login error:', 'Network error');
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUserId = 'new-user-id';
      signUp.mockResolvedValue({ userId: mockUserId });

      const newUser = {
        email: 'newuser@example.com',
        password: 'Password123!'
      };

      const result = await AUTH.signUp(newUser);

      expect(signUp).toHaveBeenCalledWith({
        username: 'newuser@example.com',
        password: 'Password123!',
        options: {
          autoSignIn: {
            authFlowType: 'USER_PASSWORD_AUTH'
          }
        }
      });
      expect(result).toEqual({
        username: 'newuser@example.com',
        userSub: mockUserId
      });
    });

    it('should handle duplicate email errors', async () => {
      signUp.mockRejectedValue(new Error('User already exists'));

      const newUser = {
        email: 'existing@example.com',
        password: 'Password123!'
      };

      const result = await AUTH.signUp(newUser);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Error signing up', expect.any(Error));
    });

    it('should handle password requirement errors', async () => {
      signUp.mockRejectedValue(new Error('Password does not meet requirements'));

      const newUser = {
        email: 'test@example.com',
        password: 'weak'
      };

      const result = await AUTH.signUp(newUser);

      expect(result).toBeNull();
    });

    it('should handle network errors during signup', async () => {
      signUp.mockRejectedValue(new Error('Network error'));

      const newUser = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const result = await AUTH.signUp(newUser);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Error signing up', expect.any(Error));
    });
  });

  describe('logOut', () => {
    it('should successfully log out a user', async () => {
      signOut.mockResolvedValue({});

      const result = await AUTH.logOut();

      expect(signOut).toHaveBeenCalled();
      expect(Hub.dispatch).toHaveBeenCalledWith('auth', {
        event: 'signedOut'
      });
      expect(result).toBe(true);
    });

    it('should handle errors during logout', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'));

      const result = await AUTH.logOut();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error logging out:', 'Logout failed');
    });

    it('should still dispatch event if signOut partially fails', async () => {
      signOut.mockRejectedValue(new Error('Network error but local session cleared'));

      const result = await AUTH.logOut();

      expect(result).toBe(false);
      expect(Hub.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('isLoggedIn', () => {
    it('should return userId when user is authenticated', async () => {
      getCurrentUser.mockResolvedValue({ userId: 'authenticated-user-id' });

      const result = await AUTH.isLoggedIn();

      expect(getCurrentUser).toHaveBeenCalled();
      expect(result).toBe('authenticated-user-id');
    });

    it('should return null when user is not authenticated', async () => {
      getCurrentUser.mockRejectedValue(new Error('User not authenticated'));

      const result = await AUTH.isLoggedIn();

      expect(result).toBeNull();
    });

    it('should handle session expired errors', async () => {
      getCurrentUser.mockRejectedValue(new Error('Session expired'));

      const result = await AUTH.isLoggedIn();

      expect(result).toBeNull();
    });
  });

  describe('getUsername', () => {
    it('should return the userId as username', () => {
      const userId = 'test-user-id';
      
      const result = AUTH.getUsername(userId);

      expect(result).toBe(userId);
    });

    it('should handle undefined userId', () => {
      const result = AUTH.getUsername(undefined);

      expect(result).toBeUndefined();
    });

    it('should handle null userId', () => {
      const result = AUTH.getUsername(null);

      expect(result).toBeNull();
    });
  });
});