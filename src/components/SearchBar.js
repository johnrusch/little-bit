import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const SearchBar = ({ value, onChangeText, placeholder = "Search samples..." }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon icon={faSearch} size={16} color="#666" />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    flexDirection: 'row',
    flex: 1,
    height: 40,
    marginRight: 10,
    paddingHorizontal: 15,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    color: '#333',
    flex: 1,
    fontSize: 16,
  },
});