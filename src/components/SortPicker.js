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
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    flexDirection: 'row',
    height: 40,
    minWidth: 120,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxWidth: 300,
    padding: 20,
    width: '80%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  option: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  optionText: {
    color: '#333',
    fontSize: 16,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  selectedOptionText: {
    color: '#37AD65',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#333',
    fontSize: 16,
    marginRight: 8,
  },
});