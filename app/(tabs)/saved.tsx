import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors as Colors } from '@/constants/colors';
import usePropertyStore from '@/store/property-store';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';
import { useAuth } from '@/context/auth-context';

export default function SavedScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { properties, loading, error, fetchProperties, pagination } = usePropertyStore();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all properties when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadAllProperties();
    }
  }, [isAuthenticated, currentPage]);

  // Function to load all properties
  const loadAllProperties = async () => {
    try {
      await fetchProperties({}, currentPage);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadAllProperties();
    setRefreshing(false);
  };

  // Handle pagination
  const handleLoadMore = () => {
    if (currentPage < pagination.totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle property press
  const handlePropertyPress = (property: Property) => {
    router.push({
      pathname: '/property-details',
      params: { id: property.id },
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Saved Properties</Text>
          <Text style={styles.subtitle}>Please log in to view your saved properties</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Properties</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadAllProperties}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : properties && properties.length > 0 ? (
        <FlatList
          data={properties}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.propertiesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            currentPage < pagination.totalPages ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>No Properties Found</Text>
          <Text style={styles.subtitle}>Check back later for new listings</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text style={styles.browseButtonText}>Browse Discover</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  propertiesList: {
    padding: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
