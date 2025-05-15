import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors as Colors } from '@/constants/colors';

const TypingIndicator = () => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        // Dot 1 animation
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        
        // Dot 2 animation
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        
        // Dot 3 animation
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Restart animation
        animateDots();
      });
    };
    
    animateDots();
    
    return () => {
      // Reset animation values
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 3,
  },
});

export default TypingIndicator;
