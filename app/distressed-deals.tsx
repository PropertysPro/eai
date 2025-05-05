import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import usePropertyStore from '@/store/property-store';
import PropertyCard from '@/components/PropertyCard';
import { colors as Colors } from '@/constants/colors';
import { usePagination } from '@/hooks/usePagination';

// Placeholder - replace with actual city data source if needed
const CITIES = [
  { label: 'All Cities', value: '' }, // Use empty string instead of null
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Sharjah', value: 'Sharjah' },
];

export default function DistressedDealsScreen() {
  const { distressedDeals, loading, error, fetchDistressedDeals, pagination } = usePropertyStore();
  const [selectedCity, setSelectedCity] = useState<string>(''); // Default to empty string

  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePagination({
    initialPage: 1,
    pageSize: 10,
    totalItems: pagination.totalItems,
  });

  useEffect(() => {
    // Fetch deals when page or city changes. Pass null if city is empty string.
    fetchDistressedDeals(currentPage, selectedCity || null);
  }, [currentPage, selectedCity]);

  const onRefresh = () => {
    // Refetch for the current page and city. Pass null if city is empty string.
    fetchDistressedDeals(currentPage, selectedCity || null);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          placeholder={{ label: 'Select a city...', value: '' }} // Use empty string for placeholder value
          items={CITIES}
          onValueChange={(value) => setSelectedCity(value ?? '')} // Ensure value is not null/undefined
          style={pickerSelectStyles}
          value={selectedCity}
          useNativeAndroidPickerStyle={false} // Recommended for consistent styling
        />
      </View>
      <FlatList
        data={distressedDeals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No distressed deals available</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, !hasPreviousPage && styles.paginationButtonDisabled]}
              onPress={previousPage}
              disabled={!hasPreviousPage}
            >
              <Text style={[styles.paginationButtonText, !hasPreviousPage && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, !hasNextPage && styles.paginationButtonDisabled]}
              onPress={nextPage}
              disabled={!hasNextPage}
            >
              <Text style={[styles.paginationButtonText, !hasNextPage && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    margin: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  paginationButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.border,
  },
  paginationButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: Colors.textLight,
  },
  paginationText: {
    color: Colors.text,
    fontWeight: '500',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background, // Match container background
  },
});

// Define styles for RNPickerSelect separately for clarity
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.card.background, // Corrected path
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.card.background, // Corrected path
  },
  placeholder: {
    color: Colors.textLight,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});
