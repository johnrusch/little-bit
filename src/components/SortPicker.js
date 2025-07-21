import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSort, faChevronDown } from "@fortawesome/free-solid-svg-icons";

const SORT_OPTIONS = [
  { label: 'Recent', value: 'createdAt-desc' },
  { label: 'Oldest', value: 'createdAt-asc' },
  { label: 'A-Z', value: 'name-asc' },
  { label: 'Z-A', value: 'name-desc' },
];

const SortPicker = ({ selectedValue, onValueChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === selectedValue) || SORT_OPTIONS[0];

  const handleOptionSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[styles.option, item.value === selectedValue && styles.selectedOption]}
      onPress={() => handleOptionSelect(item.value)}
    >
      <Text style={[styles.optionText, item.value === selectedValue && styles.selectedOptionText]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setModalVisible(true)}>
        <FontAwesomeIcon icon={faSort} size={16} color="#666" style={styles.icon} />
        <Text style={styles.selectedText}>{selectedOption.label}</Text>
        <FontAwesomeIcon icon={faChevronDown} size={12} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort by</Text>
            <FlatList
              data={SORT_OPTIONS}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              scrollEnabled={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SortPicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    minWidth: 120,
  },
  icon: {
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#37AD65',
  },
});