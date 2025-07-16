import { 
  loadingTexts, 
  loggingInTexts, 
  getLoadingText, 
  getLoggingInText, 
  wait 
} from '../loading';

describe('Loading Utils', () => {
  describe('getLoadingText', () => {
    test('returns a string from loadingTexts array', () => {
      const text = getLoadingText();
      expect(loadingTexts).toContain(text);
    });

    test('returns different texts on multiple calls', () => {
      // Mock Math.random to ensure variety
      const mockRandom = jest.spyOn(Math, 'random');
      const results = [];
      
      for (let i = 0; i < loadingTexts.length; i++) {
        mockRandom.mockReturnValueOnce(i / loadingTexts.length);
        results.push(getLoadingText());
      }
      
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults.length).toBeGreaterThan(1);
      
      mockRandom.mockRestore();
    });

    test('handles edge case of Math.random returning 0.999', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.999);
      
      const text = getLoadingText();
      expect(loadingTexts).toContain(text);
      
      mockRandom.mockRestore();
    });
  });

  describe('getLoggingInText', () => {
    test('returns a string from loggingInTexts array', () => {
      const text = getLoggingInText();
      expect(loggingInTexts).toContain(text);
    });

    test('returns different texts on multiple calls', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      const results = [];
      
      for (let i = 0; i < loggingInTexts.length; i++) {
        mockRandom.mockReturnValueOnce(i / loggingInTexts.length);
        results.push(getLoggingInText());
      }
      
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults.length).toBeGreaterThan(1);
      
      mockRandom.mockRestore();
    });
  });

  describe('wait', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns a promise', () => {
      const result = wait(1000);
      expect(result).toBeInstanceOf(Promise);
    });

    test('resolves after specified timeout', async () => {
      const promise = wait(1000);
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      await expect(promise).resolves.toBeUndefined();
    });

    test('handles different timeout values', async () => {
      const promise1 = wait(500);
      const promise2 = wait(2000);
      
      jest.advanceTimersByTime(500);
      await expect(promise1).resolves.toBeUndefined();
      
      jest.advanceTimersByTime(1500);
      await expect(promise2).resolves.toBeUndefined();
    });

    test('handles zero timeout', async () => {
      const promise = wait(0);
      jest.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('Text content', () => {
    test('loadingTexts array is not empty', () => {
      expect(loadingTexts.length).toBeGreaterThan(0);
    });

    test('loggingInTexts array is not empty', () => {
      expect(loggingInTexts.length).toBeGreaterThan(0);
    });

    test('all loading texts are strings', () => {
      loadingTexts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      });
    });

    test('all logging in texts are strings', () => {
      loggingInTexts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      });
    });
  });
});