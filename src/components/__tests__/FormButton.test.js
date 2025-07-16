import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormButton from '../FormButton';

describe('FormButton Component', () => {
  test('renders with correct button title', () => {
    const { getByText } = render(
      <FormButton buttonTitle="Submit" />
    );
    
    expect(getByText('Submit')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FormButton buttonTitle="Click Me" onPress={mockOnPress} />
    );
    
    const button = getByText('Click Me');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('applies correct styles', () => {
    const { getByTestId } = render(
      <FormButton buttonTitle="Styled Button" testID="test-button" />
    );
    
    const button = getByTestId('test-button');
    
    expect(button.props.style).toMatchObject({
      backgroundColor: '#69FAA0',
      borderRadius: 30,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  test('passes additional props to TouchableOpacity', () => {
    const { getByTestId } = render(
      <FormButton 
        buttonTitle="Test Button" 
        testID="form-button"
        accessible={true}
        accessibilityLabel="Submit Form"
      />
    );
    
    const button = getByTestId('form-button');
    
    expect(button.props.testID).toBe('form-button');
    expect(button.props.accessible).toBe(true);
    expect(button.props.accessibilityLabel).toBe('Submit Form');
  });

  test('renders button text with correct styles', () => {
    const { getByText } = render(
      <FormButton buttonTitle="Text Style Test" />
    );
    
    const buttonText = getByText('Text Style Test');
    
    expect(buttonText.props.style).toMatchObject({
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
    });
  });
});