import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormInput from '../FormInput';

// Mock vector icons
jest.mock('react-native-vector-icons/AntDesign', () => 'AntDesign');

describe('FormInput Component', () => {
  test('renders with placeholder text', () => {
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Enter your email"
        iconType="mail"
      />
    );
    
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  test('displays value when provided', () => {
    const { getByDisplayValue } = render(
      <FormInput 
        labelValue="test@example.com"
        placeholderText="Enter your email"
        iconType="mail"
      />
    );
    
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  test('calls onChangeText when text is entered', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Enter text"
        iconType="user"
        onChangeText={mockOnChangeText}
      />
    );
    
    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'New text');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('New text');
  });

  test('renders with correct icon', () => {
    const { UNSAFE_getByType } = render(
      <FormInput 
        placeholderText="Enter password"
        iconType="lock"
      />
    );
    
    const icon = UNSAFE_getByType('AntDesign');
    expect(icon.props.name).toBe('lock');
    expect(icon.props.size).toBe(25);
    expect(icon.props.color).toBe('#666');
  });

  test('applies secure text entry when specified', () => {
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Enter password"
        iconType="lock"
        secureTextEntry={true}
      />
    );
    
    const input = getByPlaceholderText('Enter password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  test('passes additional props to TextInput', () => {
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Test input"
        iconType="user"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        testID="form-input"
      />
    );
    
    const input = getByPlaceholderText('Test input');
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.testID).toBe('form-input');
  });

  test('sets numberOfLines to 1', () => {
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Single line input"
        iconType="edit"
      />
    );
    
    const input = getByPlaceholderText('Single line input');
    expect(input.props.numberOfLines).toBe(1);
  });

  test('uses correct placeholder text color', () => {
    const { getByPlaceholderText } = render(
      <FormInput 
        placeholderText="Placeholder test"
        iconType="info"
      />
    );
    
    const input = getByPlaceholderText('Placeholder test');
    expect(input.props.placeholderTextColor).toBe('#666');
  });
});