import { windowWidth, windowHeight } from '../Dimensions';
import { Dimensions } from 'react-native';

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  },
}));

describe('Dimensions Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export window dimensions', () => {
    expect(windowWidth).toBe(375);
    expect(windowHeight).toBe(812);
  });

  test('should call Dimensions.get with window parameter', () => {
    expect(Dimensions.get).toHaveBeenCalledWith('window');
  });

  test('should handle different screen sizes', () => {
    // Mock different screen size
    Dimensions.get.mockReturnValueOnce({ width: 414, height: 896 });
    
    // Re-import to get new values
    jest.resetModules();
    const { windowWidth: newWidth, windowHeight: newHeight } = require('../Dimensions');
    
    expect(newWidth).toBe(414);
    expect(newHeight).toBe(896);
  });
});