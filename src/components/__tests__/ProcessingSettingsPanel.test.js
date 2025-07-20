import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProcessingSettingsPanel from '../ProcessingSettingsPanel';
import { DEFAULT_PROCESSING_SETTINGS } from '../../utils/processingDefaults';

describe('ProcessingSettingsPanel Component', () => {
  const mockOnSettingsChange = jest.fn();
  const mockOnToggleVisibility = jest.fn();

  const defaultProps = {
    settings: DEFAULT_PROCESSING_SETTINGS,
    onSettingsChange: mockOnSettingsChange,
    visible: false,
    onToggleVisibility: mockOnToggleVisibility,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header correctly', () => {
    const { getByText } = render(<ProcessingSettingsPanel {...defaultProps} />);
    
    expect(getByText('Processing Settings')).toBeTruthy();
  });

  test('calls onToggleVisibility when header is pressed', () => {
    const { getByText } = render(<ProcessingSettingsPanel {...defaultProps} />);
    
    const header = getByText('Processing Settings');
    fireEvent.press(header);
    
    expect(mockOnToggleVisibility).toHaveBeenCalledTimes(1);
  });

  test('displays settings when visible is true', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('Create One-Shot')).toBeTruthy();
    expect(getByText('Preserve Original')).toBeTruthy();
    expect(getByText('Silence Threshold')).toBeTruthy();
    expect(getByText('Min Silence Duration')).toBeTruthy();
  });

  test('renders without crashing when visible', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('Processing Settings')).toBeTruthy();
    expect(getByText('Create One-Shot')).toBeTruthy();
  });

  test('onSettingsChange prop is provided', () => {
    expect(typeof defaultProps.onSettingsChange).toBe('function');
  });

  test('settings prop structure is correct', () => {
    expect(defaultProps.settings).toHaveProperty('createOneShot');
    expect(defaultProps.settings).toHaveProperty('silenceThreshold');
    expect(defaultProps.settings).toHaveProperty('minSilenceDuration');
    expect(defaultProps.settings).toHaveProperty('preserveOriginal');
  });

  test('onToggleVisibility prop is provided', () => {
    expect(typeof defaultProps.onToggleVisibility).toBe('function');
  });

  test('displays formatted threshold value', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('-30 dBFS')).toBeTruthy();
  });

  test('displays formatted duration value', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('750 ms')).toBeTruthy();
  });

  test('applies custom style correctly', () => {
    const customStyle = { marginVertical: 16 };
    const { getByTestId } = render(
      <ProcessingSettingsPanel 
        {...defaultProps} 
        style={customStyle}
        testID="settings-panel"
      />
    );
    
    const component = getByTestId('settings-panel');
    expect(component.props.style).toContainEqual(customStyle);
  });

  test('shows appropriate slider labels', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('More Sensitive')).toBeTruthy();
    expect(getByText('Less Sensitive')).toBeTruthy();
    expect(getByText('Quick Crop')).toBeTruthy();
    expect(getByText('Careful Crop')).toBeTruthy();
  });

  test('shows setting descriptions', () => {
    const { getByText } = render(
      <ProcessingSettingsPanel {...defaultProps} visible={true} />
    );
    
    expect(getByText('Automatically crop silence from recordings')).toBeTruthy();
    expect(getByText('Keep unprocessed copy of recording')).toBeTruthy();
    expect(getByText('How quiet audio must be to detect silence')).toBeTruthy();
    expect(getByText('Minimum duration of silence before cropping')).toBeTruthy();
  });
});