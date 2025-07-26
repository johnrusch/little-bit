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
    backgroundColor: 'white',
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  controlsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  resultsText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
});