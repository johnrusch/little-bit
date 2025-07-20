import React from 'react';
import { render } from '@testing-library/react-native';
import ProcessingStatusIndicator from '../ProcessingStatusIndicator';

describe('ProcessingStatusIndicator Component', () => {
  test('renders with idle status by default', () => {
    const { getByText } = render(<ProcessingStatusIndicator />);
    
    expect(getByText('Ready to record')).toBeTruthy();
  });

  test('displays uploading status correctly', () => {
    const { getByText } = render(<ProcessingStatusIndicator status="uploading" />);
    
    expect(getByText('Uploading...')).toBeTruthy();
  });

  test('displays processing status with progress', () => {
    const { getByText } = render(
      <ProcessingStatusIndicator status="processing" progress={50} />
    );
    
    expect(getByText('Processing audio...')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });

  test('displays completed status', () => {
    const { getByText } = render(<ProcessingStatusIndicator status="completed" />);
    
    expect(getByText('Processing complete')).toBeTruthy();
  });

  test('displays failed status with error message', () => {
    const errorMessage = 'Network error occurred';
    const { getByText } = render(
      <ProcessingStatusIndicator status="failed" error={errorMessage} />
    );
    
    expect(getByText('Processing failed')).toBeTruthy();
    expect(getByText(errorMessage)).toBeTruthy();
  });

  test('does not show progress bar for non-processing status', () => {
    const { queryByText } = render(
      <ProcessingStatusIndicator status="uploading" progress={50} />
    );
    
    expect(queryByText('50%')).toBeNull();
  });

  test('clamps progress value between 0 and 100', () => {
    const { getByText } = render(
      <ProcessingStatusIndicator status="processing" progress={150} />
    );
    
    expect(getByText('100%')).toBeTruthy();
  });

  test('handles negative progress value by not showing progress bar', () => {
    const { queryByText } = render(
      <ProcessingStatusIndicator status="processing" progress={-10} />
    );
    
    // Progress bar should not be shown for negative values
    expect(queryByText('-10%')).toBeNull();
    expect(queryByText('0%')).toBeNull();
  });

  test('applies custom style correctly', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <ProcessingStatusIndicator 
        status="idle" 
        style={customStyle}
        testID="status-indicator"
      />
    );
    
    const component = getByTestId('status-indicator');
    expect(component.props.style).toContainEqual(customStyle);
  });

  test('truncates long error messages', () => {
    const longError = 'This is a very long error message that should be truncated to prevent layout issues in the UI';
    const { getByText } = render(
      <ProcessingStatusIndicator status="failed" error={longError} />
    );
    
    expect(getByText(longError)).toBeTruthy();
  });
});