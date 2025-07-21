import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SearchBar from './SearchBar';
import SortPicker from './SortPicker';

const SoundListHeader = ({ 
  searchText, 
  onSearchChange, 
  sortValue, 
  onSortChange,
  resultsCount,
  totalCount
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        <SearchBar 
          value={searchText} 
          onChangeText={onSearchChange}
        />
        <SortPicker 
          selectedValue={sortValue}
          onValueChange={onSortChange}
        />
      </View>
      {searchText ? (
        <Text style={styles.resultsText}>
          {resultsCount === 0 
            ? 'No matches found' 
            : `Showing ${resultsCount} of ${totalCount} samples`}
        </Text>
      ) : null}
    </View>
  );
};

export default SoundListHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});