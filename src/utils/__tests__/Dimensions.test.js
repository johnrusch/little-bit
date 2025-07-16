describe('Dimensions Utils', () => {
  let mockDimensions;

  beforeEach(() => {
    jest.resetModules();
    mockDimensions = {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    };

    jest.doMock('react-native', () => ({
      Dimensions: mockDimensions,
    }));
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
    require('../Dimensions');
    expect(mockDimensions.get).toHaveBeenCalledWith('window');
  });

  test('should handle different screen sizes', () => {
    // Mock different screen size
    mockDimensions.get.mockReturnValue({ width: 414, height: 896 });
    
    // Import to get new values
    const { windowWidth: newWidth, windowHeight: newHeight } = require('../Dimensions');
    
    expect(newWidth).toBe(414);
    expect(newHeight).toBe(896);
  });
});