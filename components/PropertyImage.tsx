import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, ImageResizeMode } from 'react-native'; // Import standard Image
import { colors as Colors } from '@/constants/colors';
// import { Image as CachedImage, ImageContentFit } from 'expo-image'; // Comment out expo-image

interface PropertyImageProps {
  uri: string;
  style?: any;
  resizeMode?: ImageResizeMode; // Use standard resizeMode
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  uri,
  style,
  resizeMode = 'cover', // Default for standard Image
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

  return (
    <View style={[styles.container, style]}>
      <Image // Use standard Image
        source={{ uri: error ? fallbackImage : uri }}
        style={[styles.image, style]}
        resizeMode={resizeMode} // Use standard prop
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
      {/* Keep loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.background, // Keep background for loading state
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // Or a semi-transparent overlay
  },
});
