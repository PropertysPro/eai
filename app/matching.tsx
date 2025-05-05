import React from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Filter, ChevronLeft, MessageSquare } from 'lucide-react-native';
import PropertyCard from '@/components/PropertyCard';
import { usePropertyStore } from '@/store/property-store';
import { useChatStore } from '@/store/chat-store';
import { colors as Colors } from '@/constants/colors';

export default function MatchingScreen() {
  const router = useRouter();
  const { matches, markMatchAsViewed } = usePropertyStore();
  const { setPropertyContext } = useChatStore();
  
  const handlePropertyPress = (property: any) => {
    markMatchAsViewed(property.id);
    router.push({
      pathname: '/property-details',
      params: { id: property.id }
    });
  };
  
  const handleAskEllaAI = () => {
    // If user has viewed properties, set the most recent one as context
    const viewedProperties = matches.filter(p => !p.isNew);
    
    if (viewedProperties.length > 0) {
      // Sort by most recently viewed (this is a simplified approach)
      const mostRecentProperty = viewedProperties[0];
      setPropertyContext(mostRecentProperty);
      
      // Navigate to chat with an initial question about properties
      router.push({
        pathname: '/chat',
        params: { 
          initialQuestion: "Can you help me find properties similar to the ones I've viewed?" 
        }
      });
    } else {
      // No viewed properties, just go to chat
      router.push('/chat');
    }
  };
  
  const handleFilterPress = () => {
    Alert.alert(
      'Filters',
      'Filter options would appear here in a real app.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <Stack.Screen 
        options={{
          title: 'Property Matching',
          headerTitleStyle: { color: Colors.text },
          headerStyle: { backgroundColor: Colors.background },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
              <Filter size={20} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Your Matches</Text>
        <Text style={styles.subtitle}>
          Properties that match your preferences
        </Text>
        
        {matches.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onPress={handlePropertyPress}
          />
        ))}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How matching works</Text>
          <Text style={styles.infoText}>
            Ella AI analyzes your preferences and search history to find properties
            that best match your needs. The higher the match percentage, the more
            likely you'll love the property.
          </Text>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.askEllaButton}
        onPress={handleAskEllaAI}
      >
        <MessageSquare size={20} color="white" />
        <Text style={styles.askEllaButtonText}>Ask Ella AI</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for the Ask Ella button
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 24,
  },
  infoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  askEllaButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  askEllaButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});