// Test the Dimensions utility
describe('Dimensions Utils', () => {
  let Dimensions;
  
  beforeEach(() => {
    // Clear all module caches
    jest.resetModules();
    
    // Mock react-native module
    jest.doMock('react-native', () => ({
      Dimensions: {
        get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
      },
    }));
    
    // Get reference to mocked Dimensions
    Dimensions = require('react-native').Dimensions;
  });

  afterEach(() => {
    jest.dontMock('react-native');
  });

  test('should export window dimensions', () => {
    const { windowWidth, windowHeight } = require('../Dimensions');
    expect(windowWidth).toBe(375);
    expect(windowHeight).toBe(812);
  });

  test('should call Dimensions.get with window parameter', () => {
    // Import the module which will trigger Dimensions.get calls
    require('../Dimensions');
    expect(Dimensions.get).toHaveBeenCalledWith('window');
    expect(Dimensions.get).toHaveBeenCalledTimes(2); // Called twice for width and height
  });

  test('should handle different screen sizes', () => {
    // Mock different screen size
    Dimensions.get.mockReturnValue({ width: 414, height: 896 });
    
    // Re-import to get new values
    const { windowWidth: newWidth, windowHeight: newHeight } = require('../Dimensions');
    
    expect(newWidth).toBe(414);
    expect(newHeight).toBe(896);
  });
});